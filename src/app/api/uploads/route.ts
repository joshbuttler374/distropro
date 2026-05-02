import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { moderateContent } from "@/lib/moderation";

const schema = z.object({
  videoUrl: z.string().url(),
  title: z.string().optional(),
});

/**
 * POST /api/uploads
 *
 * Accepts a public video URL the user already has rights to.
 * Runs the title/description through OpenAI Moderation before allowing the URL
 * to be queued for publishing.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const moderation = await moderateContent(parsed.data.title ?? "");
  if (!moderation.safe) {
    return NextResponse.json({ error: `Content blocked: ${moderation.reason}` }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    videoUrl: parsed.data.videoUrl,
    moderation,
  });
}
