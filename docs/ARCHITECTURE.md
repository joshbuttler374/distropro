# Architecture

## Overview

DistroPro has three coarse-grained components:

1. **Web app** (Next.js 15 App Router) — marketing pages, auth, dashboard, API routes.
2. **Database** (Postgres via Prisma) — durable state for users, pages, sources, schedules, jobs, ledger.
3. **Cron worker** (`/api/cron/run-jobs`) — picks pending jobs and publishes them via the FB Graph API.

## Data model

```
User ────┬── FbAccount ── FbPage
         ├── Source ── Reel ──┐
         ├── Schedule ────────┘
         ├── Job ─── (Reel, FbPage)
         ├── LedgerEntry
         ├── Payment
         ├── Otp
         └── Event
```

### Why a ledger?

Atomic charge-on-success requires a single source of truth for every balance
mutation. A naive `UPDATE user SET tokens = tokens - X` works for serialization
but leaves no audit trail. The ledger gives us:

- One row per balance change (TOPUP / CHARGE / REFUND / ADJUSTMENT)
- The post-mutation balance recorded inline (so we can rebuild balance at any
  point in time)
- Per-job traceability (`ledger_entry.jobId` ↔ `job.id`)

The `modifyTokens` function in `src/lib/tokens.ts` runs the read, the validation
("CHARGE cannot leave the balance negative"), the user update, and the ledger
insert inside a single Prisma transaction.

## Auth flow

- **Signup** → POST `/api/auth/signup` → creates `User` (or updates existing
  unverified one), generates a 6-digit OTP, sends via Resend.
- **Verify** → POST `/api/auth/verify` → checks OTP code/expiration, marks user
  verified.
- **Login** → NextAuth credentials provider with bcrypt password compare and an
  `emailVerified` gate.
- **Sessions** → JWT (30-day rolling). Middleware redirects unauthed users to
  `/login` for `/dashboard/*`, `/pages/*`, etc.

## Publishing pipeline

1. The user creates a `Schedule` (cron expression + page + optional source).
2. A separate scheduler (Vercel Cron, every minute) calls
   `/api/cron/run-jobs` with `Authorization: Bearer ${CRON_SECRET}`.
3. The endpoint picks up to 50 `Job` rows where `status=PENDING AND scheduledFor <= now`.
4. For each job:
   - Atomically transitions `PENDING` → `RUNNING` (so concurrent workers don't double-publish).
   - Runs the reel title through OpenAI Moderation; on `flagged` → `FAILED`.
   - Pre-checks token balance; on insufficient → `SKIPPED`.
   - Calls `publishReelToPage()` (3-stage Reels upload).
   - On success: charges tokens via `chargeForPublish()`, marks `SUCCESS`.
   - On failure: marks `FAILED` with the error message; **no tokens charged**.

## Rate limiting

`src/lib/rate-limit.ts` initializes an Upstash Ratelimit instance lazily. If
Upstash credentials aren't set (e.g. local dev), `checkRateLimit` returns
`{ success: true }` so signup and source-creation flows still work without
external services.

## Source adapter pattern

```ts
interface SourceAdapter {
  platform: string;
  fetchReels(handle: string, limit?: number): Promise<FetchedReel[]>;
}
```

The default `UploadAdapter` resolves a single MP4 URL to a single `FetchedReel`.
You can plug in additional adapters (e.g. `LicensedScraperAdapter`) but the
shipped code does not include any scraping logic — it must be added by the
operator with appropriate rights.

## Security posture

- Passwords: bcrypt (cost 10) — never stored in plaintext or in JWTs.
- Page tokens: stored encrypted at rest is recommended; the schema column is
  `accessToken` and the codebase reads/writes it directly. In production swap
  in an envelope-encryption helper (e.g. AWS KMS) before persisting.
- OAuth state: should be a signed nonce for CSRF protection on the FB callback;
  not yet implemented in this scaffold.
- Secrets: nothing in source; everything from env vars.
- CSP/HSTS: configure at the hosting layer (Vercel headers).

## Scaling notes

- The `Job` table is indexed on `(status, scheduledFor)` so the cron worker
  picks pending jobs efficiently regardless of size.
- The ledger is append-only; reading the live balance is O(1) (`User.tokenBalance`).
- Multiple cron workers can run simultaneously thanks to the
  `updateMany({ where: { id, status: "PENDING" } })` claim pattern.
- For high throughput, swap Vercel Cron for a dedicated worker (Inngest, QStash,
  Trigger.dev) hitting the same endpoint.
