# Referral Link + Cookie Capture Implementation Plan (Agent Campaign SP2/5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture a referrer when a customer arrives via `?ref=<code>` and books — store the code in a cookie, submit it from the public booking flow, and stamp `referred_by_user_id`/`referral_code` on the booking — plus extend the admin "Copy Campaign URL" to a referral link.

**Architecture:** Frontend adds a tiny `document.cookie` referral util, captures `?ref` on the public campaign pages, and submits the code via the existing `bookingPaymentIntent`. Backend `paymentIntentBooking` resolves the code (SP1 users) and stamps the booking (SP1 columns). Admin `CampaignDetail` extends its existing copy handler to append the current user's `?ref`.

**Tech Stack:** Laravel 11; React 18 + TS + Vite. No new dependencies; no schema change (SP1 added the columns).

## Global Constraints

- No new npm deps (cookie via `document.cookie`; copy via the existing `navigator.clipboard`/textarea fallback). No DB/schema change.
- Both repos deploy from **`production`**: backend **PR to `production`**, frontend **merge+push**. BE branch `feature/referral-link-cookie` off `origin/production` (RenoXpert-Backend); FE branch `feature/referral-link-cookie` off `production` (RenoXpert-Frontend-v2.1).
- `php` CLI unavailable → BE manual review. **FE gate:** `npm run build` exit 0 + scoped eslint no NEW errors (baselines: `api.ts` 17; `publicApi.ts`, `CampaignDetailPage.tsx`, `CampaignLayoutDetailPage.tsx`, `CampaignPackageDetailPage.tsx`, `CampaignDetail.tsx` all 0; new `utils/referral.ts` 0). No test runner.
- Attribution = **last-touch** (each valid `?ref` overwrites the cookie). Code normalized to uppercase/trimmed on both ends.
- **Commit trailers** on every commit:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS
  ```

---

### Task 1 (FE-util+capture): Referral util + capture + booking submits code

**Repo/branch:** `RenoXpert-Frontend-v2.1`, `feature/referral-link-cookie` (create off `production`).

**Files:**
- Create: `src/utils/referral.ts`
- Modify: `src/pages/CampaignPages/CampaignDetailPage.tsx`, `CampaignLayoutDetailPage.tsx`, `CampaignPackageDetailPage.tsx` (capture effect)
- Modify: `src/services/publicApi.ts` (`bookingPaymentIntent` submits the code)

**Interfaces:**
- Produces: `getReferralCode()`, `setReferralCookie()`, `captureReferralFromUrl()`, `buildReferralLink()`.

- [ ] **Step 1: Create the referral util**

Create `src/utils/referral.ts`:
```ts
const REF_COOKIE = 'rx_ref';
const REF_TTL_DAYS = 30;

