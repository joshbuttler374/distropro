import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";

export default async function PagesPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const pages = await prisma.fbPage.findMany({
    where: { fbAccount: { userId } },
    orderBy: { createdAt: "desc" },
    include: { fbAccount: true },
  });

  const metaConfigured = Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
  const oauthUrl = `/api/pages/connect`;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Facebook Pages</h1>
          <p className="text-muted-foreground">Connect pages via official Facebook Login (no passwords stored).</p>
        </div>
        {metaConfigured ? (
          <Button asChild>
            <a href={oauthUrl}><Link2 className="h-4 w-4" /> Connect Page</a>
          </Button>
        ) : (
          <Button disabled title="Set META_APP_ID and META_APP_SECRET to enable.">
            <Link2 className="h-4 w-4" /> Connect Page (setup required)
          </Button>
        )}
      </div>

      {!metaConfigured && (
        <Card className="border-yellow-300 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30">
          <CardContent className="py-4 text-sm">
            <p className="font-medium">Facebook integration is not yet configured.</p>
            <p className="mt-1 text-muted-foreground">
              To enable Page connection: create a Meta Developer App at{" "}
              <a className="underline" href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer">
                developers.facebook.com/apps
              </a>
              , request the <code>pages_manage_posts</code>, <code>pages_read_engagement</code>,{" "}
              <code>pages_show_list</code>, and <code>pages_manage_metadata</code> permissions via App Review,
              then set <code>META_APP_ID</code>, <code>META_APP_SECRET</code> in Vercel env vars.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Connected pages</CardTitle></CardHeader>
        <CardContent>
          {pages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven&apos;t connected any pages yet. Click &quot;Connect Page&quot; above to start the
              Facebook OAuth flow.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {pages.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{p.pageName}</p>
                    <p className="text-xs text-muted-foreground">ID: {p.pageId}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {p.isActive ? "Active" : "Paused"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
