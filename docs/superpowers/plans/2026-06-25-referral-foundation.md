# Referral Foundation Implementation Plan (Agent Campaign SP1/5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every user a unique 8-char referral code (new + backfilled), add referral fields to bookings, and let staff manually set a booking's referrer.

**Architecture:** Backend adds `users.referral_code` (managed migration: add nullable → backfill → unique) generated in the `User` `creating` hook, plus authored additive `bookings` columns (`referred_by_user_id` FK + raw `referral_code`) and a staff endpoint to set a booking's referrer. Frontend admin shows/sets the referrer in the campaign bookings view.

**Tech Stack:** Laravel 11 (Sanctum, `BaseController` helpers); React 18 + TS + Vite + Tailwind.

## Global Constraints

- Backend: `users` is migration-managed (normal migration); `bookings` is an **unmanaged** base table → authored additive `Schema::table` ALTER. **NEVER run `php artisan migrate`** (user runs it). `php` CLI unavailable → manual review. API controllers use `BaseController` `sendResponse`/`sendError` (`BookingController` already extends `BaseController`).
- Both repos deploy from **`production`**: backend via **PR to `production`**, frontend **merge+push**. BE branch `feature/referral-foundation` off `production` (RenoXpert-Backend); FE branch `feature/referral-foundation` off `production` (RenoXpert-Frontend-v2.1).
- No new npm deps. **FE gate:** `npm run build` exit 0 + scoped eslint no NEW errors (baselines: `services/api.ts` 17, `CampaignDetail.tsx` 0). No test runner.
- Referral code = 8 chars from alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no `0/O/1/I`), uniqueness-checked.
- **Commit trailers** on every commit:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS
  ```

---

### Task 1 (BE-users): Per-user referral code

**Repo/branch:** `RenoXpert-Backend`, `feature/referral-foundation` (create off `production`).

**Files:**
- Create: `database/migrations/2026_06_25_000000_add_referral_code_to_users_table.php`
- Modify: `app/Models/User.php` (generator + `creating` hook + `$fillable`)
- Modify: `app/Http/Resources/UserResource.php`

**Interfaces:**
- Produces: `User::generateReferralCode(): string`; `users.referral_code` (unique 8-char) on the user API.

- [ ] **Step 1: Add the generator + creating-hook + fillable to `User`**

In `app/Models/User.php`: add `'referral_code',` to `$fillable` (after `'type',`). Add a static generator method (place it just before `protected static function boot()`):
```php
    public static function generateReferralCode(): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        do {
            $code = '';
            for ($i = 0; $i < 8; $i++) {
                $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }
        } while (self::where('referral_code', $code)->exists());
        return $code;
    }
```
In the existing `static::creating(function ($model) { ... })` hook, add (after the `uuid` block, before `created_by`):
```php
            if (empty($model->referral_code)) {
                $model->referral_code = self::generateReferralCode();
            }
```

- [ ] **Step 2: Create the migration (add nullable → backfill → unique)**

Create `database/migrations/2026_06_25_000000_add_referral_code_to_users_table.php`:
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\User;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('referral_code', 8)->nullable()->after('type');
        });

        // Backfill existing users with a unique code (saveQuietly: skip model events / updated_by).
        User::whereNull('referral_code')->orderBy('id')->each(function ($user) {
            $user->referral_code = User::generateReferralCode();
            $user->saveQuietly();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->unique('referral_code');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['referral_code']);
            $table->dropColumn('referral_code');
        });
    }
};
```

- [ ] **Step 3: Expose in `UserResource`**

In `app/Http/Resources/UserResource.php`, add after the `'type' => $this->type,` line:
```php
            'referral_code' => $this->referral_code,
```

- [ ] **Step 4: Manual review (no `php` CLI)**

Confirm: `$fillable` includes `referral_code`; generator alphabet has no `0/O/1/I` and loops on `exists()`; `creating` hook sets it only when empty; migration adds nullable → backfills via `generateReferralCode()` + `saveQuietly()` → then adds the unique index; `UserResource` exposes it. NEVER run migrate.

- [ ] **Step 5: Commit**

