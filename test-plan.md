# DistroPro PR #1 — Manual Top-up + Admin Approval Test Plan

PR: https://github.com/joshbuttler374/distropro/pull/1
Session: https://app.devin.ai/sessions/9715cb211e434e9dbc9b13a9e5d363af

## What changed (in user-visible terms)

A new **Manual (PK)** flow on `/billing` lets a user request a token top-up by
paying via Easypaisa / JazzCash / Binance to operator **Ahmad Hassan** and
pasting the transaction reference. An **Admin · Payments** panel
(`/admin/payments`, allowlisted via `ADMIN_EMAILS`) lists pending requests; one
click on **Approve & credit** flips the payment to `COMPLETED` and credits
tokens via the same atomic ledger transaction Stripe uses.

PR #1 also includes a **bug fix** for a TOCTOU race + non-atomic state issue
flagged by Devin Review: the approve flow is now wrapped in a single
`prisma.$transaction` with an `updateMany WHERE id=:id AND status='PENDING'`
atomic claim, so a second concurrent approve cannot double-credit and a partial
failure cannot strand a payment as `COMPLETED` with no tokens credited.

## Environment

- Local Next.js dev server on `http://localhost:3000`
- Local Postgres in Docker (`postgres:16-alpine` on `localhost:5432`)
- `PAYOUT_*` env vars point at Ahmad Hassan's real numbers
  (Easypaisa `03435076055`, JazzCash `03085076055`, Binance `370870535`)
- `ADMIN_EMAILS=admin@distropro.com`
- Pre-seeded users:
  - `demo@distropro.com` / `password123` — `tokenBalance = 1000`, **not** admin
  - `admin@distropro.com` / `password123` — `tokenBalance = 0`, admin
- All ledger / payment tables empty at start of test

## Primary flow — manual top-up + admin approval

Code traced:
- `src/app/(dashboard)/billing/page.tsx:127-228` — Manual tab + submit button
- `src/app/api/billing/request-topup/route.ts` — POST creates `PENDING` Payment
- `src/app/(dashboard)/admin/payments/client.tsx:111-128` — Approve & credit
- `src/app/api/admin/payments/[id]/route.ts:48-83` — atomic approve + credit

| # | Action | Expected pass criterion (would differ if broken) |
|---|--------|-------------------------------------------------|
| 1 | Log in as `demo@distropro.com` and visit `/dashboard` | "Token balance" stat-card shows exactly **`1,000`** (with locale comma). |
| 2 | Click "Billing" in the sidebar | Page title "Billing" renders. "Current balance" card shows **`1,000` tokens available**. **Manual (PK)** tab is selected by default. |
| 3 | In the Manual tab, verify operator details box | Heading text "Step 1". Account holder reads exactly **"Ahmad Hassan"**. Method list contains exactly three rows in this order: **Easypaisa `03435076055`**, **JazzCash `03085076055`**, **Binance Pay ID `370870535`** (with hint "USDT / BUSD on Binance Pay"). |
| 4 | Click the **Copy** button next to Easypaisa | Sonner toast appears with text **"Copied"**. Clipboard reads exactly `03435076055`. |
| 5 | Set "Number of tokens" to **`1000`**, leave method = **easypaisa**, paste reference **`E2E-TEST-001`**, click **Submit top-up request** | Success toast: **"Top-up request submitted. Tokens will be credited after admin verification."** A new row appears in "Your top-ups" with `1,000` tokens / `Rs 500` / `easypaisa` / `E2E-TEST-001` / status pill **`PENDING`**. |
| 6 | DB sanity check (shell): `SELECT status, "tokensGranted", "amountCents", reference, method FROM "Payment"` | Exactly one row, status=`PENDING`, tokensGranted=`1000`, amountCents=`50000`, reference=`E2E-TEST-001`, method=`easypaisa`. |
| 7 | Sign out, sign in as `admin@distropro.com`, click **Admin · Payments** in sidebar | URL is `/admin/payments`. Page heading "Admin · Payments". Default filter `PENDING` is selected. The list shows exactly **1** payment, card title reads `PENDING payments (1)`. The row shows the demo user's email, requested 1,000 tokens, `Rs 500`, method `easypaisa`, ref `E2E-TEST-001`, current balance `1000`. |
| 8 | Click the **Approve & credit** button on that row | Sonner toast: **"Approved & tokens credited"**. The row disappears from the PENDING tab (count goes to `0`). Switching the filter chip to **COMPLETED** shows the same payment with no Approve button. |
| 9 | Sign out, sign back in as `demo@distropro.com`, visit `/dashboard` | "Token balance" stat-card now shows exactly **`2,000`** (1000 starting + 1000 credited). Visit `/billing` — top-ups table shows the same row with status pill **`COMPLETED`**. |
| 10 | Visit `/history` (ledger) | The most recent ledger entry has type `TOPUP`, amount `+1000`, balance `2000`, note containing "Top-up: 1000 tokens". |

