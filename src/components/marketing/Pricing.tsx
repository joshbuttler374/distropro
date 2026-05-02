"use client";

import Link from "next/link";
import { useState } from "react";
import { Coins, CircleCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TOKEN_RATES: Record<string, number> = {
  INSTAGRAM: 1,
  TIKTOK: 2,
  YOUTUBE: 2,
  FACEBOOK: 2,
  UPLOAD: 2,
};

export function Pricing() {
  const [platform, setPlatform] = useState<string>("INSTAGRAM");
  const [reelsPerDay, setReelsPerDay] = useState<number>(2);
  const [pages, setPages] = useState<number>(10);

  const tokensPerReel = TOKEN_RATES[platform] ?? 1;
  const monthlyReelsPerPage = reelsPerDay * 30;
  const totalReels = monthlyReelsPerPage * pages;
  const totalTokens = totalReels * tokensPerReel;
  const tokenPrice = 0.5;
  const totalPKR = totalTokens * tokenPrice;

  return (
    <section id="pricing" className="bg-accent/20 px-4 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Simple Pricing</p>
          <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
            Pay as you grow — <span className="text-primary">no fixed plan lock-in</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Top up tokens once, use them whenever. Failed reels don&apos;t cost tokens — only successful
            publishes deduct from your balance.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Card className="p-8">
            <div className="mb-2 flex items-center gap-2 text-primary">
              <Coins className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wider">Unified Token System</span>
            </div>
            <h3 className="font-display text-2xl font-bold">Tokens never expire</h3>
            <ul className="mt-6 space-y-3 text-sm">
              <Feature text="Tokens charged only on successful publishes" />
              <Feature text="No minimum page count or token quota" />
              <Feature text="Self-serve top-ups via Stripe (international)" />
              <Feature text="Local-gateway top-ups for PKR / INR / IDR" />
              <Feature text="Free signup; only pay when you publish" />
            </ul>
            <div className="mt-8 rounded-xl border border-primary/30 bg-primary/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Free Account Creation
              </p>
              <p className="mt-2 font-display text-lg font-semibold">Start building today</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign up, connect a page, and add your first source. You only pay once you start publishing.
              </p>
              <Button asChild className="mt-4 w-full">
                <Link href="/signup">Sign Up Now</Link>
              </Button>
            </div>
          </Card>

          <Card id="calculator" className="p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Monthly Cost Calculator
            </p>
            <h3 className="mt-2 font-display text-2xl font-bold">Estimate your monthly cost</h3>
            <div className="mt-6 space-y-4">
              <div>
                <Label htmlFor="platform">Source platform</Label>
                <select
                  id="platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="INSTAGRAM">Instagram (1 token / reel)</option>
                  <option value="TIKTOK">TikTok (2 tokens / reel)</option>
                  <option value="YOUTUBE">YouTube (2 tokens / reel)</option>
                  <option value="FACEBOOK">Facebook (2 tokens / reel)</option>
                  <option value="UPLOAD">Direct Upload (2 tokens / reel)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="reelsPerDay">Reels per day (per page)</Label>
                <Input
                  id="reelsPerDay"
                  type="number"
                  min={1}
                  value={reelsPerDay}
                  onChange={(e) => setReelsPerDay(Math.max(1, Number(e.target.value)))}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="pages">Number of pages</Label>
                <Input
                  id="pages"
                  type="number"
                  min={1}
                  value={pages}
                  onChange={(e) => setPages(Math.max(1, Number(e.target.value)))}
                  className="mt-2"
                />
              </div>
            </div>
            <div className="mt-6 rounded-xl border border-border bg-background p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Estimated monthly total
              </p>
              <p className="mt-1 font-display text-3xl font-bold text-primary">
                Rs {totalPKR.toLocaleString()}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>Reels / page / month: <strong>{monthlyReelsPerPage}</strong></div>
                <div>Total reels: <strong>{totalReels}</strong></div>
                <div>Token rate: <strong>{tokensPerReel}/reel</strong></div>
                <div>Tokens used: <strong>{totalTokens.toLocaleString()}</strong></div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Assumes 30 days per month at PKR {tokenPrice}/token. Local-currency conversion at checkout.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-muted-foreground">
      <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <span>{text}</span>
    </li>
  );
}
