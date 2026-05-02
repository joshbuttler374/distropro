import { prisma } from "@/lib/prisma";
import type { LedgerType, Prisma } from "@prisma/client";

type TxClient = Prisma.TransactionClient;

/**
 * Atomically modify a user's token balance and record a ledger entry.
 *
 * If `tx` is provided, runs against the caller's transaction so the balance
 * mutation and the ledger entry are committed/rolled back together with
 * any surrounding work (e.g. flipping a Payment from PENDING → COMPLETED).
 * If `tx` is omitted, opens its own short-lived transaction.
 *
 * Returns the new balance, or throws if a CHARGE would take the balance
 * negative.
 */
export async function modifyTokens(
  params: {
    userId: string;
    type: LedgerType;
    amount: number; // positive for credit, negative for debit
    jobId?: string;
    paymentId?: string;
    note?: string;
  },
  tx?: TxClient,
): Promise<number> {
  const { userId, type, amount, jobId, paymentId, note } = params;

  const run = async (client: TxClient): Promise<number> => {
    const user = await client.user.findUniqueOrThrow({ where: { id: userId } });
    const newBalance = user.tokenBalance + amount;

    if (type === "CHARGE" && newBalance < 0) {
      throw new Error("Insufficient token balance");
    }

    await client.user.update({
      where: { id: userId },
      data: { tokenBalance: newBalance },
    });

    await client.ledgerEntry.create({
      data: { userId, type, amount, balance: newBalance, jobId, paymentId, note },
    });

    return newBalance;
  };

  return tx ? run(tx) : prisma.$transaction(run);
}

/** Charge tokens for a successful publish. Returns new balance. */
export async function chargeForPublish(userId: string, jobId: string, tokens: number, tx?: TxClient) {
  return modifyTokens(
    {
      userId,
      type: "CHARGE",
      amount: -tokens,
      jobId,
      note: `Publish charge: ${tokens} tokens`,
    },
    tx,
  );
}

/** Credit tokens after a top-up payment. */
export async function creditTokens(userId: string, paymentId: string, tokens: number, tx?: TxClient) {
  return modifyTokens(
    {
      userId,
      type: "TOPUP",
      amount: tokens,
      paymentId,
      note: `Top-up: ${tokens} tokens`,
    },
    tx,
  );
}
