import { Link2, AtSign, CalendarClock } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Link2,
    title: "Connect your Facebook pages",
    body: "Link your account via official Facebook Login (no passwords stored), then choose which pages you want to publish to.",
  },
  {
    n: "02",
    icon: AtSign,
    title: "Add your content sources",
    body: "Upload your reels directly or paste a public video URL. You stay in control of what gets posted — DistroPro never scrapes content you don't own.",
  },
  {
    n: "03",
    icon: CalendarClock,
    title: "Schedule and publish",
    body: "Set per-page posting times. Our scheduler handles retries, rate-limiting, and Reels API quirks so your queue runs hands-free.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-background px-4 py-24">
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">How It Works</p>
        <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
          Launch automation in three steps
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Setup takes minutes. After that, your publishing queue runs on schedule with full audit
          history and per-page throttling.
        </p>
      </div>
      <div className="mx-auto mt-12 grid max-w-5xl gap-4">
        {steps.map((step) => (
          <div
            key={step.n}
            className="flex items-start gap-6 rounded-xl border border-border bg-card p-6"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-mono text-sm text-primary">
              {step.n}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <step.icon className="h-5 w-5 text-primary" />
                <h3 className="font-display text-lg font-semibold">{step.title}</h3>
              </div>
              <p className="mt-2 text-muted-foreground">{step.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
