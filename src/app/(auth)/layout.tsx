import Link from "next/link";
import { Infinity as InfinityIcon } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-accent/30 to-background px-4 py-12">
      <Link href="/" className="mb-6 flex flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
          <InfinityIcon className="h-8 w-8 text-primary" />
        </div>
        <p className="mt-3 font-display text-xl font-bold">
          Distro<span className="text-primary">Pro</span>
        </p>
        <p className="text-xs text-muted-foreground">Agency automation portal</p>
      </Link>
      {children}
    </div>
  );
}
