import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Infinity as InfinityIcon } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold">
          <InfinityIcon className="h-6 w-6 text-primary" />
          DistroPro
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/#how-it-works" className="text-muted-foreground hover:text-foreground">
            How It Works
          </Link>
          <Link href="/#calculator" className="text-muted-foreground hover:text-foreground">
            Calculator
          </Link>
          <Link href="/#pricing" className="text-muted-foreground hover:text-foreground">
            Pricing
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