**Why this distinguishes working vs broken:** if the `creditTokens` call were
silently skipped, step 9's balance would still be `1,000`. If the ledger entry
weren't written inside the transaction, step 10 would show no `TOPUP` row.
If the admin gating were wrong, the demo user could reach `/admin/payments`
(which it cannot — middleware + per-route 403).

## Adversarial flow — double-credit defense (the TOCTOU fix)

This is the actual point of the bug fix in commit `3aca7dd`. The earlier
implementation pre-read the payment, checked status, then wrote — two
concurrent approves both passed the check and both credited tokens.

The fixed implementation uses `prisma.$transaction` + `updateMany WHERE
status='PENDING'` so only the first request's claim succeeds; the second sees
`claim.count !== 1`, throws `PAYMENT_NOT_PENDING`, the transaction rolls back,
and the API returns 409 with `{"error":"Payment already processed"}`.

Code traced: `src/app/api/admin/payments/[id]/route.ts:48-83`.

| # | Action | Expected pass criterion (would differ if broken) |
|---|--------|-------------------------------------------------|
| 11 | As demo user, submit a **second** manual top-up: 500 tokens, easypaisa, reference `E2E-TEST-002` | New PENDING payment row appears. DB: 2 payments total, the new one PENDING. |
| 12 | As admin, on the `PENDING` tab, copy the new payment's id from the page or via `SELECT id FROM "Payment" WHERE reference='E2E-TEST-002'` | Have the id captured for the next step. |
| 13 | Click **Approve & credit** once normally → wait for the toast. Then send a direct PATCH to the now-COMPLETED payment to simulate a stale double-click: `curl -X PATCH http://localhost:3000/api/admin/payments/<id> -H "Cookie: <admin session>" -H "Content-Type: application/json" -d '{"action":"approve"}'` | The first click returns the success toast and balance goes to `2,500` (was 2,000, +500). The second curl returns HTTP **`409`** with body `{"error":"Payment already processed"}`. |
| 14 | DB verify: `SELECT status FROM "Payment" WHERE reference='E2E-TEST-002'` and demo user balance | Status is `COMPLETED` (not double-flipped to anything else). Balance is exactly `2,500` (NOT `3,000`, which is what a successful double-credit would produce). Ledger has exactly **one** new `TOPUP` row of `+500`, not two. |

**Why this distinguishes working vs broken:** if the TOCTOU race weren't
fixed, the second PATCH would also return 200 and the demo balance would jump
to `3,000` with two ledger entries. The test fails loudly the moment the
balance is wrong.

## Out of scope (not testing)

- Stripe checkout (separate flow, no changes in this PR)
- Reject path (same atomic claim — verified by the same code review; happy-path
  approve covers the critical correctness point)
- Email OTP signup (no changes in this PR)
- Concurrency at true wall-clock parallelism (a serialized "second curl after
  the first toast" reproduces the *intent* of the TOCTOU defense — the row's
  status is no longer `PENDING`, so the `updateMany` claim returns count=0
  and 409 is returned, which is exactly the production behavior)

## Reporting

- Record the full UI flow as a single recording (login → submit → switch users
  → approve → verify balance) with `annotate_recording` markers at each test
  start and assertion.
- Capture screenshots at every assertion point.
- Run shell DB queries inline; capture outputs in the report.
- Post one consolidated comment on PR #1 with the result and link to the Devin
  session. Attach a `test-report.md` to the user message.
