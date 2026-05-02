import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isUserAdmin } from "@/lib/admin";
import { AdminPaymentsClient } from "./client";

export default async function AdminPaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!(await isUserAdmin(session.user.id))) redirect("/dashboard");

  return <AdminPaymentsClient />;
}
