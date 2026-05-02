import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail, generateOtp } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  phone: z.string().optional().nullable(),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await checkRateLimit(`signup:${ip}`);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.emailVerified) {
    return NextResponse.json({ error: "Account already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const user = existing
    ? await prisma.user.update({
        where: { email },
        data: { name, phone: phone ?? undefined, passwordHash },
      })
    : await prisma.user.create({
        data: { name, email, phone: phone ?? undefined, passwordHash, emailVerified: false },
      });

  await prisma.otp.create({ data: { userId: user.id, code, expiresAt } });
  await sendOtpEmail(email, code);
  await prisma.event.create({ data: { userId: user.id, action: "signup_started" } });

  return NextResponse.json({ ok: true, message: "Verification code sent" });
}
