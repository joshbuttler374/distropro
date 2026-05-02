import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForToken, listUserPages } from "@/lib/facebook";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL ?? "http://localhost:3000"));

  const code = new URL(req.url).searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/pages?error=no_code", process.env.NEXTAUTH_URL!));
  }

  try {
    const callback = `${process.env.NEXTAUTH_URL}/api/pages/callback`;
    const { access_token, expires_in } = await exchangeCodeForToken(code, callback);
    const pages = await listUserPages(access_token);

    // Persist account + pages
    const fbUserId = pages[0]?.id ?? session.user.id; // best-effort; in prod, query /me
    const account = await prisma.fbAccount.upsert({
      where: { userId_fbUserId: { userId: session.user.id, fbUserId } },
      update: {
        accessToken: access_token,
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
      },
      create: {
        userId: session.user.id,
        fbUserId,
        accessToken: access_token,
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
      },
    });

    for (const p of pages) {
      await prisma.fbPage.upsert({
        where: { fbAccountId_pageId: { fbAccountId: account.id, pageId: p.id } },
        update: { pageName: p.name, accessToken: p.access_token, isActive: true },
        create: {
          fbAccountId: account.id,
          pageId: p.id,
          pageName: p.name,
          accessToken: p.access_token,
        },
      });
    }

    await prisma.event.create({
      data: { userId: session.user.id, action: "pages_connected", metadata: { count: pages.length } },
    });

    return NextResponse.redirect(new URL("/pages", process.env.NEXTAUTH_URL!));
  } catch (err) {
    console.error("[fb-callback]", err);
    return NextResponse.redirect(new URL("/pages?error=oauth_failed", process.env.NEXTAUTH_URL!));
  }
}
