import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Link2, AtSign, CalendarClock, CheckCircle2, XCircle } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const [user, pageCount, sourceCount, scheduleCount, recentJobs, successCount, failCount] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.fbPage.count({ where: { fbAccount: { userId } } }),
      prisma.source.count({ where: { userId } }),
      prisma.schedule.count({ where: { userId, isActive: true } }),
      prisma.job.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { page: true, reel: true },
      }),
      prisma.job.count({ where: { userId, status: "SUCCESS" } }),
      prisma.job.count({ where: { userId, status: "FAILED" } }),
    ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Welcome, {user?.name?.split(" ")[0] ?? "there"}</h1>
        <p className="text-muted-foreground">Here&apos;s a snapshot of your distribution operations.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Coins} label="Token balance" value={user?.tokenBalance ?? 0} accent />
        <StatCard icon={Link2} label="FB pages" value={pageCount} />
        <StatCard icon={AtSign} label="Sources" value={sourceCount} />
        <StatCard icon={CalendarClock} label="Active schedules" value={scheduleCount} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard icon={CheckCircle2} label="Successful publishes (lifetime)" value={successCount} />
        <StatCard icon={XCircle} label="Failed publishes (lifetime, no charge)" value={failCount} />
      </div>

      <Card>
        <CardHeader><CardTitle>Recent jobs</CardTitle></CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No jobs yet. Connect a Facebook page and add a source to get started.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recentJobs.map((j) => (
                <li key={j.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <span className="font-medium">{j.page.pageName}</span>
                    <span className="ml-2 text-muted-foreground">{j.reel.title ?? "Reel"}</span>
                  </div>
                  <StatusBadge status={j.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className={`mt-2 font-display text-3xl font-bold ${accent ? "text-primary" : ""}`}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
        <Icon className={`h-6 w-6 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SUCCESS: "bg-primary/10 text-primary",
    FAILED: "bg-destructive/10 text-destructive",
    PENDING: "bg-muted text-muted-foreground",
    RUNNING: "bg-blue-500/10 text-blue-600",
    SKIPPED: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-muted"}`}>
      {status}
    </span>
  );
}
