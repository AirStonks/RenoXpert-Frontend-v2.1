# Agent Enhancements + Referral Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (E1) store agent `country_code` without a leading `+`; (E2) gate agents behind staff approval (`agent_approved_at`) with a staff Agents admin page; (E3) an agent referral dashboard.

**Architecture:** Backend adds `users.agent_approved_at`, gates the agent endpoints on it, and adds staff-guarded admin agent list/approve + an agent referrals endpoint. Frontend adds a pending-approval screen + gating, a staff Agents page (+ sidebar), and an agent Dashboard page.

**Tech Stack:** Laravel 11 (Sanctum, `BaseController`); React 18 + TS + Vite + Tailwind. One additive migration; no new deps.

## Global Constraints

- **Security (auth is generic `auth:sanctum`, no per-type middleware):** admin agent endpoints MUST reject non-staff. "Staff" = `in_array($request->user()->type, ['staff','admin','super-admin','owner'])`. Agent self-service endpoints guard `type==='agent'` AND `agent_approved_at != null`.
- Backend: `users` migration-managed (normal migration). **NEVER run `php artisan migrate`** (user runs it). `php` CLI unavailable → manual review. Controllers use `BaseController`.
- Both repos deploy from **`production`**: backend **PR to `production`**, frontend **merge+push**. BE branch `feature/agent-enhancements` off `origin/production`; FE branch `feature/agent-enhancements` off `production`.
- No new npm deps. **FE gate:** `npm run build` exit 0 + scoped eslint no NEW errors; new files clean (0); no `any`. No test runner.
- **Commit trailers** on every commit:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS
  ```

---

### Task 1 (BE): approval gate, country_code, admin + referrals endpoints

**Repo/branch:** `RenoXpert-Backend`, `feature/agent-enhancements` (off `origin/production`).

**Files:**
- Create: `database/migrations/2026_06_26_000100_add_agent_approved_at_to_users_table.php`
- Modify: `app/Models/User.php` (`$fillable` + `casts()`); `app/Http/Resources/UserResource.php`
- Modify: `app/Http/Controllers/AgentAuthController.php` (onboarding `ltrim`, new `referrals`)
- Modify: `app/Http/Controllers/CampaignController.php` (`agentCampaigns` approval gate)
- Modify: `app/Http/Controllers/UserController.php` (`adminAgents`, `approveAgent`)
- Modify: `routes/api.php`

- [ ] **Step 1: Migration**

Create `database/migrations/2026_06_26_000100_add_agent_approved_at_to_users_table.php`:
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('agent_approved_at')->nullable()->after('onboarded_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('agent_approved_at');
        });
    }
};
```

- [ ] **Step 2: Model + resource**

In `app/Models/User.php`: add `'agent_approved_at',` to `$fillable` (after `'onboarded_at',`); in the `casts()` method add `'agent_approved_at' => 'datetime',` (next to `'onboarded_at' => 'datetime'`). In `app/Http/Resources/UserResource.php`, add after the `'onboarded_at' => $this->onboarded_at,` line:
```php
            'agent_approved_at' => $this->agent_approved_at,
```

- [ ] **Step 3: country_code normalize (onboarding)**

In `app/Http/Controllers/AgentAuthController.php` `onboarding`, change the country_code line to strip a leading `+`:
```php
        $user->country_code = ltrim(trim((string) $request->input('country_code')), '+');
```

- [ ] **Step 4: Agent referrals endpoint**

