"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Page = { id: string; pageName: string; pageId: string };
type Source = { id: string; platform: string; handle: string };
type Schedule = {
  id: string;
  pageId: string;
  sourceId: string | null;
  cronExpr: string;
  timezone: string;
  isActive: boolean;
};

export default function SchedulesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [pageId, setPageId] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [cron, setCron] = useState("0 9,12,18 * * *");
  const [loading, setLoading] = useState(false);

  async function load() {
    const [p, s, sc] = await Promise.all([
      fetch("/api/pages").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/sources").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/schedules").then((r) => (r.ok ? r.json() : [])),
    ]);
    setPages(p);
    setSources(s);
    setSchedules(sc);
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId, sourceId, cronExpr: cron }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Failed");
      return;
    }
    toast.success("Schedule created");
    setPageId("");
    setSourceId("");
    load();
  }

  async function toggle(id: string, isActive: boolean) {
    await fetch(`/api/schedules?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    load();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Schedules</h1>
        <p className="text-muted-foreground">Configure when each page publishes content.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>New schedule</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={add} className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="pageId">Facebook page</Label>
              <select
                id="pageId"
                required
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">— select —</option>
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>{p.pageName}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="sourceId">Source</Label>
              <select
                id="sourceId"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">— any source —</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>{s.platform}: {s.handle}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="cron">Cron expression</Label>
              <Input
                id="cron"
                value={cron}
                onChange={(e) => setCron(e.target.value)}
                className="mt-2 font-mono"
                placeholder="0 9,12,18 * * *"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Default: 9am, 12pm, 6pm every day. Timezone defaults to Asia/Karachi.
              </p>
            </div>
            <Button type="submit" disabled={loading || !pageId} className="md:col-span-2">
              {loading ? "Creating…" : "Create schedule"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Active schedules</CardTitle></CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No schedules yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {schedules.map((s) => {
                const page = pages.find((p) => p.id === s.pageId);
                return (
                  <li key={s.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">{page?.pageName ?? "Page"}</p>
                      <p className="font-mono text-xs text-muted-foreground">{s.cronExpr} ({s.timezone})</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggle(s.id, s.isActive)}
                    >
                      {s.isActive ? "Pause" : "Resume"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
