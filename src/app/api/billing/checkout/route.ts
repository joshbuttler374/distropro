import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/stripe";

const schema = z.object({ tokens: z.number().int().min(100).max(1_000_000) });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  try {
    const checkout = await createCheckoutSession({
      userId: session.user.id,
      tokens: parsed.data.tokens,
      email: session.user.email,
      successUrl: `${baseUrl}/billing?success=1`,
      cancelUrl: `${baseUrl}/billing?canceled=1`,
    });
    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error("[checkout]", err);
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }
}
