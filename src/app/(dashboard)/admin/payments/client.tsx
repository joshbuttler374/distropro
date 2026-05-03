"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Payment = {
  id: string;
  method: string | null;
  reference: string | null;
  amountCents: number;
  currency: string;
  tokensGranted: number;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string; phone: string | null; tokenBalance: number };
};

export function AdminPaymentsClient() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/payments?status=${statusFilter}`);
    if (res.ok) setPayments(await res.json());
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function review(id: string, action: "approve" | "reject") {
    setLoading((l) => ({ ...l, [id]: true }));
    const res = await fetch(`/api/admin/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note: notes[id] ?? "" }),
    });
    setLoading((l) => ({ ...l, [id]: false }));
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error ?? "Failed");
      return;
    }
    toast.success(action === "approve" ? "Approved & tokens credited" : "Rejected");
    load();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Admin · Payments</h1>
        <p className="text-muted-foreground">
          Review manual top-up requests. Approving credits tokens via the same atomic
          ledger transaction as Stripe.
        </p>
      </div>

      <div className="flex gap-2">
        {["PENDING", "COMPLETED", "FAILED"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>{statusFilter} payments ({payments.length})</CardTitle></CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing here.</p>
          ) : (
            <ul className="divide-y divide-border">
              {payments.map((p) => (
                <li key={p.id} className="py-4">
                  <div className="grid gap-2 md:grid-cols-3">
                    <div>
                      <p className="font-medium">{p.user.name}</p>
                      <p className="text-xs text-muted-foreground">{p.user.email}</p>
                      {p.user.phone ? (
                        <p className="text-xs text-muted-foreground">{p.user.phone}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-muted-foreground">
                        Current balance: <strong>{p.user.tokenBalance}</strong>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Request</p>
                      <p className="font-medium">{p.tokensGranted.toLocaleString()} tokens</p>
                      <p className="text-sm">
                        Rs {(p.amountCents / 100).toLocaleString()} via{" "}
                        <strong>{p.method ?? "—"}</strong>
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        Ref: {p.reference ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {statusFilter === "PENDING" ? (
                      <div className="flex flex-col gap-2">
                        <Input
                          placeholder="Optional note"
                          value={notes[p.id] ?? ""}
                          onChange={(e) => setNotes((n) => ({ ...n, [p.id]: e.target.value }))}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => review(p.id, "approve")}
                            disabled={loading[p.id]}
                            className="flex-1"
                          >
                            Approve & credit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => review(p.id, "reject")}
                            disabled={loading[p.id]}
                            className="flex-1"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
