import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const demo = await prisma.user.upsert({
    where: { email: "demo@distropro.com" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@distropro.com",
      passwordHash,
      emailVerified: true,
      tokenBalance: 1000,
    },
  });

  await prisma.ledgerEntry.create({
    data: {
      userId: demo.id,
      type: "ADJUSTMENT",
      amount: 1000,
      balance: 1000,
      note: "Initial seed credit",
    },
  });

  console.log("Seeded demo user:", demo.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