```bash
git add database/migrations/2026_06_25_000000_add_referral_code_to_users_table.php app/Models/User.php app/Http/Resources/UserResource.php
git commit -m "feat(referral): per-user referral_code (generate on create + backfill)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 2 (BE-bookings): Booking referral fields

**Repo/branch:** `RenoXpert-Backend`, `feature/referral-foundation`.

**Files:**
- Create: `database/migrations/2026_06_25_000100_add_referral_to_bookings_table.php`
- Modify: `app/Models/Booking.php` (`$fillable` + `referredBy()`)
- Modify: `app/Http/Resources/BookingResource.php`

**Interfaces:**
- Consumes: `users` (Task 1).
- Produces: `bookings.referred_by_user_id` (FK→users) + `bookings.referral_code`; `Booking::referredBy()`; resource fields `referred_by_user_id`, `referral_code`, nested `referred_by`.

- [ ] **Step 1: Create the authored ALTER migration**

Create `database/migrations/2026_06_25_000100_add_referral_to_bookings_table.php`:
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->unsignedBigInteger('referred_by_user_id')->nullable()->after('user_id');
            $table->string('referral_code')->nullable()->after('referred_by_user_id');
            $table->foreign('referred_by_user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['referred_by_user_id']);
            $table->dropColumn(['referred_by_user_id', 'referral_code']);
        });
    }
};
```

- [ ] **Step 2: `Booking` model — fillable + relation**

In `app/Models/Booking.php`: add `'referred_by_user_id',` and `'referral_code',` to `$fillable` (after `'user_id',`). Add a relation (next to the existing `user()` relation):
```php
    public function referredBy()
    {
        return $this->belongsTo(User::class, 'referred_by_user_id', 'id');
    }
```
(`User` is in the same `App\Models` namespace — no import needed; `user()` already references `User`.)

- [ ] **Step 3: `BookingResource` — expose fields**

In `app/Http/Resources/BookingResource.php`, add after the `'user_id' => $this->user_id,` line:
```php
            'referred_by_user_id' => $this->referred_by_user_id,
            'referral_code' => $this->referral_code,
            'referred_by' => $this->whenLoaded('referredBy', function () {
                return [
                    'id' => $this->referredBy->id,
                    'name' => $this->referredBy->name,
                    'referral_code' => $this->referredBy->referral_code,
                ];
            }),
```

- [ ] **Step 4: Manual review + commit**

Confirm migration additive/nullable with FK `nullOnDelete`; model fillable + relation; resource fields incl. `whenLoaded('referredBy')`. NEVER run migrate.
```bash
git add database/migrations/2026_06_25_000100_add_referral_to_bookings_table.php app/Models/Booking.php app/Http/Resources/BookingResource.php
git commit -m "feat(referral): booking referred_by_user_id + referral_code fields

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 3 (BE-endpoint): Set-booking-referrer endpoint

**Repo/branch:** `RenoXpert-Backend`, `feature/referral-foundation`.

**Files:**
- Modify: `app/Http/Controllers/BookingController.php` (add `setReferral` + `use App\Models\User;`)
- Modify: `routes/api.php` (one route in the auth group)

**Interfaces:**
- Consumes: Tasks 1 & 2.
- Produces: `PUT campaigns/{campaignId}/bookings/{bookingId}/referral` → `BookingController@setReferral`.

- [ ] **Step 1: Add `setReferral` to `BookingController`**

Ensure `use App\Models\User;` is among the imports at the top of `app/Http/Controllers/BookingController.php` (add it if missing). Add this method (e.g. after `getBookingByCampaign`):
```php
    public function setReferral(Request $request, $campaignId, $bookingId)
    {
        $booking = Booking::where('campaign_id', $campaignId)->where('id', $bookingId)->first();
        if (is_null($booking)) {
            return $this->sendError('Booking not found.');
        }

        $validator = Validator::make($request->all(), [
            'referral_code' => 'nullable|string',
            'referred_by_user_id' => 'nullable|integer|exists:users,id',
        ]);
        if ($validator->fails()) {
            return $this->sendError('Validation Error.', $validator->errors(), 422);
        }

        $user = null;
        if ($request->filled('referred_by_user_id')) {
            $user = User::find($request->input('referred_by_user_id'));
        } elseif ($request->filled('referral_code')) {
            $user = User::where('referral_code', strtoupper(trim($request->input('referral_code'))))->first();
        }

        if (is_null($user)) {
            return $this->sendError('Referrer not found.', [], 422);
        }

        if ((int) $user->id === (int) $booking->user_id) {
            return $this->sendError('A booking cannot be referred by its own owner.', [], 422);
        }

        $booking->referred_by_user_id = $user->id;
        $booking->referral_code = $user->referral_code;
        $booking->save();

        $booking->load('referredBy');
        return $this->sendResponse(new BookingResource($booking), 'Booking referrer updated.');
    }
```

- [ ] **Step 2: Register the route**

In `routes/api.php`, in the same authenticated group as `campaigns/{campaignId}/bookings` (line ~319), add directly after it:
```php
    Route::put('campaigns/{campaignId}/bookings/{bookingId}/referral', [BookingController::class, 'setReferral']);
