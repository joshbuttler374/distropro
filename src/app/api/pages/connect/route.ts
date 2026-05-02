import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFacebookOAuthUrl } from "@/lib/facebook";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL ?? "http://localhost:3000"));

  const callback = `${process.env.NEXTAUTH_URL}/api/pages/callback`;
  const url = getFacebookOAuthUrl(callback);
  return NextResponse.redirect(url);
}
