import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@distropro.com" },
    update: { isAdmin: true, emailVerified: true },
    create: {
      name: "Admin User",
      email: "admin@distropro.com",
      passwordHash,
      emailVerified: true,
      isAdmin: true,
      tokenBalance: 0,
    },
  });
  console.log("Seeded admin user:", admin.email, "isAdmin:", admin.isAdmin);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
