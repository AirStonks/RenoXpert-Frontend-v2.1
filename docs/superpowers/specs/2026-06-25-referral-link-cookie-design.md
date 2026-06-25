# Referral Link + Cookie Capture — Design Spec (Agent Campaign, Sub-project 2 of 5)

- **Date:** 2026-06-25
- **Status:** Proposed — awaiting user review before implementation planning
- **Repos:** Backend `RenoXpert-Backend` (deploys from `production`, PR-protected) + Frontend `RenoXpert-Frontend-v2.1` (deploys from `production`, merge+push)
- **Builds on:** SP1 (referral codes on users; `bookings.referred_by_user_id`/`referral_code`; resolver). SP1 is merged (BE PR #9) — run `php artisan migrate` on the live DB if not yet done.

## 0. Decomposition

5 sub-projects: **1 Referral foundation (done)** → **2 Referral link + cookie capture (THIS)** → 3 Campaign visibility to agents → 4 Agent Google auth + onboarding → 5 Agent portal. Locked: agents are `users.type='agent'` (later); a booking's referrer is any user.

**SP2 decisions (locked):** copy-link button lives in the **admin campaign view** now (reusable for the agent portal); attribution is **last-touch** (each valid `?ref` overwrites the cookie).

## 1. Goal

Capture a referrer when a customer arrives via a referral link and books: read `?ref=<code>` on public campaign pages → store it in a cookie → the public booking flow submits it → the backend stamps the booking's referrer (reusing SP1's fields/resolver). Plus a reusable "Copy referral link" affordance in the admin campaign view.

## 2. Scope