In `app/Http/Controllers/AgentAuthController.php`: add `use App\Models\Booking;` to the imports. Add this method:
```php
    public function referrals(Request $request)
    {
        $user = $request->user();
        if (!$user || $user->type !== 'agent') {
            return $this->sendError('Forbidden.', [], 403);
        }
        if (is_null($user->agent_approved_at)) {
            return $this->sendError('Your agent account is pending approval.', [], 403);
        }

        $bookings = Booking::where('referred_by_user_id', $user->id)
            ->with('campaign')
            ->orderByDesc('id')
            ->get();

        $rows = $bookings->map(function ($b) {
            $meta = is_array($b->metadata) ? $b->metadata : [];
            return [
                'campaign_title' => optional($b->campaign)->title,
                'customer_name' => $meta['name'] ?? null,
                'amount' => $b->amount,
                'status' => $b->status,
                'date' => $b->booked_at ?? $b->created_at,
            ];
        });

        return $this->sendResponse([
            'summary' => [
                'total' => $bookings->count(),
                'paid' => $bookings->where('status', 'paid')->count(),
                'total_amount' => $bookings->sum('amount'),
            ],
            'bookings' => $rows,
        ], 'Referrals retrieved.');
    }
```

- [ ] **Step 5: Agent campaigns approval gate**

In `app/Http/Controllers/CampaignController.php` `agentCampaigns`, after the existing `type==='agent'` guard, add:
```php
        if (is_null($request->user()->agent_approved_at)) {
            return $this->sendError('Your agent account is pending approval.', [], 403);
        }
```

- [ ] **Step 6: Admin agent endpoints (staff-guarded)**

In `app/Http/Controllers/UserController.php` (extends `BaseController`), add:
```php
    public function adminAgents(Request $request)
    {
        $caller = $request->user();
        if (!$caller || !in_array($caller->type, ['staff', 'admin', 'super-admin', 'owner'])) {
            return $this->sendError('Forbidden.', [], 403);
        }
        $agents = User::where('type', 'agent')
            ->orderByRaw('agent_approved_at IS NOT NULL')
            ->orderByDesc('id')
            ->get();
        return $this->sendResponse(UserResource::collection($agents), 'Agents retrieved.');
    }

    public function approveAgent(Request $request, $id)
    {
        $caller = $request->user();
        if (!$caller || !in_array($caller->type, ['staff', 'admin', 'super-admin', 'owner'])) {
            return $this->sendError('Forbidden.', [], 403);
        }
        $agent = User::where('id', $id)->where('type', 'agent')->first();
        if (!$agent) {
            return $this->sendError('Agent not found.', [], 404);
        }
        if (is_null($agent->agent_approved_at)) {
            $agent->agent_approved_at = now();
            $agent->save();
        }
        return $this->sendResponse(new UserResource($agent), 'Agent approved.');
    }
```

- [ ] **Step 7: Routes**

In `routes/api.php`, inside the `auth:sanctum` group (near the other `agent/...` routes), add:
```php
    Route::get('agent/referrals', [\App\Http\Controllers\AgentAuthController::class, 'referrals']);
    Route::get('admin/agents', [UserController::class, 'adminAgents']);
    Route::post('admin/agents/{id}/approve', [UserController::class, 'approveAgent']);
```
(`UserController` is already imported in `routes/api.php`; if not, add `use App\Http\Controllers\UserController;`.)

- [ ] **Step 8: Manual review + commit**

Confirm: migration additive nullable; fillable+cast+resource for `agent_approved_at`; onboarding `ltrim('+')`; `referrals` guards agent+approved and returns summary+rows; `agentCampaigns` approval gate; admin methods **staff-guarded (agent type → 403)** + approve only `type='agent'`; routes added. NEVER run migrate.
```bash
git add -A
git commit -m "feat(agent): approval gate (agent_approved_at) + admin approve + referrals + country_code normalize

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 2 (FE): agent area — pending gate, dashboard, nav, country_code

**Repo/branch:** `RenoXpert-Frontend-v2.1`, `feature/agent-enhancements` (off `production`).

**Files:**
- Modify: `src/services/agentApi.ts` (`agent_approved_at` type + `getAgentReferrals`)
- Modify: `src/pages/AgentPages/AgentOnboarding.tsx` (default `'60'`)
- Rewrite: `src/pages/AgentPages/AgentHome.tsx` (pending gate + Campaigns/Dashboard nav)
- Create: `src/pages/AgentPages/AgentDashboard.tsx`
- Modify: `src/App.tsx` (agent `/dashboard` route in routeCat[7] + routeCatLocal[7])

- [ ] **Step 1: agentApi — approval field + referrals**

In `src/services/agentApi.ts`: add `agent_approved_at?: string | null;` to the `AgentUser` interface. Add:
```ts
export interface AgentReferralRow {
    campaign_title: string | null;
    customer_name: string | null;
    amount: number | null;
    status: string | null;
    date: string | null;
}
export interface AgentReferrals {
    summary: { total: number; paid: number; total_amount: number };
    bookings: AgentReferralRow[];
}

