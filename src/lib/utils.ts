import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPKR(amount: number) {
  return `Rs ${amount.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function tokenCost(tokens: number): number {
  const rate = Number(process.env.TOKEN_PRICE_PKR ?? 0.5);
  return tokens * rate;
}

export function tokensPerReel(platform: string): number {
  if (platform === "INSTAGRAM") return 1;
  return 2; // TIKTOK, YOUTUBE, FACEBOOK, UPLOAD
}
