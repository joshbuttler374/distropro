import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** Lazy-initialized Stripe client (avoids construction at build time). */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  _stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia", typescript: true });
  return _stripe;
}

/** Backwards-compatible export — only call after env is loaded. */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(getStripe(), prop);
  },
});

/** Create a Stripe Checkout session for token top-up. */
export async function createCheckoutSession(params: {
  userId: string;
  tokens: number;
  email: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const unitPrice = Number(process.env.TOKEN_PRICE_PKR ?? 0.5);
  const totalPKR = params.tokens * unitPrice;
  const amountCents = Math.round(totalPKR * 100);

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: params.email,
    line_items: [
      {
        price_data: {
          currency: "pkr",
          product_data: { name: `${params.tokens} DistroPro Tokens` },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: { userId: params.userId, tokens: String(params.tokens) },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return session;
}
