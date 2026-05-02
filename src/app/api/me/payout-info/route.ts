import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPayoutMethods, getPayoutAccountName } from "@/lib/payout";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    accountName: getPayoutAccountName(),
    methods: getPayoutMethods(),
    tokenPricePKR: Number(process.env.TOKEN_PRICE_PKR ?? 0.5),
  });
}
