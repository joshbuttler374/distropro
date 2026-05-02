"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Me = { tokenBalance: number; email: string };
type Ledger = { id: string; type: string; amount: number; balance: number; createdAt: string; note: string | null };

export default function BillingPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [tokens, setTokens] = useState(1000);
  const [loading, setLoading] = useState(false);

  async function load() {
    const [m, l] = await Promise.all([
      fetch("/api/me").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/me/ledger").then((r) => (r.ok ? r.json() : [])),
    ]);
    setMe(m);
    setLedger(l);
  }

  useEffect(() => {
    load();
  }, []);

  async function topup() {
    setLoading(true);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokens }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Failed to start checkout");
      return;
    }
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Top up tokens; tokens never expire.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Current balance</CardTitle></CardHeader>
          <CardContent>
            <p className="font-display text-4xl font-bold text-primary">
              {(me?.tokenBalance ?? 0).toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">tokens available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top up</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tokens">Number of tokens</Label>
              <Input
                id="tokens"
                type="number"
                min={100}
                step={100}
                value={tokens}
                onChange={(e) => setTokens(Math.max(100, Number(e.target.value)))}
                className="mt-2"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {tokens.toLocaleString()} tokens × PKR 0.5 = <strong>Rs {(tokens * 0.5).toLocaleString()}</strong>
              </p>
            </div>
            <Button onClick={topup} disabled={loading} className="w-full">
              {loading ? "Redirecting…" : "Pay with Stripe"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Ledger</CardTitle></CardHeader>
        <CardContent>
          {ledger.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ledger entries yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2">Date</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Note</th>
                  <th className="py-2 text-right">Δ</th>
                  <th className="py-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((e) => (
                  <tr key={e.id} className="border-b border-border last:border-0">
                    <td className="py-2 text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</td>
                    <td className="py-2">{e.type}</td>
                    <td className="py-2 text-muted-foreground">{e.note}</td>
                    <td className={`py-2 text-right font-mono ${e.amount >= 0 ? "text-primary" : "text-destructive"}`}>
                      {e.amount >= 0 ? `+${e.amount}` : e.amount}
                    </td>
                    <td className="py-2 text-right font-mono">{e.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