```

- [ ] **Step 3: Manual review + commit**

Confirm: `User` imported; resolves by id or by uppercased/trimmed code; 422 when unresolved; self-referral guard; loads `referredBy` before returning; route in the auth group.
```bash
git add app/Http/Controllers/BookingController.php routes/api.php
git commit -m "feat(referral): staff endpoint to set a booking's referrer

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 4 (FE-admin): Booking referrer UI + user code

**Repo/branch:** `RenoXpert-Frontend-v2.1`, `feature/referral-foundation` (create off `production`).

**Files:**
- Modify: `src/services/api.ts` (add `setBookingReferral`)
- Modify: `src/types/index.ts` (Booking type fields)
- Modify: `src/pages/Campaign/CampaignDetail.tsx` (Referred-by display + set control in the bookings list)
- Modify: the admin Users list/detail page (surface `referral_code`) — locate via grep (below)

**Interfaces:**
- Consumes: Task 3 endpoint; Tasks 1-2 resource fields.
- Produces: `setBookingReferral(campaignId, bookingId, payload)`.

- [ ] **Step 1: Add the API function**

In `src/services/api.ts`, directly after `getCampaignBookings`, add:
```ts
export const setBookingReferral = async (
    campaignId: string | number,
    bookingId: string | number,
    payload: { referral_code?: string; referred_by_user_id?: number }
) => {
    try {
        const response = await axios.put(
            API_URL + `campaigns/${campaignId}/bookings/${bookingId}/referral`,
            payload,
            { headers: getAuthHeaders() }
        );
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};
```

- [ ] **Step 2: Extend the `Booking` type**

In `src/types/index.ts`, find the `Booking` interface and add (optional, for graceful degradation before migration):
```ts
    referred_by_user_id?: number | null;
    referral_code?: string | null;
    referred_by?: { id: number; name: string; referral_code: string } | null;
```

- [ ] **Step 3: Add User `referral_code` to its type (if a User type exists)**

In `src/types/index.ts`, if there is a `User` interface, add `referral_code?: string | null;` to it. (If none exists, skip — the admin user page can read it untyped via the API response; do NOT introduce `any`.)

- [ ] **Step 4: Referred-by display + set control in the bookings list**

In `src/pages/Campaign/CampaignDetail.tsx`, the `BookingsListView` component (~line 38) renders each booking row (`bookings.map((booking, idx) => ...)` ~line 90). Thread two new props into `BookingsListView`: `campaignId: string | number` and `onChanged: () => void` (pass the campaign id and the bookings refetch from the parent — the parent uses `useFetchCampaignBookings`; pass its refetch, or re-call the fetch). Inside each booking row, add a "Referred by" cell:
- If `booking.referred_by`: show `{booking.referred_by.name} ({booking.referred_by.referral_code})`.
- Else: render a tiny inline form — a text `<input>` for a referral code + a "Set" button. On submit, call `setBookingReferral(campaignId, booking.id, { referral_code: code })`; on success call `onChanged()` (refetch) and toast success; on error show the API message.

