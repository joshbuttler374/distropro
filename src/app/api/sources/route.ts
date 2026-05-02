import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import type { SourcePlatform } from "@prisma/client";

const schema = z.object({
  platform: z.enum(["INSTAGRAM", "TIKTOK", "YOUTUBE", "FACEBOOK", "UPLOAD"]),
  handle: z.string().min(1).max(500),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sources = await prisma.source.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(sources);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkRateLimit(`sources:${session.user.id}`);
  if (!rl.success) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  try {
    const source = await prisma.source.create({
      data: {
        userId: session.user.id,
        platform: parsed.data.platform as SourcePlatform,
        handle: parsed.data.handle,
      },
    });

    // For UPLOAD, also create a Reel record so it can be scheduled immediately.
    if (parsed.data.platform === "UPLOAD") {
      await prisma.reel.create({
        data: {
          sourceId: source.id,
          videoUrl: parsed.data.handle,
          title: "Uploaded reel",
          moderationOk: false, // moderation runs at publish time
        },
      });
    }

    return NextResponse.json(source);
  } catch {
    return NextResponse.json({ error: "Source already exists" }, { status: 409 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const source = await prisma.source.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.source.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
