export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 prose prose-neutral">
      <h1 className="font-display text-3xl font-bold">Terms of Service</h1>
      <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

      <h2 className="mt-8 font-display text-xl font-semibold">1. Acceptance</h2>
      <p>
        By creating an account, you agree to these Terms. If you don&apos;t agree, don&apos;t use
        the service.
      </p>

      <h2 className="mt-6 font-display text-xl font-semibold">2. Acceptable Use</h2>
      <ul className="list-disc pl-6">
        <li>You must own or have explicit license to publish all content you submit.</li>
        <li>You must comply with Meta&apos;s Platform Policies and Community Standards.</li>
        <li>No spam, no copyright infringement, no inauthentic behavior, no illegal content.</li>
        <li>One account per person/agency. No abuse of free trials or referral programs.</li>
      </ul>

      <h2 className="mt-6 font-display text-xl font-semibold">3. Token Purchases</h2>
      <p>
        Tokens are non-refundable digital credits. We charge tokens only when a publish is
        successful. Failed publishes do not deduct tokens. Tokens do not expire.
      </p>

      <h2 className="mt-6 font-display text-xl font-semibold">4. Indemnification</h2>
      <p>
        You agree to indemnify and hold DistroPro harmless from any claim arising from content
        you submit or actions you take through the service, including DMCA notices, Meta
        enforcement actions, and third-party claims.
      </p>

      <h2 className="mt-6 font-display text-xl font-semibold">5. Service Availability</h2>
      <p>
        We provide the service &quot;as is&quot; without warranty. We may rate-limit, throttle, or
        suspend accounts that violate these Terms or Meta&apos;s policies.
      </p>

      <h2 className="mt-6 font-display text-xl font-semibold">6. Termination</h2>
      <p>
        Either party may terminate at any time. Token balances on terminated accounts are
        forfeited unless required otherwise by law.
      </p>

      <h2 className="mt-6 font-display text-xl font-semibold">7. Governing Law</h2>
      <p>
        These Terms are governed by the laws of the jurisdiction in which DistroPro is
        registered, without regard to conflict-of-laws principles.
      </p>
    </article>
  );
}
