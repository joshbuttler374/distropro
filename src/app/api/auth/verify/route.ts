import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email().toLowerCase(),
  code: z.string().length(6),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const otp = await prisma.otp.findFirst({
    where: {
      userId: user.id,
      code: parsed.data.code,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });

  await prisma.$transaction([
    prisma.otp.update({ where: { id: otp.id }, data: { used: true } }),
    prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } }),
    prisma.event.create({ data: { userId: user.id, action: "signup_completed" } }),
  ]);

  return NextResponse.json({ ok: true });
}