- **Frontend (public):** a cookie/referral util; capture `?ref` on the public campaign pages; `bookingPaymentIntent` submits the captured code.
- **Backend:** `PaymentController::paymentIntentBooking` resolves the submitted code → stamps `referred_by_user_id` + `referral_code` on the created booking.
- **Frontend (admin):** a reusable `CopyReferralLink` (current user's code → public campaign URL), placed in the admin campaign detail; a `getCurrentUser()` API fn; a `VITE_CAMPAIGN_URL` env.
- **Out of scope:** agent identity/Google/onboarding/portal (SP4–5); campaign visibility (SP3); commission/payout; any change to the admin manual-backfill from SP1.

## 3. Frontend — public capture

### 3.1 Referral util — `src/utils/referral.ts` (no new dependency)
- `REF_COOKIE = 'rx_ref'`, `REF_TTL_DAYS = 30`.
- `setReferralCookie(code: string): void` — writes `rx_ref=<code>; path=/; max-age=<30d>; SameSite=Lax` via `document.cookie`. **Last-touch:** always overwrites.
- `getReferralCode(): string | null` — reads `rx_ref` from `document.cookie` (null if absent).
- `captureReferralFromUrl(search: string): void` — parse `new URLSearchParams(search).get('ref')`; if non-empty, `setReferralCookie(code.trim().toUpperCase())`. (Trim/uppercase to match the stored 8-char code form; the backend also uppercases.)
- All wrapped in `typeof document !== 'undefined'` guards for safety.

### 3.2 Capture on the public campaign pages
- In `CampaignDetailPage.tsx`, `CampaignLayoutDetailPage.tsx`, and `CampaignPackageDetailPage.tsx`, add a mount effect: `useEffect(() => { captureReferralFromUrl(window.location.search); }, [])`. (These are the public campaign entry points; an agent may share a link to any of them.) No other behavior changes.

### 3.3 Booking submits the code — `src/services/publicApi.ts`
- `bookingPaymentIntent` (line ~95) currently POSTs `{ name, phone, email, packageId }`. Add `referral_code: getReferralCode() || undefined` to that body (import `getReferralCode` from `../utils/referral`). Both booking forms (`CampaignDetailPage`, `CampaignLayoutDetailPage`) thus submit it with **no component change**. Omit the field when null (don't send `referral_code: null`).

## 4. Backend — stamp the referrer

`app/Http/Controllers/PaymentController.php`, `paymentIntentBooking` (line ~160):
- Add to the validator: `'referral_code' => 'nullable|string|max:32'`.
- Before `Booking::create([...])` (line ~219): resolve the referrer —
  ```php
  $referrer = null;
  if (!empty($input['referral_code'])) {
      $referrer = \App\Models\User::where('referral_code', strtoupper(trim($input['referral_code'])))->first();
  }
  ```
- In the `Booking::create([...])` array, add (only meaningfully set when resolved):
  ```php
  'referred_by_user_id' => $referrer?->id,
  'referral_code' => $referrer?->referral_code,
  ```
- An invalid/expired/unknown code resolves to `null` → both fields stay null and the booking proceeds normally (no error). Anonymous public booking has no `user_id`, so there is no self-referral case to guard here.
- Use the normal (non-trashed) User scope so a soft-deleted user cannot be credited.

## 5. Frontend — copy referral link (admin)

### 5.1 Config
- Add to `.env`: `VITE_CAMPAIGN_URL=https://campaign.renoxpert.my/` and a staging value (`s-campaign.renoxpert.my`) consistent with the existing `VITE_*_URL` entries. (The public `/campaigns/...` routes are served on the campaign domain — App.tsx `isCampaignDomain`.)

### 5.2 Current user
- Add `getCurrentUser()` to `src/services/api.ts` → `GET {API_URL}user` with auth headers (the existing `/user` route returns `UserResource`, which now includes `referral_code`). Returns the user object.

### 5.3 `CopyReferralLink` component
- **New** `src/components/CopyReferralLink.tsx` (reusable; the agent portal SP5 will reuse it). Props: `{ slug: string; referralCode?: string | null; className?: string }`.
- Builds `link = `${import.meta.env.VITE_CAMPAIGN_URL}campaigns/${slug}?ref=${referralCode}`` (guard: if no `referralCode`, render disabled / hide). Renders a "Copy referral link" button that copies `link` (use `navigator.clipboard.writeText` — already used in `ViewApiKeyModal` — with a toast on success/failure).
- **Placement:** in admin `src/pages/Campaign/CampaignDetail.tsx`, near the campaign header. Resolve the current user's `referral_code` once (via `getCurrentUser()` on mount, or a cached value) and pass it in. The campaign `slug` is already available in `CampaignDetail`.

## 6. Constraints

- **No new npm dependencies** (cookie via `document.cookie`; copy via existing `navigator.clipboard`).
- Both repos deploy from **`production`**: backend **PR to `production`**, frontend **merge+push**. `php` CLI unavailable → BE manual review. New controller code uses existing `PaymentController` patterns (it already uses `sendError`/`Validator`).
- **FE gate:** `npm run build` exit 0 + scoped eslint no new errors (baselines: `publicApi.ts`, `api.ts` 17, the three public campaign pages 0, `CampaignDetail.tsx` 0; new util/component files 0). No test runner.
- **Graceful:** no DB/schema change in SP2 (SP1 already added the columns). If a booking arrives without a code, nothing changes.

## 7. Verification

- **Backend:** manual review — `referral_code` validated; resolver uppercases/trims; non-trashed scope; both fields added to `Booking::create`; null when unresolved; booking still succeeds without a code.
- **Frontend:** build exit 0; eslint no new errors.
- **Manual QA (after deploy):** visit `…/campaigns/<slug>?ref=<a real user code>` → cookie `rx_ref` set; complete a booking → the booking row (admin) shows that user as the referrer; visiting again with a different valid `?ref` overwrites the cookie (last-touch); an invalid `?ref` is ignored (booking still works, no referrer); in admin campaign detail, "Copy referral link" copies `https://campaign.renoxpert.my/campaigns/<slug>?ref=<my code>`.

## 8. Risks & mitigations

- **Wrong/expired code** → resolver returns null → booking proceeds unattributed. Acceptable.
- **Cookie not sent cross-subdomain** → the cookie is read in JS on the campaign domain and submitted in the request body (not relied upon as an HTTP cookie cross-domain), so subdomain cookie scoping is irrelevant. `SameSite=Lax` is fine (same-site navigation).
- **Public campaign base URL drift** → centralised in `VITE_CAMPAIGN_URL`; staging value included.
- **Capture effect double-firing / SSR** → guarded with `typeof document` checks; effect has empty deps (runs once).
- **Last-touch overwrites a prior referrer** → intended per decision.

## 9. Non-goals

No agent identity/auth/onboarding/portal; no campaign visibility flag; no commission logic; no first-touch attribution; no change to SP1's admin manual backfill; the copy-link button is admin-only in SP2 (agent-portal placement is SP5).

## 10. Suggested plan tasks

1. **FE-util+capture:** `src/utils/referral.ts` + capture effect in the 3 public campaign pages + `bookingPaymentIntent` submits `referral_code`.
2. **BE-stamp:** `paymentIntentBooking` validate + resolve + stamp referrer.
3. **FE-copylink:** `VITE_CAMPAIGN_URL`, `getCurrentUser()`, `CopyReferralLink` component, placement in admin `CampaignDetail`.
4. **Verify + finalize:** FE build/eslint, BE manual review; BE PR to `production`; FE merge+push.
