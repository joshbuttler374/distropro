import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishReelToPage } from "@/lib/facebook";
import { chargeForPublish } from "@/lib/tokens";
import { tokensPerReel } from "@/lib/utils";
import { moderateContent } from "@/lib/moderation";

/**
 * Vercel Cron entry point. Configure in vercel.json to run every minute.
 *
 * Header check: requires `Authorization: Bearer ${CRON_SECRET}` for security.
 *
 * Behavior: picks up to 50 PENDING jobs whose `scheduledFor <= now`, marks them
 * RUNNING, calls the Facebook publish path, and on SUCCESS atomically charges
 * the user's token balance via the ledger.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const jobs = await prisma.job.findMany({
    where: { status: "PENDING", scheduledFor: { lte: now } },
    take: 50,
    include: { page: true, reel: { include: { source: true } }, user: true },
  });

  const results = [];
  for (const job of jobs) {
    // Acquire row-level lock with an UPDATE … RETURNING-style transition
    const claimed = await prisma.job.updateMany({
      where: { id: job.id, status: "PENDING" },
      data: { status: "RUNNING", startedAt: new Date() },
    });
    if (claimed.count === 0) continue; // another worker grabbed it

    try {
      // Run moderation on title/description before publish
      const moderation = await moderateContent(job.reel.title ?? "");
      if (!moderation.safe) {
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: "FAILED",
            errorMessage: `Moderation blocked: ${moderation.reason}`,
            completedAt: new Date(),
          },
        });
        results.push({ id: job.id, ok: false, reason: "moderation" });
        continue;
      }

      // Pre-flight: ensure user has tokens
      const cost = tokensPerReel(job.reel.source.platform);
      if (job.user.tokenBalance < cost) {
        await prisma.job.update({
          where: { id: job.id },
          data: { status: "SKIPPED", errorMessage: "Insufficient tokens", completedAt: new Date() },
        });
        results.push({ id: job.id, ok: false, reason: "insufficient_tokens" });
        continue;
      }

      // Publish
      const pub = await publishReelToPage({
        pageId: job.page.pageId,
        pageAccessToken: job.page.accessToken,
        videoUrl: job.reel.videoUrl,
        description: job.reel.title ?? undefined,
      });

      if (pub.success) {
        await chargeForPublish(job.userId, job.id, cost);
        await prisma.job.update({
          where: { id: job.id },
          data: { status: "SUCCESS", tokensCharged: cost, completedAt: new Date() },
        });
        await prisma.event.create({
          data: { userId: job.userId, action: "publish_success", metadata: { jobId: job.id, postId: pub.postId } },
        });
        results.push({ id: job.id, ok: true });
      } else {
        await prisma.job.update({
          where: { id: job.id },
          data: { status: "FAILED", errorMessage: pub.error, completedAt: new Date() },
        });
        await prisma.event.create({
          data: { userId: job.userId, action: "publish_failed", metadata: { jobId: job.id, error: pub.error } },
        });
        results.push({ id: job.id, ok: false, reason: pub.error });
      }
    } catch (err) {
      await prisma.job.update({
        where: { id: job.id },
        data: { status: "FAILED", errorMessage: String(err), completedAt: new Date() },
      });
      results.push({ id: job.id, ok: false, reason: "exception" });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
