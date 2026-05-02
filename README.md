# DistroPro

A clean-room, production-quality SaaS for distributing video content to Facebook
pages on a schedule, with token-metered usage. Built with Next.js 15 (App Router),
TypeScript, Prisma, NextAuth, Tailwind, Stripe, and the Facebook Graph API.

This codebase is an independent rebuild that replicates the **workflow** of
existing Facebook-page-distribution tools without scraping or reusing any
proprietary code. Default content acquisition is **BYOC** (Bring Your Own
Content): users supply MP4 URLs they have rights to, and DistroPro publishes
them via Facebook's official Reels Graph API.

## Stack

| Layer            | Choice                                    |
|------------------|-------------------------------------------|
| Framework        | Next.js 15 (App Router, RSC, Server Actions) |
| Language         | TypeScript (strict)                        |
| UI               | Tailwind CSS, Radix UI, shadcn-style components, Lucide icons, Sonner toasts |
| Auth             | NextAuth.js (credentials + email-OTP) with JWT sessions |
| Database         | PostgreSQL via Prisma ORM                  |
| Email            | Resend (OTP delivery)                      |
| Payments         | Stripe Checkout + webhook                  |
| Rate limiting    | Upstash Redis (in-memory fallback for dev) |
| Moderation       | OpenAI Moderation API                      |
| Publish          | Facebook Graph API v19 (Reels chunked upload) |
| Cron             | Vercel Cron (1-minute interval)            |
| Analytics        | Vercel Web Analytics                       |
| Hosting          | Vercel (frontend) + any managed Postgres   |

## Quick Start

```bash
git clone https://github.com/joshbuttler374/distropro.git
cd distropro

# 1. Install
pnpm install     # or npm install

# 2. Configure env
cp .env.example .env.local
# fill in DATABASE_URL, NEXTAUTH_SECRET, etc.

# 3. Initialize the database
pnpm db:push     # syncs Prisma schema to your Postgres
pnpm db:seed     # creates demo@distropro.com / password123 with 1000 tokens

# 4. Run dev server
pnpm dev
```

Visit <http://localhost:3000>.

## Environment Variables

See `.env.example`. Required for full functionality:

- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_URL` — base URL of your deployment
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `RESEND_API_KEY` — for OTP emails (optional in dev; codes log to console)
- `META_APP_ID`, `META_APP_SECRET` — your Facebook App credentials
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `OPENAI_API_KEY` — for content moderation (optional; bypassed in dev)
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — rate limiter (optional)
- `CRON_SECRET` — bearer token Vercel Cron uses to call `/api/cron/run-jobs`

## Architecture

```
┌──────────────┐    ┌────────────────┐    ┌───────────────┐
│  Next.js UI  │───▶│  API routes    │───▶│  Prisma + DB  │
│  (App Router)│    │  + Server Actions     └───────────────┘
└──────────────┘    └────────────────┘            │
       │                    │                     │
       │                    │           ┌─────────▼──────────┐
       │            ┌───────▼────────┐  │  Token Ledger      │
       │            │  Cron worker   │  │  (atomic txns)     │
       │            │  /api/cron/*   │  └─────────┬──────────┘
       │            └───────┬────────┘            │
       │                    │            ┌────────▼──────────┐
       │                    └───────────▶│  FB Graph API     │
       └─────────────────────────────────│  Reels publish    │
                                         │  3-stage upload   │
                                         └───────────────────┘
```

See `docs/ARCHITECTURE.md` for a deeper dive.

## Source Adapters (extending content acquisition)

DistroPro's default `UploadAdapter` accepts a video URL and trusts that the
user has the rights to publish it. To add IG/TikTok/YouTube acquisition,
implement the `SourceAdapter` interface in `src/lib/source-adapters/` using a
licensed scraping API. Do not add yt-dlp or similar without ensuring you have
the rights to redistribute the content — scraping third-party content may
violate platform ToS and copyright law.

## Manual Top-ups (Pakistan / non-Stripe markets)

Stripe doesn't operate in Pakistan, so DistroPro ships a manual top-up flow
alongside Stripe:

1. **User** picks a token amount on `/billing`, sees the operator's
   Easypaisa / JazzCash / Binance / bank details (configured via `PAYOUT_*`
   env vars), pays out-of-band, then submits the transaction reference.
2. A `Payment` row is created with `provider=LOCAL_GATEWAY` and
   `status=PENDING`.
3. **Admin** (an email in `ADMIN_EMAILS`) opens `/admin/payments`, verifies
   the transaction in their bank/wallet app, and clicks **Approve** —
   tokens are credited via the same atomic ledger transaction Stripe uses.

The manual UI is hidden automatically when no `PAYOUT_*` env vars are set.

## Token Ledger

Token mutations go through a single function that:

1. Opens a Prisma transaction
2. Reads `user.tokenBalance`
3. Validates the operation (e.g. CHARGE cannot make balance negative)
4. Updates `user.tokenBalance`
5. Inserts a `LedgerEntry` row with the new balance for audit

This guarantees that all balance changes have a corresponding ledger entry and
that no two concurrent charges can exceed available balance.

## API Reference

See `docs/API.md`.

## Deployment

See `docs/DEPLOYMENT.md`.

## License

MIT — see `LICENSE`.
