import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  pageId: z.string().min(1),
  sourceId: z.string().optional().nullable(),
  cronExpr: z.string().min(1).max(100),
  timezone: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schedules = await prisma.schedule.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(schedules);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // Verify ownership of page
  const page = await prisma.fbPage.findFirst({
    where: { id: parsed.data.pageId, fbAccount: { userId: session.user.id } },
  });
  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  const schedule = await prisma.schedule.create({
    data: {
      userId: session.user.id,
      pageId: parsed.data.pageId,
      sourceId: parsed.data.sourceId || null,
      cronExpr: parsed.data.cronExpr,
      timezone: parsed.data.timezone ?? "Asia/Karachi",
    },
  });
  return NextResponse.json(schedule);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const body = await req.json().catch(() => null);

  const owned = await prisma.schedule.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const schedule = await prisma.schedule.update({
    where: { id },
    data: { isActive: typeof body?.isActive === "boolean" ? body.isActive : owned.isActive },
  });
  return NextResponse.json(schedule);
}
