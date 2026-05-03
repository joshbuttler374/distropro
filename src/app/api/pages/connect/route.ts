import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFacebookOAuthUrl } from "@/lib/facebook";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL ?? "http://localhost:3000"));

  if (!process.env.META_APP_ID || !process.env.META_APP_SECRET) {
    return NextResponse.json(
      {
        error: "Facebook integration not configured.",
        hint:
          "Set META_APP_ID and META_APP_SECRET in Vercel env vars. Create a Meta Developer App at https://developers.facebook.com/apps and pass App Review for the pages_manage_posts permission.",
      },
      { status: 503 },
    );
  }

  const callback = `${process.env.NEXTAUTH_URL}/api/pages/callback`;
  const url = getFacebookOAuthUrl(callback);
  return NextResponse.redirect(url);
}
