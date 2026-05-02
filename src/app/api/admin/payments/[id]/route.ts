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

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isUserAdmin(session.user.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (payment.status !== "PENDING")
    return NextResponse.json({ error: "Payment already processed" }, { status: 409 });

  if (parsed.data.action === "approve") {
    const updated = await prisma.payment.update({
      where: { id },
      data: {
        status: "COMPLETED",
        reviewNote: parsed.data.note,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
    });
    await creditTokens(payment.userId, payment.id, payment.tokensGranted);
    await prisma.event.create({
      data: {
        userId: payment.userId,
        action: "manual_topup_approved",
        metadata: { paymentId: id, tokens: payment.tokensGranted, by: session.user.id },
      },
    });
    return NextResponse.json(updated);
  }

  // Reject
  const updated = await prisma.payment.update({
    where: { id },
    data: {
      status: "FAILED",
      reviewNote: parsed.data.note,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
  });
  await prisma.event.create({
    data: {
      userId: payment.userId,
      action: "manual_topup_rejected",
      metadata: { paymentId: id, by: session.user.id, note: parsed.data.note },
    },
  });
  return NextResponse.json(updated);
}
