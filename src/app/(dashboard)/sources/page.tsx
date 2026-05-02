"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SourceItem = {
  id: string;
  platform: string;
  handle: string;
  isActive: boolean;
  createdAt: string;
};

export default function SourcesPage() {
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [platform, setPlatform] = useState("UPLOAD");
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/sources");
    if (res.ok) setSources(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, handle }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Failed to add source");
      return;
    }
    toast.success("Source added");
    setHandle("");
    load();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/sources?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Source removed");
      load();
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Content Sources</h1>
        <p className="text-muted-foreground">
          Add the videos you want DistroPro to publish. <strong>You must own or have rights to all
          content you submit.</strong>
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Add a source</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={add} className="grid gap-4 md:grid-cols-[200px_1fr_auto] md:items-end">
            <div>
              <Label htmlFor="platform">Type</Label>
              <select
                id="platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="UPLOAD">Direct video URL</option>
                <option value="INSTAGRAM">Instagram (BYOC)</option>
                <option value="TIKTOK">TikTok (BYOC)</option>
                <option value="YOUTUBE">YouTube (BYOC)</option>
                <option value="FACEBOOK">Facebook (BYOC)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="handle">
                {platform === "UPLOAD" ? "Video URL (MP4)" : "Username or page ID"}
              </Label>
              <Input
                id="handle"
                required
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="mt-2"
                placeholder={platform === "UPLOAD" ? "https://cdn.example.com/reel.mp4" : "@username"}
              />
            </div>
            <Button type="submit" disabled={loading}>{loading ? "Adding…" : "Add Source"}</Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            For non-UPLOAD platforms you must implement a SourceAdapter that fetches reels via an
            API you have rights to. By default DistroPro does not scrape third-party sites.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Your sources</CardTitle></CardHeader>
        <CardContent>
          {sources.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sources yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {sources.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{s.handle}</p>
                    <p className="text-xs text-muted-foreground">{s.platform}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => remove(s.id)}>
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
