import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  tokens: z.number().int().min(100).max(1_000_000),
  method: z.enum(["easypaisa", "jazzcash", "binance", "bank"]),
  reference: z.string().min(3).max(200),
});

/**
 * Creates a PENDING payment record for a manual (non-Stripe) top-up.
 *
 * The user has supposedly already sent money to the founder's
 * Easypaisa/JazzCash/Binance account — this endpoint just records the request
 * and the transaction reference. An admin must approve via the admin panel
 * before tokens are credited.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkRateLimit(`topup-request:${session.user.id}`);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const unitPrice = Number(process.env.TOKEN_PRICE_PKR ?? 0.5);
  const amountCents = Math.round(parsed.data.tokens * unitPrice * 100);

  const payment = await prisma.payment.create({
    data: {
      userId: session.user.id,
      provider: "LOCAL_GATEWAY",
      method: parsed.data.method,
      reference: parsed.data.reference,
      amountCents,
      currency: "PKR",
      tokensGranted: parsed.data.tokens,
      status: "PENDING",
    },
  });

  await prisma.event.create({
    data: {
      userId: session.user.id,
      action: "manual_topup_requested",
      metadata: { paymentId: payment.id, tokens: parsed.data.tokens, method: parsed.data.method },
    },
  });

  return NextResponse.json({ ok: true, paymentId: payment.id });
}

/** GET: list the current user's own payments (for the billing page). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payments = await prisma.payment.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(payments);
}