export const getAgentReferrals = async (): Promise<AgentReferrals> => {
    const response = await axios.get(API_URL + 'agent/referrals', { headers: getAgentAuthHeaders() });
    const d = response.data?.data ?? response.data;
    return { summary: d?.summary ?? { total: 0, paid: 0, total_amount: 0 }, bookings: d?.bookings ?? [] };
};
```

- [ ] **Step 2: AgentOnboarding default**

In `src/pages/AgentPages/AgentOnboarding.tsx`, change `useState('+60')` to `useState('60')` for `countryCode`.

- [ ] **Step 3: Rebuild AgentHome with pending gate + nav**

Replace `src/pages/AgentPages/AgentHome.tsx` with (keeps the SP5 portal + adds the pending-approval branch + a Campaigns/Dashboard nav):
```tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Slide, toast, ToastContainer } from 'react-toastify';
import { agentLogout, getAgentUser, getAgentCampaigns, AgentUser, AgentCampaign } from '../../services/agentApi';
import { buildReferralLink, getCampaignBaseUrl } from '../../utils/referral';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/agent/' : '/';

const AgentHome: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<AgentUser | null>(null);
    const [campaigns, setCampaigns] = useState<AgentCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [pending, setPending] = useState(false);

    useEffect(() => {
        let active = true;
        (async () => {
            let u: AgentUser;
            try {
                u = await getAgentUser();
            } catch {
                if (active) navigate(LOCAL_PATH_PREFIX + 'login', { replace: true });
                return;
            }
            if (!active) return;
            if (!u?.onboarded_at) { navigate(LOCAL_PATH_PREFIX + 'onboarding', { replace: true }); return; }
            setUser(u);
            if (!u.agent_approved_at) { setPending(true); setLoading(false); return; }
            try {
                const list = await getAgentCampaigns();
                if (active) setCampaigns(Array.isArray(list) ? list : []);
            } catch {
                if (active) setLoadError(true);
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, [navigate]);

    const signOut = () => { agentLogout(); navigate(LOCAL_PATH_PREFIX + 'login', { replace: true }); };

    const code = user?.referral_code || '';
    const base = getCampaignBaseUrl();
    const linkFor = (slug: string) => (code ? buildReferralLink(base, slug, code) : '');

    const copy = async (text: string, label: string) => {
        if (!text) { toast.error('No referral code available.'); return; }
        try { await navigator.clipboard.writeText(text); toast.success(label + ' copied.'); }
        catch { toast.error('Copy failed.'); }
    };

    const Header = () => (
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 py-4">
            <div className="flex items-center gap-4">
                <span className="font-bold text-slate-900">Agent Portal</span>
                {!pending && (
                    <nav className="flex items-center gap-3 text-sm">
                        <span className="font-semibold text-campaign">Campaigns</span>
                        <button type="button" onClick={() => navigate(LOCAL_PATH_PREFIX + 'dashboard')} className="text-slate-500 hover:text-slate-700">Dashboard</button>
                    </nav>
                )}
            </div>
            <div className="flex items-center gap-3">
                {user?.name && <span className="hidden sm:inline text-sm text-slate-500">{user.name}</span>}
                <button type="button" onClick={signOut} className="text-sm font-semibold text-slate-500 hover:text-slate-700">Sign out</button>
            </div>
        </header>
    );

    if (pending) {
        return (
            <div className="fixed inset-0 overflow-y-auto bg-slate-50">
                <Header />
                <main className="mx-auto w-full max-w-md px-4 py-16 text-center">
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                        <h1 className="text-xl font-bold text-slate-900">Account pending approval</h1>
                        <p className="mt-2 text-sm text-slate-500">Thanks for signing up{user?.name ? `, ${user.name}` : ''}. A RenoXpert admin will approve your agent account shortly — you'll get access to campaigns once approved.</p>
                    </div>
                </main>
                <ToastContainer position="top-right" transition={Slide} />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 overflow-y-auto bg-slate-50">
            <Header />
            <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
                {code && (
                    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                        <span className="text-sm text-slate-500">Your referral code</span>
                        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-sm font-semibold text-slate-800">{code}</span>
                        <button type="button" onClick={() => copy(code, 'Referral code')} className="text-sm font-semibold text-campaign hover:underline">Copy</button>
                    </div>
                )}

                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Campaigns</h1>
                <p className="mt-1 mb-6 text-sm text-slate-500">Share your referral link for any campaign below.</p>

                {loading ? (
                    <div className="py-16 text-center text-slate-400">Loading…</div>
                ) : loadError ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">Couldn't load campaigns. Please refresh.</div>
                ) : campaigns.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">No campaigns available yet.</div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                        {campaigns.map((c) => (
                            <div key={c.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="aspect-[16/9] w-full bg-slate-100">
                                    {c.thumbnail?.file_url
                                        ? <img src={c.thumbnail.file_url} alt={c.title} className="h-full w-full object-cover" />
                                        : <div className="flex h-full w-full items-center justify-center text-slate-300">No image</div>}
                                </div>
                                <div className="flex flex-1 flex-col p-4">
                                    <h3 className="font-semibold text-slate-900">{c.title}</h3>
                                    <div className="mt-auto pt-4 flex flex-wrap items-center gap-2">
                                        <button type="button" disabled={!code} onClick={() => copy(linkFor(c.slug), 'Referral link')}
                                            className="inline-flex items-center rounded-lg bg-campaign px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
                                            Copy referral link
                                        </button>
                                        {code && (
                                            <a href={linkFor(c.slug)} target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                                                Preview ↗
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <ToastContainer position="top-right" transition={Slide} />
        </div>
    );
};

export default AgentHome;
```

- [ ] **Step 4: AgentDashboard page**

Create `src/pages/AgentPages/AgentDashboard.tsx`:
```tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Slide, ToastContainer } from 'react-toastify';
import { agentLogout, getAgentUser, getAgentReferrals, AgentReferrals } from '../../services/agentApi';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/agent/' : '/';
const currency = (n: number | null) => 'RM ' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString() : '-');

const AgentDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [data, setData] = useState<AgentReferrals | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        let active = true;
        (async () => {
            let u;
            try { u = await getAgentUser(); } catch { if (active) navigate(LOCAL_PATH_PREFIX + 'login', { replace: true }); return; }
            if (!active) return;
            if (!u?.onboarded_at) { navigate(LOCAL_PATH_PREFIX + 'onboarding', { replace: true }); return; }
            if (!u.agent_approved_at) { navigate(LOCAL_PATH_PREFIX, { replace: true }); return; }
            setName(u.name || '');
            try { const r = await getAgentReferrals(); if (active) setData(r); }
            catch { if (active) setLoadError(true); }
            finally { if (active) setLoading(false); }
        })();
        return () => { active = false; };
    }, [navigate]);

    const signOut = () => { agentLogout(); navigate(LOCAL_PATH_PREFIX + 'login', { replace: true }); };

    return (
        <div className="fixed inset-0 overflow-y-auto bg-slate-50">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 py-4">
                <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-900">Agent Portal</span>
                    <nav className="flex items-center gap-3 text-sm">
                        <button type="button" onClick={() => navigate(LOCAL_PATH_PREFIX)} className="text-slate-500 hover:text-slate-700">Campaigns</button>
                        <span className="font-semibold text-campaign">Dashboard</span>
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    {name && <span className="hidden sm:inline text-sm text-slate-500">{name}</span>}
                    <button type="button" onClick={signOut} className="text-sm font-semibold text-slate-500 hover:text-slate-700">Sign out</button>
                </div>
            </header>

            <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Your referrals</h1>

                {loading ? (
                    <div className="py-16 text-center text-slate-400">Loading…</div>
                ) : loadError || !data ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">Couldn't load referrals. Please refresh.</div>
                ) : (
                    <>
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="text-sm text-slate-500">Total referred</div><div className="mt-1 text-2xl font-bold text-slate-900">{data.summary.total}</div></div>
                            <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="text-sm text-slate-500">Paid</div><div className="mt-1 text-2xl font-bold text-slate-900">{data.summary.paid}</div></div>
                            <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="text-sm text-slate-500">Total amount</div><div className="mt-1 text-2xl font-bold text-campaign">{currency(data.summary.total_amount)}</div></div>
                        </div>

                        {data.bookings.length === 0 ? (
                            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">No referred bookings yet.</div>
                        ) : (
                            <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                                <table className="w-full text-sm">
                                    <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Campaign</th>
                                            <th className="px-4 py-3 font-semibold">Customer</th>
                                            <th className="px-4 py-3 font-semibold">Date</th>
                                            <th className="px-4 py-3 font-semibold">Status</th>
                                            <th className="px-4 py-3 font-semibold text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {data.bookings.map((b, i) => (
                                            <tr key={i}>
                                                <td className="px-4 py-3 text-slate-900">{b.campaign_title || '-'}</td>
                                                <td className="px-4 py-3 text-slate-600">{b.customer_name || '-'}</td>
                                                <td className="px-4 py-3 text-slate-600">{fmtDate(b.date)}</td>
                                                <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium capitalize text-slate-600">{b.status || '-'}</span></td>
                                                <td className="px-4 py-3 text-right font-semibold text-slate-900">{currency(b.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </main>
            <ToastContainer position="top-right" transition={Slide} />
        </div>
    );
};

export default AgentDashboard;
```

- [ ] **Step 5: Route the dashboard in `App.tsx`**

Import `AgentDashboard` near the other agent page imports. Add to the agent group in BOTH route arrays: in `routeCat[7]` add `{ path: '/dashboard', element: <AgentProtectedRoute><AgentDashboard /></AgentProtectedRoute>, layout: null }`; in `routeCatLocal[7]` add the same with path `/agent/dashboard`.

- [ ] **Step 6: Build + lint + commit**

Run: `npm run build` → exit 0.
Run: `npx eslint src/services/agentApi.ts src/pages/AgentPages/AgentHome.tsx src/pages/AgentPages/AgentDashboard.tsx src/pages/AgentPages/AgentOnboarding.tsx src/App.tsx --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'` → new/agent files 0; App.tsx no new errors. Fix new issues (no `any`).
```bash
git add src/services/agentApi.ts src/pages/AgentPages src/App.tsx
git commit -m "feat(agent): pending-approval gate + referral dashboard + nav + country_code default

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 3 (FE): Admin Agents page

**Repo/branch:** `RenoXpert-Frontend-v2.1`, `feature/agent-enhancements`.

**Files:**
- Modify: `src/services/api.ts` (`getAdminAgents`, `approveAgent`)
- Create: `src/pages/User/AgentsMain.tsx`
- Modify: `src/App.tsx` (staff `/agents` route in routeCat[0] + routeCatLocal[0])
- Modify: `src/components/Sidebar.tsx` (Agents menu entry)

- [ ] **Step 1: Staff API fns**

In `src/services/api.ts`, add:
```ts
export const getAdminAgents = async () => {
    try {
        const response = await axios.get(API_URL + 'admin/agents', { headers: getAuthHeaders() });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};

export const approveAgent = async (id: string | number) => {
    try {
        const response = await axios.post(API_URL + `admin/agents/${id}/approve`, {}, { headers: getAuthHeaders() });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};
```

- [ ] **Step 2: `AgentsMain` page**

Create `src/pages/User/AgentsMain.tsx`:
```tsx
import React, { useEffect, useState } from 'react';
import { Slide, toast, ToastContainer } from 'react-toastify';
import { getAdminAgents, approveAgent } from '../../services/api';

interface AdminAgent { id: number; name: string; email: string; country_code?: string | null; phone_no?: string | null; status?: string | null; onboarded_at?: string | null; agent_approved_at?: string | null; }

const AgentsMain: React.FC = () => {
    const [agents, setAgents] = useState<AdminAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);

    const load = async () => {
        const res = await getAdminAgents();
        const list = (res?.data ?? res ?? []) as AdminAgent[];
        setAgents(Array.isArray(list) ? list : []);
    };

    useEffect(() => { load().catch(() => toast.error('Failed to load agents.')).finally(() => setLoading(false)); }, []);

    const approve = async (a: AdminAgent) => {
        setBusyId(a.id);
        try {
            const res = await approveAgent(a.id);
            if (res && res.success === false) { toast.error(res.message || 'Approve failed.'); }
            else { toast.success('Agent approved.'); await load(); }
        } catch { toast.error('Approve failed.'); }
        finally { setBusyId(null); }
    };

    return (
        <div className="p-4 sm:p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-4">Agents</h1>
            {loading ? (
                <div className="py-10 text-center text-gray-400">Loading…</div>
            ) : agents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white py-10 text-center text-gray-500">No agents yet.</div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                    <table className="w-full text-sm">
                        <thead className="border-b border-gray-200 text-left text-xs uppercase text-gray-400">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Name</th>
                                <th className="px-4 py-3 font-semibold">Email</th>
                                <th className="px-4 py-3 font-semibold">Phone</th>
                                <th className="px-4 py-3 font-semibold">Approval</th>
                                <th className="px-4 py-3 font-semibold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {agents.map((a) => (
                                <tr key={a.id}>
                                    <td className="px-4 py-3 text-gray-900">{a.name || '-'}</td>
                                    <td className="px-4 py-3 text-gray-600">{a.email}</td>
                                    <td className="px-4 py-3 text-gray-600">{a.phone_no ? `${a.country_code || ''}${a.phone_no}` : '-'}</td>
                                    <td className="px-4 py-3">
                                        {a.agent_approved_at
                                            ? <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">Approved</span>
                                            : <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">Pending</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {!a.agent_approved_at && (
                                            <button type="button" disabled={busyId === a.id} onClick={() => approve(a)}
                                                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                                                {busyId === a.id ? 'Approving…' : 'Approve'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <ToastContainer position="top-right" transition={Slide} />
        </div>
    );
};

export default AgentsMain;
```

- [ ] **Step 3: Route + sidebar (staff)**

In `src/App.tsx`: import `AgentsMain`; add to `routeCat[0]` (staff): `{ path: '/agents', element: <AgentsMain />, layout: ProtectedLayout }`, and to `routeCatLocal[0]` the same with path `/staff/agents` (mirror the existing staff local-prefix pattern).
In `src/components/Sidebar.tsx`: copy an existing `<div className="menu-item">…<Link to={LOCAL_PATH_PREFIX + "campaigns"}>…</Link></div>` block, duplicate it, and change the `to` to `LOCAL_PATH_PREFIX + "agents"` and the `menu-title` text to `Agents` (keep an icon span; reuse the campaigns/packages icon classes). Place it near the Campaigns entry.

- [ ] **Step 4: Build + lint + commit**

Run: `npm run build` → exit 0.
Run: `npx eslint src/services/api.ts src/pages/User/AgentsMain.tsx src/components/Sidebar.tsx src/App.tsx --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'` → `api.ts` 17 (baseline); `AgentsMain.tsx` 0; `Sidebar.tsx`/`App.tsx` no new errors. Fix new issues.
```bash
git add src/services/api.ts src/pages/User/AgentsMain.tsx src/components/Sidebar.tsx src/App.tsx
git commit -m "feat(agent): admin Agents page (list + approve) + sidebar entry

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 4: Verify + finalize

- [ ] **Step 1: FE build + scoped lint**

```bash
cd RenoXpert-Frontend-v2.1
npm run build   # exit 0
for f in src/services/agentApi.ts src/services/api.ts src/pages/AgentPages/AgentHome.tsx src/pages/AgentPages/AgentDashboard.tsx src/pages/AgentPages/AgentOnboarding.tsx src/pages/User/AgentsMain.tsx src/components/Sidebar.tsx src/App.tsx; do
  echo "$f: $(npx eslint "$f" --ext ts,tsx --format unix 2>/dev/null | grep -c ':[0-9]*:[0-9]*:')"
done
```
Expected: agent/new files 0; api.ts 17; Sidebar/App.tsx at baseline.

- [ ] **Step 2: BE manual review**

Re-read the BE diff: migration additive nullable + cast + resource; onboarding `ltrim('+')`; `referrals` + `agentCampaigns` gate on `agent_approved_at`; admin list+approve **staff-guarded (agent token → 403)**; routes. No `php artisan` run.

- [ ] **Step 3: Finalize backend (PR to production)**

```bash
cd RenoXpert-Backend
git push -u origin feature/agent-enhancements
gh pr create --base production --head feature/agent-enhancements \
  --title "feat(agent): approval gate + admin approve + referral dashboard + country_code" \
  --body "<summary; run php artisan migrate after merge (users.agent_approved_at); note: existing agents show pending until approved in admin Agents; 🤖 Generated with [Claude Code](https://claude.com/claude-code)>"
```

- [ ] **Step 4: Finalize frontend (merge+push)**

```bash
cd RenoXpert-Frontend-v2.1
git checkout production && git pull --ff-only
git merge --ff-only feature/agent-enhancements
npm run build   # exit 0 gate
git branch -d feature/agent-enhancements
git push origin production
```

- [ ] **Step 5: Hand off QA**

Report: run migrate; new agent onboards → "Pending approval" (no portal/dashboard); staff → admin Agents → Approve → agent gets access; dashboard shows referred bookings + summary + customer name; agent token can't hit /admin/agents or approve (403); new agent country_code stored as '60'. NOTE: existing test agents need approving once.

---

## Self-Review

**Spec coverage:** §3 E1 country_code (onboarding ltrim + FE default) → T1 Step 3 + T2 Step 2 ✅; §4 E2 approval gate (migration/model/resource, agentCampaigns gate, admin staff-guarded list+approve; FE pending screen + admin page + sidebar) → T1 + T2 Step 3 + T3 ✅; §5 E3 dashboard (referrals endpoint; FE dashboard + nav) → T1 Step 4 + T2 Step 4-5 ✅; §2 security guards → T1 Steps 4-6 ✅; §6/§7 → Global Constraints + T4 ✅.

**Placeholder scan:** No TBD/TODO. BE PR body `<...>` is a compose-at-finalize instruction. The Sidebar/App.tsx route instructions are precise "mirror the existing X" with the exact `to`/text to change.

**Type consistency:** `agent_approved_at` across migration/model/cast/resource/`AgentUser`; `getAgentReferrals(): AgentReferrals { summary{total,paid,total_amount}, bookings: AgentReferralRow[] }` matches the BE response; admin `AdminAgent` fields ⊆ `UserResource`; `getAdminAgents`/`approveAgent` (staff `token`) vs `getAgentReferrals` (`a_token`); routes `GET agent/referrals`, `GET admin/agents`, `POST admin/agents/{id}/approve` match. ✅
