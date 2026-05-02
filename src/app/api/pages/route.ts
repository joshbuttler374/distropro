import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pages = await prisma.fbPage.findMany({
    where: { fbAccount: { userId: session.user.id } },
    orderBy: { createdAt: "desc" },
    select: { id: true, pageId: true, pageName: true, isActive: true, createdAt: true },
  });
  return NextResponse.json(pages);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Ensure ownership
  const page = await prisma.fbPage.findFirst({
    where: { id, fbAccount: { userId: session.user.id } },
  });
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.fbPage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
