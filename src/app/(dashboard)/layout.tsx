import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isUserAdmin } from "@/lib/admin";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { SessionProvider } from "@/components/providers/SessionProvider";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const admin = await isUserAdmin(session.user.id);

  return (
    <SessionProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar isAdmin={admin} />
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </SessionProvider>
  );
}
