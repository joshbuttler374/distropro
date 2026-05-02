# API Reference

All API routes are under `/api/*`. JSON request/response bodies. Authenticated
endpoints require a NextAuth session cookie (or JWT bearer in custom clients).

## Auth

### `POST /api/auth/signup`

Body:
```json
{ "name": "Jane", "email": "jane@example.com", "phone": "+1...", "password": "min8chars" }
```

Response: `{ ok: true }`. Sends a 6-digit code via Resend.

### `POST /api/auth/verify`

Body: `{ "email": "jane@example.com", "code": "123456" }`

Response: `{ ok: true }`. Marks `user.emailVerified = true`.

### `POST/GET /api/auth/[...nextauth]`

Standard NextAuth handler. Login uses the `credentials` provider:
```
POST /api/auth/callback/credentials
```

## Account

### `GET /api/me`

Returns the current user object (id, name, email, phone, tokenBalance, createdAt).

### `GET /api/me/ledger`

Returns the last 100 `LedgerEntry` rows for the authenticated user.

## Facebook Pages

### `GET /api/pages/connect`

Redirects to Facebook OAuth dialog with the required permissions
(`pages_show_list`, `pages_read_engagement`, `pages_manage_posts`,
`pages_manage_metadata`).

### `GET /api/pages/callback`

OAuth redirect target. Exchanges the `code` for a long-lived token, lists the
user's managed pages, and persists each one with its own page-scoped token.

### `GET /api/pages`

Returns the authenticated user's connected pages.

### `DELETE /api/pages?id=...`

Removes a page (only if the caller owns it).

## Sources

### `GET /api/sources`

Returns the authenticated user's content sources.

### `POST /api/sources`

Body: `{ platform: "UPLOAD"|"INSTAGRAM"|..., handle: "https://...|@user" }`

For `UPLOAD`, also creates a `Reel` row pointing to the supplied MP4 URL.

### `DELETE /api/sources?id=...`

## Schedules

### `GET /api/schedules`

### `POST /api/schedules`

Body: `{ pageId, sourceId?, cronExpr, timezone? }`

### `PATCH /api/schedules?id=...`

Body: `{ isActive: boolean }`

## Jobs

### `GET /api/jobs?limit=50`

Returns up to 200 of the authenticated user's most recent jobs.

## Uploads / Moderation

### `POST /api/uploads`

Body: `{ videoUrl, title? }`

Validates URL and runs the title through OpenAI Moderation.

### `POST /api/moderation`

Body: `{ text }`. Returns `{ safe: boolean, reason?: string }`.

## Billing

### `POST /api/billing/checkout`

Body: `{ tokens: number }`

Returns `{ url }` — a Stripe Checkout session URL.

### `POST /api/billing/webhook`

Stripe webhook. Verifies signature, then on `checkout.session.completed`
records a `Payment` row and credits tokens via the ledger.

## Cron

### `GET /api/cron/run-jobs`

Requires `Authorization: Bearer ${CRON_SECRET}`. Picks up to 50 due jobs and
publishes each to Facebook. Returns `{ processed, results[] }`.
