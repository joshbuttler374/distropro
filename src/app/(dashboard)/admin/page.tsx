import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isUserAdmin } from "@/lib/admin";

export default async function AdminIndex() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!(await isUserAdmin(session.user.id))) redirect("/dashboard");
  redirect("/admin/payments");
}
