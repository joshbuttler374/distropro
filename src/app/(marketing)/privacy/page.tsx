export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 prose prose-neutral">
      <h1 className="font-display text-3xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

      <h2 className="mt-8 font-display text-xl font-semibold">1. Service Architecture</h2>
      <p>
        DistroPro is a SaaS platform that helps users schedule and publish video content to
        Facebook pages they own. We act as a neutral technological intermediary between your
        content and the Facebook Graph API.
      </p>

      <h2 className="mt-6 font-display text-xl font-semibold">2. Data We Collect</h2>
      <ul className="list-disc pl-6">
        <li>Account info: name, email, phone (for support).</li>
        <li>Authentication: hashed passwords; one-time codes are kept only until used.</li>
        <li>Facebook page tokens: stored encrypted at rest, used only to publish on your behalf.</li>
        <li>Content: video URLs you submit and any metadata required to publish them.</li>
        <li>Usage telemetry: page views, button clicks, error events (Vercel Web Analytics).</li>
      </ul>

      <h2 className="mt-6 font-display text-xl font-semibold">3. Bring-Your-Own-Content</h2>
      <p>
        DistroPro does not scrape, crawl, or download third-party content on your behalf. You are
        responsible for ensuring you have the rights to publish any content you submit through the
        platform. We run automated content moderation (OpenAI Moderation API) on submissions and
        may refuse to publish content flagged as harmful.
      </p>

      <h2 className="mt-6 font-display text-xl font-semibold">4. Third-Party Platforms</h2>
      <p>
        DistroPro is independent of and not affiliated with Meta Platforms, Inc. Use of DistroPro
        does not waive your obligation to comply with Meta&apos;s Community Standards and Platform
        Policies.
      </p>

      <h2 className="mt-6 font-display text-xl font-semibold">5. Your Rights</h2>
      <p>
        You may delete your account at any time from the dashboard. Deletion removes all associated
        records (pages, tokens, ledger, history) within 30 days. Aggregated, anonymized event logs
        may be retained for fraud-prevention purposes.
      </p>

      <h2 className="mt-6 font-display text-xl font-semibold">6. Contact</h2>
      <p>For privacy questions, email <a href="mailto:privacy@distropro.com">privacy@distropro.com</a>.</p>
    </article>
  );
}
