# Deploy DistroPro to Vercel + Supabase (Free)

Total time: **~10 minutes**. You'll click through three sites: Supabase → Vercel → your local terminal (one command).

---

## Step 1 — Create a free Supabase project (2 min)

1. Go to **https://supabase.com** → **Start your project** → sign in with GitHub.
2. Click **New project**.
3. Fill in:
   - **Name**: `distropro`
   - **Database password**: click the dice to generate a strong one. **Save it now** — you won't see it again.
   - **Region**: pick the one closest to you (Pakistan → `Asia South 1 (Mumbai)` is closest).
   - **Plan**: Free.
4. Click **Create new project**. Wait ~90 seconds while it provisions.

### Grab the connection string

5. Once provisioned, in the left sidebar click **Project Settings → Database**.
6. Scroll to **Connection string** → switch the tab to **URI** → **Connection pooling: Transaction mode** (port 6543).
7. Copy the URL. It looks like:
   ```
   postgres://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   ```
8. Replace `[YOUR-PASSWORD]` with the password from step 3.
9. Append `?pgbouncer=true&connection_limit=1` to the end so Prisma plays nice with the pooler:
   ```
   postgres://postgres.xxxxx:YOURPW@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   ```

This is your `DATABASE_URL`. Save it in a notes file — you'll paste it into Vercel in step 2 and into your terminal in step 3.

---

## Step 2 — Import the repo into Vercel (3 min)

1. Go to **https://vercel.com** → **Sign Up / Log In with GitHub**.
2. On the dashboard, click **Add New… → Project**.
3. Find **joshbuttler374/distropro** in the list and click **Import**.
4. **Configure Project** screen:
   - **Framework Preset**: Next.js (auto-detected — leave as-is)
   - **Root Directory**: `./`
   - **Build / Output / Install commands**: leave defaults

### Paste the env vars

5. Expand **Environment Variables** and paste these (one per row — click **Add Another** between each):

| Name | Value | Required? |
|---|---|---|
| `DATABASE_URL` | the URL from step 1.9 | ✅ |
| `NEXTAUTH_SECRET` | `fma8KgqGPPGhgvZATCkBfeqjj9hhD61sxkEYK4t/tK0=` | ✅ |
| `NEXTAUTH_URL` | leave blank for now — fill in step 4 | ✅ |
| `CRON_SECRET` | `25163f45cf2c26ce3ad42ecf5a7477ef92d79bc683e8dfa4` | ✅ |
| `ADMIN_EMAILS` | your real email (e.g. `joshbuttler374@gmail.com`) | ✅ |
| `PAYOUT_NAME` | `Ahmad Hassan` | manual top-up |
| `PAYOUT_EASYPAISA` | `03435076055` | manual top-up |
| `PAYOUT_JAZZCASH` | `03085076055` | manual top-up |
| `PAYOUT_BINANCE` | `370870535` | manual top-up |
| `TOKEN_PRICE_PKR` | `0.5` | optional (default 0.5) |

> The two random strings above (`NEXTAUTH_SECRET`, `CRON_SECRET`) were generated for this deploy — feel free to use them as-is. Don't reuse them anywhere else.

> Stripe / Meta / Resend / OpenAI / Upstash env vars are **optional**. Skip them for now — the app degrades gracefully without them. The manual top-up flow works without any of them.

6. Click **Deploy**. Wait ~2 minutes.

When it finishes you'll see a screen with a domain like `distropro-abcd.vercel.app`. **Copy that domain.**

---

## Step 3 — Push the database schema (2 min)

The Vercel build doesn't run `prisma db push` (it only runs `prisma generate`), so the Supabase database is empty. Push the schema once from your local machine:

```bash
git clone https://github.com/joshbuttler374/distropro.git
cd distropro
npm install

# Paste your Supabase URL here:
export DATABASE_URL="postgres://postgres.xxxxx:YOURPW@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

npx prisma db push
```

You should see: `✔ The database is now in sync with your Prisma schema.`

### Create your admin user

In the same terminal:

```bash
ADMIN_EMAIL="joshbuttler374@gmail.com" \
ADMIN_PASSWORD="$(openssl rand -base64 18)" \
ADMIN_NAME="Ahmad Hassan" \
npx tsx scripts/setup-prod.ts
```

This prints `✓ Admin user ready: joshbuttler374@gmail.com (isAdmin=true)` and a generated password to stdout. **Save the password** — you'll use it to log in.

> The email you use here MUST match `ADMIN_EMAILS` in Vercel for the admin panel to show up.

---

## Step 4 — Wire up `NEXTAUTH_URL` (1 min)

NextAuth needs to know your production domain.

1. Back in Vercel → your project → **Settings → Environment Variables**.
2. Find `NEXTAUTH_URL` (you left it blank earlier) → click **Edit** → set value to:
   ```
   https://distropro-abcd.vercel.app
   ```
   (substitute your actual domain from step 2.6)
3. Save.
4. Go to **Deployments** tab → find the latest deploy → click the **⋯** menu → **Redeploy** → **Redeploy** (uncheck "Use existing build cache").

Wait another ~90 seconds.

---

## Step 5 — Smoke test the live deploy

1. Visit `https://your-domain.vercel.app/login`.
2. Sign in with `ADMIN_EMAIL` + the password from step 3.
3. Click **Billing** in the sidebar → confirm:
   - "Manual (PK)" tab is selected
   - Account holder: **Ahmad Hassan**
   - Easypaisa `03435076055`, JazzCash `03085076055`, Binance `370870535`
4. Click **Admin · Payments** in the sidebar (only visible because your email is in `ADMIN_EMAILS`) → page loads with empty PENDING list.
5. Done — the manual top-up + admin flow is live.

---

## Optional integrations (add anytime)

You can add these later by going to Vercel → Settings → Environment Variables → Add → Save → Redeploy.

| Feature | Vars to add | When to add |
|---|---|---|
| Email OTP signup (so non-admins can sign up) | `RESEND_API_KEY` (sign up at resend.com) + verify a sender domain | When you want public signups |
| Stripe card payments | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | When you want international cards |
| Facebook publishing | `META_APP_ID`, `META_APP_SECRET` | After Meta App Review approval |
| AI moderation | `OPENAI_API_KEY` | Before you let users publish |
| Rate-limit hardening | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | When traffic grows |

The app boots fine without any of these — they're feature-flagged off when missing.

---

## Troubleshooting

- **Build fails on Vercel with "Can't reach database"** — your `DATABASE_URL` is wrong. Most common cause: forgot to URL-encode special chars in the password, or didn't append `?pgbouncer=true&connection_limit=1`.
- **Login redirects in a loop** — `NEXTAUTH_URL` is wrong or missing. Must exactly match the Vercel domain (with `https://`, no trailing slash).
- **"Admin · Payments" link doesn't appear** — your email in `ADMIN_EMAILS` doesn't match what you signed up with. Case-insensitive match; check for typos.
- **Cron job doesn't run** — Vercel Hobby plan only runs cron once a day. To get the 1-minute interval defined in `vercel.json`, you need Pro ($20/mo) or you can poll the endpoint from a separate cron service.
- **Supabase connection limit errors at scale** — switch from the pooler URL (`:6543`) to the direct URL (`:5432`) with a higher `connection_limit`, or upgrade Supabase.