Concrete control (place where the row shows booking meta; use local state keyed by booking id, or a small child component `<ReferrerCell booking={booking} campaignId={campaignId} onChanged={onChanged} />` defined in the same file):
```tsx
const ReferrerCell = ({ booking, campaignId, onChanged }: { booking: Booking; campaignId: string | number; onChanged: () => void }) => {
    const [code, setCode] = useState('');
    const [saving, setSaving] = useState(false);
    if (booking.referred_by) {
        return <span className="text-xs text-gray-600">Referred by <span className="font-semibold">{booking.referred_by.name}</span> ({booking.referred_by.referral_code})</span>;
    }
    const save = async () => {
        if (!code.trim()) return;
        setSaving(true);
        try {
            await setBookingReferral(campaignId, booking.id!, { referral_code: code.trim() });
            onChanged();
        } catch {
            /* api layer handles 401; surface a toast if available */
        } finally {
            setSaving(false);
        }
    };
    return (
        <div className="flex items-center gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Referral code" className="border border-gray-300 rounded px-2 py-1 text-xs w-32" />
            <button type="button" disabled={saving} onClick={save} className="text-xs font-semibold text-green-700 disabled:opacity-50">Set</button>
        </div>
    );
};
```
Import `setBookingReferral` from `../../services/api` and ensure `useState` is imported. Render `<ReferrerCell booking={booking} campaignId={campaignId} onChanged={onChanged} />` inside the booking row. (`setBookingReferral` returns `{success:false,...}` on a handled API error rather than throwing for 422 — if the response indicates failure, surface its `message`; the api layer's `handle401Error` covers auth.)

- [ ] **Step 5: Surface the user's referral code in admin**

Locate the admin Users list/detail page: `grep -rn "UserResource\|users\b\|getUsers\|User\[\]" src/pages/User` (likely `src/pages/User/*.tsx`). In the users table/detail, add a read-only **Referral Code** column/field showing `user.referral_code` (reuse the existing ClipboardJS copy pattern if a copy affordance is wanted). Keep it minimal; no `any`.

- [ ] **Step 6: Build + lint**

Run: `npm run build` → exit 0.
Run: `npx eslint src/services/api.ts src/pages/Campaign/CampaignDetail.tsx src/types/index.ts --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'` → `api.ts` 17 (baseline), `CampaignDetail.tsx` 0, `types/index.ts` 0 → combined `17`. Also lint the touched Users page → no new errors. Fix any NEW errors.

- [ ] **Step 7: Commit**

```bash
git add src/services/api.ts src/types/index.ts src/pages/Campaign/CampaignDetail.tsx src/pages/User
git commit -m "feat(referral): admin set booking referrer + show user referral code

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 5: Verify + finalize

**Files:** none (verification + integration).

- [ ] **Step 1: FE build + scoped lint**

```bash
cd RenoXpert-Frontend-v2.1
npm run build   # exit 0
for f in src/services/api.ts src/pages/Campaign/CampaignDetail.tsx src/types/index.ts; do
  echo "$f: $(npx eslint "$f" --ext ts,tsx --format unix 2>/dev/null | grep -c ':[0-9]*:[0-9]*:')"
done
```
Expected: api.ts 17; CampaignDetail.tsx 0; types/index.ts 0.

- [ ] **Step 2: BE manual review**

Re-read the BE diff: users migration order (nullable → backfill → unique); generator; `creating` hook; bookings ALTER additive+nullable+FK; model/relation/resource; endpoint (resolve by id/code, 422 unresolved, self-referral guard, loads referredBy); route in auth group. Confirm no `php artisan migrate` was run.

- [ ] **Step 3: Finalize backend (PR to production)**

```bash
cd RenoXpert-Backend
git push -u origin feature/referral-foundation
gh pr create --base production --head feature/referral-foundation \
  --title "feat(referral): foundation — per-user codes + booking referrer (SP1)" \
  --body "<summary + 'run php artisan migrate after merge (2 migrations: users.referral_code add/backfill/unique; bookings referral fields)' + 🤖 Generated with [Claude Code](https://claude.com/claude-code)>"
```

- [ ] **Step 4: Finalize frontend (merge+push)**

```bash
cd RenoXpert-Frontend-v2.1
git checkout production && git pull --ff-only
git merge --ff-only feature/referral-foundation
npm run build   # exit 0 gate
git branch -d feature/referral-foundation
git push origin production
```

- [ ] **Step 5: Hand off manual QA**

Report to the user (after they merge the BE PR + run migrate): every existing user has a code; new users get one; a booking with no referrer can be assigned one by code (and by user id); self-referral rejected; referrer shows on the booking; user referral code visible in admin.

---

## Self-Review

**Spec coverage:**
- §3.1 per-user code (migration add/backfill/unique + generator + hook + fillable + UserResource) → Task 1. ✅
- §3.2 booking referral fields (migration + model + relation + resource) → Task 2. ✅
- §3.3 admin set-referrer endpoint (resolve code/id, self-referral guard, route) → Task 3. ✅
- §4 FE admin (setBookingReferral API + Booking type + Referred-by display/set in CampaignDetail + user referral code) → Task 4. ✅
- §5/§6 constraints + verify (migrations authored/user-runs; BE PR + FE merge+push; gates) → Global Constraints + Task 5. ✅

**Placeholder scan:** No TBD/TODO. The BE PR body `<...>` is a compose-at-finalize instruction. Task 4 Step 5 uses a grep to locate the Users page (the file isn't pre-identified) — bounded and actionable, with an explicit "no `any`" guard; not an unfilled blank.

**Type consistency:** `User::generateReferralCode(): string`; `referral_code` string(8); `bookings.referred_by_user_id` FK + `referral_code`; `Booking::referredBy()`; resource nested `referred_by` = `{id,name,referral_code}` matches the FE `Booking.referred_by` type and the `ReferrerCell` usage; `setBookingReferral(campaignId, bookingId, { referral_code?, referred_by_user_id? })` matches the endpoint body and route `PUT campaigns/{campaignId}/bookings/{bookingId}/referral`. ✅
