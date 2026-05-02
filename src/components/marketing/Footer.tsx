import Link from "next/link";
import { Infinity as InfinityIcon } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-display text-lg font-semibold">
            <InfinityIcon className="h-6 w-6 text-primary" />
            DistroPro
          </div>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            A reliable Facebook page distribution platform for content agencies. Bring your own
            content; we handle scheduling, retries, and Graph-API publishing.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/#how-it-works" className="hover:text-primary">How it works</Link></li>
            <li><Link href="/#calculator" className="hover:text-primary">Calculator</Link></li>
            <li><Link href="/#pricing" className="hover:text-primary">Pricing</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-primary">Terms of Service</Link></li>
            <li><a href="mailto:support@distropro.com" className="hover:text-primary">support@distropro.com</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-4 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-xs text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} DistroPro. All rights reserved.</span>
          <span>Secure operations · Encrypted workflows · Token-metered publishing</span>
        </div>
      </div>
    </footer>
  );
}
