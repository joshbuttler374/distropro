"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";

type Me = { tokenBalance: number; email: string };
type Ledger = { id: string; type: string; amount: number; balance: number; createdAt: string; note: string | null };
type PayoutMethod = { key: string; label: string; value: string; hint?: string };
type PayoutInfo = { accountName: string | null; methods: PayoutMethod[]; tokenPricePKR: number };
type Payment = {
  id: string;
  provider: string;
  method: string | null;
  reference: string | null;
  amountCents: number;
  currency: string;
  tokensGranted: number;
  status: string;
  reviewNote: string | null;
  createdAt: string;
};

export default function BillingPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [payouts, setPayouts] = useState<PayoutInfo | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tab, setTab] = useState<"manual" | "card">("manual");
  const [tokens, setTokens] = useState(1000);
  const [method, setMethod] = useState("easypaisa");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const [m, l, p, pay] = await Promise.all([
      fetch("/api/me").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/me/ledger").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/me/payout-info").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/billing/request-topup").then((r) => (r.ok ? r.json() : [])),
    ]);
    setMe(m);
    setLedger(l);
    setPayouts(p);
    setPayments(pay);
    if (p?.methods?.[0]) setMethod(p.methods[0].key);
  }

  useEffect(() => {
    load();
  }, []);

  const totalPKR = payouts ? tokens * payouts.tokenPricePKR : tokens * 0.5;

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  async function topupStripe() {
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

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/billing/request-topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokens, method, reference }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Failed");
      return;
    }
    toast.success("Top-up request submitted. Tokens will be credited after admin verification.");
    setReference("");
    load();
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
            <div className="flex gap-2">
              <button
                onClick={() => setTab("manual")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  tab === "manual" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                Manual (PK)
              </button>
              <button
                onClick={() => setTab("card")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  tab === "card" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                Card (Stripe)
              </button>
            </div>
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
                Total: <strong>Rs {totalPKR.toLocaleString()}</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {tab === "manual" ? (
        <Card>
          <CardHeader><CardTitle>Manual top-up</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {payouts?.methods.length ? (
              <>
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Step 1</p>
                  <p className="mt-1 font-medium">
                    Send <strong>Rs {totalPKR.toLocaleString()}</strong> to one of the accounts below.
                  </p>
                  {payouts.accountName ? (
                    <p className="mt-2 text-sm">
                      Account holder: <strong>{payouts.accountName}</strong>
                    </p>
                  ) : null}
                  <ul className="mt-3 space-y-2">
                    {payouts.methods.map((m) => (
                      <li
                        key={m.key}
                        className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium">{m.label}</p>
                          <p className="font-mono text-xs">{m.value}</p>
                          {m.hint ? <p className="text-xs text-muted-foreground">{m.hint}</p> : null}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copy(m.value)}
                        >
                          <Copy className="h-3 w-3" /> Copy
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
                <form onSubmit={submitManual} className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Step 2</p>
                  <div>
                    <Label htmlFor="method">Which method did you use?</Label>
                    <select
                      id="method"
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {payouts.methods.map((m) => (
                        <option key={m.key} value={m.key}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="reference">Transaction reference / TID</Label>
                    <Input
                      id="reference"
                      required
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="mt-2"
                      placeholder="e.g. EP-1234567890 or Binance order ID"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Paste the transaction reference shown in your payment app — it&apos;s how the
                      admin verifies your top-up before crediting tokens.
                    </p>
                  </div>
                  <Button type="submit" disabled={loading || !reference} className="w-full">
                    {loading ? "Submitting…" : "Submit top-up request"}
                  </Button>
                </form>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Manual top-up isn&apos;t configured for this deployment. Set <code>PAYOUT_*</code>
                env vars or use the Card tab.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Pay by card (Stripe)</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              International cards welcome. You&apos;ll be redirected to Stripe&apos;s secure
              checkout to complete payment.
            </p>
            <Button onClick={topupStripe} disabled={loading} className="w-full">
              {loading ? "Redirecting…" : `Pay Rs ${totalPKR.toLocaleString()} with Stripe`}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Your top-ups</CardTitle></CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No top-ups yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2">Date</th>
                  <th className="py-2">Method</th>
                  <th className="py-2">Reference</th>
                  <th className="py-2 text-right">Tokens</th>
                  <th className="py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="py-2 text-muted-foreground">{new Date(p.createdAt).toLocaleString()}</td>
                    <td className="py-2">{p.method ?? p.provider}</td>
                    <td className="py-2 font-mono text-xs text-muted-foreground">{p.reference ?? "—"}</td>
                    <td className="py-2 text-right font-mono">{p.tokensGranted}</td>
                    <td className={`py-2 text-right ${
                      p.status === "COMPLETED" ? "text-primary" :
                      p.status === "FAILED" ? "text-destructive" : "text-muted-foreground"
                    }`}>
                      {p.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

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
