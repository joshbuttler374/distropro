/**
 * One-time production bootstrap.
 *
 * Run this LOCALLY against your production Supabase URL after the first
 * Vercel deploy:
 *
 *   DATABASE_URL="<your supabase pooled url>" \
 *   ADMIN_EMAIL="you@example.com" \
 *   ADMIN_PASSWORD="$(openssl rand -base64 18)" \
 *   ADMIN_NAME="Ahmad Hassan" \
 *   npx tsx scripts/setup-prod.ts
 *
 * It will:
 *   1. Push the Prisma schema (your scripts/setup-prod.sh wrapper handles this).
 *   2. Create or upsert an admin user with isAdmin=true and emailVerified=true.
 *
 * Idempotent — safe to re-run.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Admin";

  if (!email || !password) {
    console.error("Missing ADMIN_EMAIL or ADMIN_PASSWORD env var.");
    console.error('Run with: ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="..." npx tsx scripts/setup-prod.ts');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.upsert({
    where: { email },
    update: { isAdmin: true, emailVerified: true, passwordHash },
    create: {
      name,
      email,
      passwordHash,
      emailVerified: true,
      isAdmin: true,
      tokenBalance: 0,
    },
  });
  console.log(`✓ Admin user ready: ${admin.email} (isAdmin=${admin.isAdmin})`);
  console.log(`  Sign in at https://<your-vercel-domain>/login with this email + password.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
