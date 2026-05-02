/**
 * Manual payout details displayed to users on the manual top-up screen.
 *
 * Configured via env vars so this stays out of source control:
 *   PAYOUT_NAME       — account holder full name (e.g. "Ahmad Hassan")
 *   PAYOUT_EASYPAISA  — Easypaisa wallet number
 *   PAYOUT_JAZZCASH   — JazzCash wallet number
 *   PAYOUT_BINANCE    — Binance Pay ID
 *   PAYOUT_BANK       — optional bank account / IBAN
 *
 * If none are set, the manual top-up screen will display a generic
 * "contact support" message.
 */
export interface PayoutMethod {
  key: string;
  label: string;
  value: string;
  hint?: string;
}

export function getPayoutMethods(): PayoutMethod[] {
  const methods: PayoutMethod[] = [];
  if (process.env.PAYOUT_EASYPAISA)
    methods.push({ key: "easypaisa", label: "Easypaisa", value: process.env.PAYOUT_EASYPAISA });
  if (process.env.PAYOUT_JAZZCASH)
    methods.push({ key: "jazzcash", label: "JazzCash", value: process.env.PAYOUT_JAZZCASH });
  if (process.env.PAYOUT_BINANCE)
    methods.push({
      key: "binance",
      label: "Binance Pay ID",
      value: process.env.PAYOUT_BINANCE,
      hint: "USDT / BUSD on Binance Pay",
    });
  if (process.env.PAYOUT_BANK)
    methods.push({ key: "bank", label: "Bank Transfer", value: process.env.PAYOUT_BANK });
  return methods;
}

export function getPayoutAccountName(): string | null {
  return process.env.PAYOUT_NAME ?? null;
}
