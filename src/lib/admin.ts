import { prisma } from "@/lib/prisma";

/**
 * Returns true if the given email is on the admin allowlist.
 *
 * Admin status is granted via two paths:
 *  1. The `User.isAdmin` flag in the database (set manually by another admin).
 *  2. The `ADMIN_EMAILS` environment variable (comma-separated list).
 *
 * This dual mechanism means the very first admin can be bootstrapped via env
 * vars without needing a pre-existing admin to flip the DB flag.
 */
export function isEmailAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, isAdmin: true },
  });
  if (!user) return false;
  return user.isAdmin || isEmailAdmin(user.email);
}
