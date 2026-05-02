import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isUserAdmin } from "@/lib/admin";

/** GET /api/admin/payments?status=PENDING|COMPLETED|FAILED — list all */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isUserAdmin(session.user.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const status = new URL(req.url).searchParams.get("status") ?? "PENDING";
  const payments = await prisma.payment.findMany({
    where: { status: status as "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, tokenBalance: true } },
    },
  });
  return NextResponse.json(payments);
}
