import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { creditTokens } from "@/lib/tokens";

export const config = { api: { bodyParser: false } };

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[webhook] sig verify failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const sessionObj = event.data.object as Stripe.Checkout.Session;
    const userId = sessionObj.metadata?.userId;
    const tokens = Number(sessionObj.metadata?.tokens ?? 0);

    if (userId && tokens > 0) {
      // Idempotency: skip if we've already processed this session id
      const existing = await prisma.payment.findFirst({ where: { externalId: sessionObj.id } });
      if (existing && existing.status === "COMPLETED") {
        return NextResponse.json({ received: true });
      }

      const payment = await prisma.payment.create({
        data: {
          userId,
          provider: "STRIPE",
          externalId: sessionObj.id,
          amountCents: sessionObj.amount_total ?? 0,
          currency: (sessionObj.currency ?? "pkr").toUpperCase(),
          tokensGranted: tokens,
          status: "COMPLETED",
        },
      });

      await creditTokens(userId, payment.id, tokens);
      await prisma.event.create({ data: { userId, action: "topup_completed", metadata: { tokens } } });
    }
  }

  return NextResponse.json({ received: true });
}
