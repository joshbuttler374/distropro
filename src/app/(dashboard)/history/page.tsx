import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const jobs = await prisma.job.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { page: true, reel: true },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="font-display text-3xl font-bold">History</h1>
        <p className="text-muted-foreground">Last 100 publish attempts across your account.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent jobs</CardTitle></CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No jobs yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-2">Page</th>
                  <th className="py-2">Reel</th>
                  <th className="py-2">Scheduled</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Tokens</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id} className="border-b border-border last:border-0">
                    <td className="py-2 font-medium">{j.page.pageName}</td>
                    <td className="py-2 text-muted-foreground">{j.reel.title ?? j.reel.id.slice(0, 8)}</td>
                    <td className="py-2 text-muted-foreground">
                      {new Date(j.scheduledFor).toLocaleString()}
                    </td>
                    <td className="py-2">{j.status}</td>
                    <td className="py-2 text-right font-mono">{j.tokensCharged}</td>
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
