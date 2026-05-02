import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-accent/40 to-background px-4 py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-2 md:gap-16">
        <div className="flex flex-col justify-center">
          <div className="mb-4 inline-flex w-fit items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Facebook Distribution Platform
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Distribute video content to Facebook pages,{" "}
            <span className="text-primary">on schedule, at scale.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Connect your Facebook pages via official OAuth, queue your content, and let DistroPro
            publish on the times you set. Pay per successful publish — failed posts don&apos;t cost tokens.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/signup">
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/#pricing">View Pricing</Link>
            </Button>
            <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-primary" /> Official API auth
            </span>
          </div>
        </div>
        <div className="relative">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Automation Snapshot
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" /> Live
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Stat value="100%" label="Open standards (Graph API)" />
              <Stat value="0" label="Passwords stored" />
              <Stat value="∞" label="Pages per agency" />
              <Stat value="Token-metered" label="Pay only on success" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="font-display text-2xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