/** Last-touch: always overwrite the cookie with the latest valid code. */
export function setReferralCookie(code: string): void {
    if (typeof document === 'undefined' || !code) return;
    const maxAge = REF_TTL_DAYS * 24 * 60 * 60;
    document.cookie = `${REF_COOKIE}=${encodeURIComponent(code)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function getReferralCode(): string | null {
    if (typeof document === 'undefined') return null;
    const m = document.cookie.match(new RegExp('(?:^|; )' + REF_COOKIE + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
}

/** Read ?ref from a location.search string and store it (trimmed, uppercased). */
export function captureReferralFromUrl(search: string): void {
    if (typeof document === 'undefined' || !search) return;
    const ref = new URLSearchParams(search).get('ref');
    if (ref && ref.trim()) {
        setReferralCookie(ref.trim().toUpperCase());
    }
}

/** Build a public campaign referral link. `base` is VITE_CAMPAIGN_URL (ends with '/'). */
export function buildReferralLink(base: string, slug: string, code: string): string {
    return `${base}campaigns/${slug}?ref=${encodeURIComponent(code)}`;
}
```

- [ ] **Step 2: Capture `?ref` on the public campaign pages**

In each of `src/pages/CampaignPages/CampaignDetailPage.tsx`, `CampaignLayoutDetailPage.tsx`, `CampaignPackageDetailPage.tsx`:
- Add import: `import { captureReferralFromUrl } from '../../utils/referral';` (alongside the other `../../utils/...` imports).
- Ensure `useEffect` is imported from React (CampaignDetailPage already imports it; add to the others if missing).
- Add a mount effect near the top of the component body:
```tsx
    useEffect(() => {
        captureReferralFromUrl(window.location.search);
    }, []);
```
No other changes to these pages.

- [ ] **Step 3: `bookingPaymentIntent` submits the code**

In `src/services/publicApi.ts`, add `import { getReferralCode } from '../utils/referral';` at the top. Change `bookingPaymentIntent` (line ~95) to include the code in the POST body:
```ts
export const bookingPaymentIntent = async (campaignSlug: string, name: string, phone: string, email: string, packageId?: string) => {
    try {
        const referral_code = getReferralCode() || undefined;
        const response = await axios.post(API_URL + `public/campaigns/${campaignSlug}/booking/payment/intent`, { name, phone, email, packageId, referral_code });
        return response.data;
    } catch (error) {
        console.error('Error creating booking payment intent:', error);
        throw error;
    }
}
```
(axios omits `undefined` fields from the JSON body, so no `referral_code` is sent when the cookie is absent. Both booking forms call this function — no component change needed.)

- [ ] **Step 4: Build + lint**

Run: `npm run build` → exit 0.
Run: `npx eslint src/utils/referral.ts src/services/publicApi.ts src/pages/CampaignPages/CampaignDetailPage.tsx src/pages/CampaignPages/CampaignLayoutDetailPage.tsx src/pages/CampaignPages/CampaignPackageDetailPage.tsx --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'` → `0`. Fix any new error.

- [ ] **Step 5: Commit**

```bash
git add src/utils/referral.ts src/services/publicApi.ts src/pages/CampaignPages/CampaignDetailPage.tsx src/pages/CampaignPages/CampaignLayoutDetailPage.tsx src/pages/CampaignPages/CampaignPackageDetailPage.tsx
git commit -m "feat(referral): capture ?ref into a cookie + submit it on booking

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 2 (BE-stamp): Stamp the referrer on public booking

**Repo/branch:** `RenoXpert-Backend`, `feature/referral-link-cookie` (create off `origin/production`).

**Files:**
- Modify: `app/Http/Controllers/PaymentController.php` (`paymentIntentBooking`)

**Interfaces:**
- Consumes: SP1 `users.referral_code`, `bookings.referred_by_user_id`/`referral_code`.

- [ ] **Step 1: Validate + resolve + stamp**

In `app/Http/Controllers/PaymentController.php`, `paymentIntentBooking` (line ~160):
- Add to the validator array (after `'packageId' => 'nullable|numeric',`):
```php
            'referral_code' => 'nullable|string|max:32',
```
- Immediately BEFORE the `$booking = Booking::create([` line (~219), add:
```php
        $referrer = null;
        if (!empty($input['referral_code'])) {
            $referrer = \App\Models\User::where('referral_code', strtoupper(trim($input['referral_code'])))->first();
        }
```
- Inside the `Booking::create([...])` array, add these two keys (e.g. after `'amount' => $amount,`):
```php
            'referred_by_user_id' => $referrer?->id,
            'referral_code' => $referrer?->referral_code,
```
An unknown/expired code → `$referrer` is null → both fields are null and the booking proceeds normally. Use the normal (non-trashed) `User` scope so a soft-deleted user is never credited. (`Booking`'s `$fillable` already includes both fields from SP1.)

- [ ] **Step 2: Manual review (no `php` CLI)**

Confirm: validator accepts `referral_code` nullable; resolver uppercases/trims and uses the non-trashed scope; both fields added to `Booking::create`; null when unresolved; no other behavior changed; the public flow still works without a code. NEVER run php/artisan.

- [ ] **Step 3: Commit**

```bash
git add app/Http/Controllers/PaymentController.php
git commit -m "feat(referral): stamp booking referrer from submitted referral_code

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 3 (FE-copylink): Admin referral link

**Repo/branch:** `RenoXpert-Frontend-v2.1`, `feature/referral-link-cookie`.

**Files:**
- Modify: `src/services/api.ts` (`getCurrentUser`)
- Modify: `src/pages/Campaign/CampaignDetail.tsx` (fetch current user; extend copy handler; button label)
- Modify: `.env` (fix the staging campaign URL typo)

**Interfaces:**
- Consumes: `buildReferralLink` (Task 1); `GET /user` (returns `UserResource` incl. `referral_code`).

- [ ] **Step 1: Fix the pre-existing staging env typo**

In `.env`, line `VITE_STAGING_CAMPAIGN_URL=https://s-campaign.renoxpert.my/z` → remove the trailing `z` so it reads `VITE_STAGING_CAMPAIGN_URL=https://s-campaign.renoxpert.my/`.

- [ ] **Step 2: Add `getCurrentUser` to api.ts**

In `src/services/api.ts`, add (next to other GET helpers):
```ts
export const getCurrentUser = async () => {
    try {
        const response = await axios.get(API_URL + 'user', { headers: getAuthHeaders() });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};
```

- [ ] **Step 3: Fetch the current user's code in `CampaignDetail`**

In `src/pages/Campaign/CampaignDetail.tsx`:
- Ensure `useEffect` is imported (line 1 currently imports only `useState` — change to `import React, { useState, useEffect } from 'react';`).
- Add imports: `import { getCurrentUser } from '../../services/api';` and `import { buildReferralLink } from '../../utils/referral';`.
- In the main component (where `id`/`campaign` are), add state + fetch:
```tsx
    const [myReferralCode, setMyReferralCode] = useState<string | null>(null);
    useEffect(() => {
        let active = true;
        getCurrentUser().then((res) => {
            if (!active) return;
            const u = (res && res.data) ? res.data : res; // payload may or may not be {data:...}-wrapped
            setMyReferralCode(u?.referral_code ?? null);
        }).catch(() => { /* non-fatal: fall back to plain campaign URL */ });
        return () => { active = false; };
    }, []);
```

- [ ] **Step 4: Make the copy button copy the referral link**

In `handleCopyCampaignUrl` (line ~448), build the link with `?ref` when the code is known:
```tsx
        const campaignUrl = myReferralCode
            ? buildReferralLink(CAMPAIGN_URL, campaign.slug, myReferralCode)
            : `${CAMPAIGN_URL}campaigns/${campaign.slug}`;
```
Keep the existing `navigator.clipboard` + textarea-fallback copy. Change the two success toasts from `'Campaign URL copied to clipboard!'` to `myReferralCode ? 'Referral link copied to clipboard!' : 'Campaign URL copied to clipboard!'`. Change the button label (line ~684) from `Copy Campaign URL` to `Copy Referral Link`.

- [ ] **Step 5: Build + lint**

Run: `npm run build` → exit 0.
Run: `npx eslint src/services/api.ts src/pages/Campaign/CampaignDetail.tsx --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'` → `api.ts` 17, `CampaignDetail.tsx` 0 → combined `17`. Fix any new error.

- [ ] **Step 6: Commit**

```bash
git add src/services/api.ts src/pages/Campaign/CampaignDetail.tsx .env
git commit -m "feat(referral): admin Copy Referral Link (current user's ?ref) + staging env fix

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 4: Verify + finalize

- [ ] **Step 1: FE build + scoped lint**

```bash
cd RenoXpert-Frontend-v2.1
npm run build   # exit 0
for f in src/utils/referral.ts src/services/publicApi.ts src/services/api.ts src/pages/CampaignPages/CampaignDetailPage.tsx src/pages/CampaignPages/CampaignLayoutDetailPage.tsx src/pages/CampaignPages/CampaignPackageDetailPage.tsx src/pages/Campaign/CampaignDetail.tsx; do
  echo "$f: $(npx eslint "$f" --ext ts,tsx --format unix 2>/dev/null | grep -c ':[0-9]*:[0-9]*:')"
done
```
Expected: referral.ts 0; publicApi.ts 0; api.ts 17; the 3 public pages 0; CampaignDetail.tsx 0.

- [ ] **Step 2: BE manual review**

Re-read the BE diff: `referral_code` validated (nullable|string|max:32); resolver uppercases/trims + non-trashed scope; both fields stamped on `Booking::create`; null when unresolved; booking still works without a code. No `php artisan` run.

- [ ] **Step 3: Finalize backend (PR to production)**

```bash
cd RenoXpert-Backend
git push -u origin feature/referral-link-cookie
gh pr create --base production --head feature/referral-link-cookie \
  --title "feat(referral): stamp public booking referrer from referral_code (SP2)" \
  --body "<summary; no migration needed (SP1 added the columns); 🤖 Generated with [Claude Code](https://claude.com/claude-code)>"
```

- [ ] **Step 4: Finalize frontend (merge+push)**

```bash
cd RenoXpert-Frontend-v2.1
git checkout production && git pull --ff-only
git merge --ff-only feature/referral-link-cookie
npm run build   # exit 0 gate
git branch -d feature/referral-link-cookie
git push origin production
```

- [ ] **Step 5: Hand off manual QA**

Report to the user: visiting `…/campaigns/<slug>?ref=<a real user code>` sets the `rx_ref` cookie; booking → that user is the referrer on the booking (admin); a different valid `?ref` overwrites (last-touch); an invalid code is ignored (booking still works); admin "Copy Referral Link" copies `https://campaign.renoxpert.my/campaigns/<slug>?ref=<my code>`.

---

## Self-Review

**Spec coverage:**
- §3.1 referral util + §3.2 capture on 3 pages + §3.3 bookingPaymentIntent submits → Task 1. ✅
- §4 BE stamp (validate/resolve/stamp, null-safe, non-trashed) → Task 2. ✅
- §5 admin copy link (current user via GET /user, build `?ref` link, env) → Task 3 (extends the EXISTING `handleCopyCampaignUrl`/`CAMPAIGN_URL`; `VITE_CAMPAIGN_URL` already exists, so the spec's "add env" becomes "fix the staging typo"). ✅
- §6/§7 constraints + verify → Global Constraints + Task 4. ✅

**Placeholder scan:** No TBD/TODO. The BE PR body `<...>` is a compose-at-finalize instruction. The "ensure useEffect imported" steps are conditional checks with the exact import to add — actionable, not blanks.

**Type consistency:** `getReferralCode(): string | null`; `buildReferralLink(base, slug, code): string`; `bookingPaymentIntent` body adds `referral_code?: string`; BE validator `referral_code` nullable matches; `getCurrentUser()` returns the user payload, read defensively as `res.data ?? res` then `.referral_code`. Cookie name `rx_ref` consistent. ✅
