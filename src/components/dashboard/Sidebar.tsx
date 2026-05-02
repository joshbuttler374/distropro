"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Link2,
  AtSign,
  CalendarClock,
  History,
  CreditCard,
  Infinity as InfinityIcon,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/pages", label: "Facebook Pages", icon: Link2 },
  { href: "/sources", label: "Content Sources", icon: AtSign },
  { href: "/schedules", label: "Schedules", icon: CalendarClock },
  { href: "/history", label: "History", icon: History },
  { href: "/billing", label: "Billing", icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:flex md:flex-col">
      <Link href="/" className="flex items-center gap-2 border-b border-border p-4 font-display text-lg font-semibold">
        <InfinityIcon className="h-6 w-6 text-primary" />
        DistroPro
      </Link>
      <nav className="flex-1 p-2">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex items-center gap-3 border-t border-border p-4 text-sm text-muted-foreground hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </aside>
  );
}
