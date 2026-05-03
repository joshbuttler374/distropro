import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isUserAdmin } from "@/lib/admin";
import { creditTokens } from "@/lib/tokens";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  note: z.string().max(500).optional(),
});

/**
 * Admin reviews a manual top-up payment.
 *
 * For `approve`, the entire flow runs inside a single Prisma transaction:
 *   1. `updateMany` with `WHERE id=:id AND status="PENDING"` atomically claims
 *      the row. If two requests race (double-click, network retry, two admins),
 *      only the one whose update returns `count === 1` proceeds; the other
 *      sees `count === 0` and gets a 409.
 *   2. Tokens are credited via `creditTokens()` running on the same `tx`
 *      client, so a failure in either step rolls back both — the payment stays
 *      PENDING and the admin can retry.
 *
 * For `reject`, the same atomic claim is used so two admins cannot overwrite
 * each other's review note. No ledger entry is written on rejection.
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isUserAdmin(session.user.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // Pre-read for a clean 404; reading userId/tokensGranted from this snapshot
  // is safe because both fields are immutable after creation. The status
  // recheck inside the transaction is what guards against double-credit.
  const existing = await prisma.payment.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status !== "PENDING")
    return NextResponse.json({ error: "Payment already processed" }, { status: 409 });

  if (parsed.data.action === "approve") {
    try {
      const updated = await prisma.$transaction(async (tx) => {
        // Atomically claim the row. Returns count=1 only if status was PENDING.
        const claim = await tx.payment.updateMany({
          where: { id, status: "PENDING" },
          data: {
            status: "COMPLETED",
            reviewNote: parsed.data.note,
            reviewedById: session.user.id,
            reviewedAt: new Date(),
          },
        });
        if (claim.count !== 1) {
          throw new Error("PAYMENT_NOT_PENDING");
        }
        // Credit tokens against the same transaction. If this throws, the
        // updateMany above is rolled back too — payment stays PENDING.
        await creditTokens(existing.userId, existing.id, existing.tokensGranted, tx);
        return tx.payment.findUnique({ where: { id } });
      });
      await prisma.event.create({
        data: {
          userId: existing.userId,
          action: "manual_topup_approved",
          metadata: { paymentId: id, tokens: existing.tokensGranted, by: session.user.id },
        },
      });
      return NextResponse.json(updated);
    } catch (err) {
      if (err instanceof Error && err.message === "PAYMENT_NOT_PENDING") {
        return NextResponse.json({ error: "Payment already processed" }, { status: 409 });
      }
      console.error("[admin/payments] approve failed", err);
      return NextResponse.json({ error: "Failed to credit tokens" }, { status: 500 });
    }
  }

  // Reject — also use updateMany for atomic claim, but no token credit.
  const claim = await prisma.payment.updateMany({
    where: { id, status: "PENDING" },
    data: {
      status: "FAILED",
      reviewNote: parsed.data.note,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
  });
  if (claim.count !== 1) {
    return NextResponse.json({ error: "Payment already processed" }, { status: 409 });
  }
  const updated = await prisma.payment.findUnique({ where: { id } });
  await prisma.event.create({
    data: {
      userId: existing.userId,
      action: "manual_topup_rejected",
      metadata: { paymentId: id, by: session.user.id, note: parsed.data.note },
    },
  });
  return NextResponse.json(updated);
}
