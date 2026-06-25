# Referral Foundation — Design Spec (Agent Campaign, Sub-project 1 of 5)

- **Date:** 2026-06-25
- **Status:** Proposed — awaiting user review before implementation planning
- **Repos:** Backend `RenoXpert-Backend` (deploys from `production`, PR-protected) + Frontend `RenoXpert-Frontend-v2.1` (deploys from `production`, merge+push)

## 0. Where this fits (decomposition)

The "Agent Campaign + RenoXpert Improvement" request decomposes into 5 sub-projects, each its own spec→plan→build:
1. **Referral foundation** ← THIS SPEC — per-user referral codes + booking referral fields + manual admin backfill.
2. Referral link + cookie capture (public `?ref=` link, cookie, auto-stamp the referrer at booking creation).
3. Campaign visibility to agents (a `visible_to_agents` flag + staff toggle).
4. Agent identity + Google login + onboarding (`users.type='agent'`).
5. Agent portal (agent-only campaign list + their referral link).

**Locked decisions (whole feature):** agents are regular users with `users.type='agent'` (so they get the per-user referral code for free; a booking's referrer is any user). **SP1 decisions:** referral code = **8-char uppercase alphanumeric**, unambiguous alphabet (no `0/O/1/I`), uniqueness-checked; empty-booking backfill = **manual, per booking, in admin**.

## 1. Goal

Give **every user** a unique referral code (generated on creation + backfilled for existing users), add **referral fields to bookings**, and let **staff manually set the referrer** on bookings that have none. This is the data foundation the agent/referral features build on. No public-facing or agent-facing behavior yet.

## 2. Scope

- **Backend:** `users.referral_code` column + generation + backfill; `bookings` referral columns; `Booking` model/relation/resource; an admin endpoint to set a booking's referrer.
- **Frontend (admin only):** show/set a booking's "Referred by" in the campaign bookings view; surface a user's referral code where users are viewed.
- **Out of scope:** public `?ref` link, cookies, auto-capture at booking creation (SP2); agents/Google/portal/visibility (SP3–5). No change to the public booking/payment flow in this sub-project.

## 3. Backend — `RenoXpert-Backend`

### 3.1 Per-user referral code
- **Migration (managed `users` table):** add `referral_code` `string(8)` **nullable**, then **unique** index. Add it nullable first, backfill, then the unique index — in one migration: add column → backfill all rows → add unique index (so the unique index never fails on existing nulls).
- **Generator:** `User::generateReferralCode(): string` — 8 chars from the alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no `0/O/1/I`), regenerate while `User::where('referral_code', $code)->exists()`. (Whole feature reuses this.)
- **On create:** in the existing `User` `creating` boot hook (`User.php:47`, which already sets `uuid`/`created_by`), set `referral_code` when empty: `if (empty($model->referral_code)) $model->referral_code = self::generateReferralCode();`.
- **Backfill existing users:** in the same migration's `up()`, after adding the column and before the unique index, loop users lacking a code and assign one via the generator (idempotent — only fills nulls).
- `referral_code` added to `User` `$fillable`; exposed in `UserResource` — which is the single resource the admin user **list and detail** both use (`UserController` uses `UserResource` everywhere), so one edit covers admin list + detail.

### 3.2 Booking referral fields
- **Migration (authored; `bookings` is an unmanaged base table → `Schema::table` ALTER; user runs it):** add `referred_by_user_id` `unsignedBigInteger` **nullable** with a FK to `users.id` (nullOnDelete), and `referral_code` `string` **nullable** (the raw code used — kept for audit even if a code is later reassigned). `down()` drops the FK + both columns.
- `Booking` model: add `referred_by_user_id` + `referral_code` to `$fillable`; add `referredBy()` `belongsTo(User::class, 'referred_by_user_id')`.
- `BookingResource`: expose `referred_by_user_id`, `referral_code`, and a nested `referred_by` (id + name + referral_code) via `whenLoaded('referredBy')`.

