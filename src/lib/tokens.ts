import { prisma } from "@/lib/prisma";
import type { LedgerType } from "@prisma/client";

/**
 * Atomically modify a user's token balance and record a ledger entry.
 * Returns the new balance, or throws if insufficient funds on a CHARGE.
 */
export async function modifyTokens(params: {
  userId: string;
  type: LedgerType;
  amount: number; // positive for credit, negative for debit
  jobId?: string;
  paymentId?: string;
  note?: string;
}) {
  const { userId, type, amount, jobId, paymentId, note } = params;

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    const newBalance = user.tokenBalance + amount;

    if (type === "CHARGE" && newBalance < 0) {
      throw new Error("Insufficient token balance");
    }

    await tx.user.update({
      where: { id: userId },
      data: { tokenBalance: newBalance },
    });

    await tx.ledgerEntry.create({
      data: { userId, type, amount, balance: newBalance, jobId, paymentId, note },
    });

    return newBalance;
  });
}

/** Charge tokens for a successful publish. Returns new balance. */
export async function chargeForPublish(userId: string, jobId: string, tokens: number) {
  return modifyTokens({
    userId,
    type: "CHARGE",
    amount: -tokens,
    jobId,
    note: `Publish charge: ${tokens} tokens`,
  });
}

/** Credit tokens after a top-up payment. */
export async function creditTokens(userId: string, paymentId: string, tokens: number) {
  return modifyTokens({
    userId,
    type: "TOPUP",
    amount: tokens,
    paymentId,
    note: `Top-up: ${tokens} tokens`,
  });
}
