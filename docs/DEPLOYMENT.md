# Deployment Guide

## 1. Database (PostgreSQL)

Use any managed Postgres (Supabase, Neon, Railway, RDS). Get the connection
string and set it as `DATABASE_URL`.

Apply the schema:
```bash
pnpm prisma db push
```

## 2. Vercel (frontend + API)

1. Push the repo to GitHub.
2. Import to Vercel.
3. Set environment variables (everything in `.env.example`).
4. Vercel will detect Next.js and deploy. The first build runs `prisma generate`
   automatically (via the `postinstall` script).

## 3. Vercel Cron

`vercel.json` already contains the cron config:

```json
{ "crons": [{ "path": "/api/cron/run-jobs", "schedule": "* * * * *" }] }
```

Set `CRON_SECRET` in Vercel env vars; Vercel Cron will pass it as
`Authorization: Bearer …` automatically.

## 4. Resend (email)

1. Sign up at resend.com.
2. Verify your sending domain.
3. Set `RESEND_API_KEY`.
4. Update the `from:` address in `src/lib/email.ts` to a verified sender.

## 5. Stripe (payments)

1. Sign up at stripe.com.
2. Get test keys, set `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. Create a webhook for `checkout.session.completed` pointing to
   `https://yourdomain.com/api/billing/webhook`. Copy the signing secret to
   `STRIPE_WEBHOOK_SECRET`.

## 6. Facebook Graph API

1. Create a Meta App at <https://developers.facebook.com/>.
2. Add the **Facebook Login** product.
3. Set OAuth redirect to `https://yourdomain.com/api/pages/callback`.
4. Submit for App Review with the following permissions:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `pages_manage_metadata`
5. Set `META_APP_ID` and `META_APP_SECRET`.

> ⚠ App Review can take 1–4 weeks and Meta will require you to demonstrate your
> use case (screen recording, business verification, etc.).

## 7. Optional: Upstash Redis (rate limiting)

1. Create a Redis database at upstash.com.
2. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` into env.

Without these, the in-memory fallback in `src/lib/rate-limit.ts` permits all
requests (fine for development; add Redis for production).

## 8. Optional: OpenAI (moderation)

Set `OPENAI_API_KEY`. If unset, moderation is skipped (allows all content
through; not recommended for production).