### 3.3 Admin backfill endpoint
- **Route (auth group, staff):** `PUT campaigns/{campaignId}/bookings/{bookingId}/referral` → `BookingController@setReferral` (placed next to the existing `campaigns/{campaignId}/bookings` route). Accepts `{ referral_code?: string, referred_by_user_id?: int }` (exactly one).
- **Behavior:** resolve the referrer — if `referred_by_user_id` given, validate it exists; else look up `User::where('referral_code', strtoupper(trim(code)))->first()` (404/422 if not found). Set the booking's `referred_by_user_id` + `referral_code` (store the resolved user's code) and save. Return the updated `BookingResource` (with `referredBy` loaded). `BookingController` already `extends BaseController` (confirmed — `BookingController.php:13`), so `sendResponse`/`sendError` are available. Guard: a user cannot refer their own booking (`referred_by_user_id !== booking.user_id`) → 422.
- **Resolver helper:** a single `User::findByReferralCode($code)` (or inline) reused by SP2's public capture later.

## 4. Frontend (admin) — `RenoXpert-Frontend-v2.1`

- **Campaign bookings view** (`src/pages/Campaign/CampaignDetail.tsx`, which lists bookings via `useFetchCampaignBookings`/`getCampaignBookings`): for each booking show **"Referred by"** (the nested `referred_by` name + code, or "—"). For bookings with no referrer, a small inline control (a referral-code text input or a user search) + "Save" that calls a new `setBookingReferral(campaignId, bookingId, { referral_code | referred_by_user_id })` API fn → the endpoint, then refreshes the list.
- **API:** add `setBookingReferral(...)` to `services/api.ts`.
- **User referral code (minor):** surface `user.referral_code` where users are listed/detailed in admin (read-only copy-to-clipboard is fine, reusing the existing ClipboardJS pattern). If the user-list resource doesn't carry it, ensure §3.1 exposes it.

## 5. Constraints

- **Backend schema:** `users` is migration-managed (normal migration); `bookings` is an unmanaged base table → authored additive `Schema::table` migration. **NEVER run `php artisan migrate`** (user runs it). `php` CLI unavailable → manual review. New API controller code must use `BaseController` helpers.
- Both repos deploy from **`production`**; backend via **PR to `production`**, frontend **merge+push**.
- No new npm dependencies (reuse existing ClipboardJS for copy). **FE gate:** `npm run build` exit 0 + scoped eslint no new errors (`services/api.ts` baseline 17; touched pages no new errors). No test runner.
- **Graceful degradation:** until the migrations run, the FE reads `referred_by`/`referral_code` as absent (shows "—").

## 6. Verification

- **Backend:** manual review — users migration order (add nullable → backfill → unique index); generator alphabet + uniqueness loop; `creating` hook sets code only when empty; bookings ALTER additive+nullable with FK; model fillable + relation; resource fields; endpoint resolves code/user, self-referral guard, returns resource.
- **Frontend:** build exit 0; eslint no new errors.
- **Manual QA (after migrate + deploy):** every existing user has an 8-char code (spot check `SELECT referral_code FROM users`); a new user gets one on creation; in admin, a booking with no referrer can be assigned one by code and by user search; self-referral is rejected; the assigned referrer shows on the booking.

## 7. Risks & mitigations

- **Unique index vs existing nulls** → add column nullable, backfill, *then* add the unique index (all in one migration), so the index is added only once every row has a value.
- **Code collisions** → generator loops until `referral_code` is unused; the DB unique index is the backstop.
- **`bookings` unmanaged** → use an authored `Schema::table` ALTER (additive, nullable), consistent with prior campaign-column migrations; never rebuild the table.
- **Self-referral / bad code** → endpoint validates the code resolves and `referred_by_user_id !== booking.user_id`.

## 8. Non-goals

No public referral link, cookie, or auto-capture at booking creation (SP2). No agent type, Google auth, onboarding, portal, or campaign visibility (SP3–5). No commission/payout logic. No bulk booking backfill (manual per-booking only).

## 9. Suggested plan tasks

1. **BE-users:** `users.referral_code` migration (add nullable → backfill → unique) + `generateReferralCode()` + `creating` hook + `$fillable` + `UserResource`.
2. **BE-bookings:** authored `bookings` ALTER migration (referral fields + FK) + `Booking` `$fillable`/`referredBy()` + `BookingResource`.
3. **BE-endpoint:** `setReferral` controller method + route + code→user resolver + self-referral guard.
4. **FE-admin:** `setBookingReferral` API + "Referred by" display/set control in `CampaignDetail` bookings; surface user referral code.
5. **Verify + finalize:** FE build/eslint, BE manual review; BE PR to `production`; FE merge+push.
