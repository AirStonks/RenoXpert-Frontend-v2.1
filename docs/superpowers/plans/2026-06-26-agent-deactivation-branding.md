# Agent Rejection/Deactivation + Portal Branding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Staff can reject/deactivate/reactivate agents (single `status` toggle); add the RenoXpert brand to every agent page.

**Architecture:** Backend adds a staff-guarded `POST /admin/agents/{id}/status` + a `status==='active'` guard on the agent self-service endpoints. Frontend adds the state-aware admin actions, a deactivated sign-out on the agent side, and an `AgentBrand` shown on all agent pages.

**Tech Stack:** Laravel 11 (`BaseController`); React 18 + TS + Vite + Tailwind. No migration; no new deps.

## Global Constraints

- **Security:** the status endpoint is **staff-guarded** `in_array($caller->type, ['staff','admin','super-admin','owner'])` → 403 otherwise (an agent token must NOT be able to set status). Mirrors `approveAgent`.
- Backend: no migration (reuses `users.status`). **NEVER run `php artisan migrate`**. `php` CLI unavailable → manual review. Controllers use `BaseController`.
- Both repos deploy from **`production`**: backend **PR to `production`**, frontend **merge+push**. BE branch `feature/agent-deactivation` off `origin/production`; FE branch `feature/agent-deactivation` off `production`.
- No new npm deps. **FE gate:** `npm run build` exit 0 + scoped eslint no NEW errors; new files 0; no `any`. No test runner.
- **Commit trailers** on every commit:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS
  ```

---

### Task 1 (BE): status endpoint + active guards

**Repo/branch:** `RenoXpert-Backend`, `feature/agent-deactivation` (off `origin/production`).

**Files:**
- Modify: `app/Http/Controllers/UserController.php` (`setAgentStatus`)
- Modify: `app/Http/Controllers/CampaignController.php` (`agentCampaigns` status guard)
- Modify: `app/Http/Controllers/AgentAuthController.php` (`referrals` status guard)
- Modify: `routes/api.php`

- [ ] **Step 1: `setAgentStatus` in UserController**

Ensure `use Illuminate\Support\Facades\Validator;` is imported (it's used elsewhere in the file; add if missing). Add after `approveAgent`:
```php
    public function setAgentStatus(Request $request, $id)
    {
        $caller = $request->user();
        if (!$caller || !in_array($caller->type, ['staff', 'admin', 'super-admin', 'owner'])) {
            return $this->sendError('Forbidden.', [], 403);
        }
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:active,inactive',
        ]);
        if ($validator->fails()) {
            return $this->sendError('Validation Error.', $validator->errors(), 422);
        }
        $agent = User::where('id', $id)->where('type', 'agent')->first();
        if (!$agent) {
            return $this->sendError('Agent not found.', [], 404);
        }
        $agent->status = $request->input('status');
        $agent->save();
        return $this->sendResponse(new UserResource($agent), 'Agent status updated.');
    }
```

- [ ] **Step 2: Status guard on agentCampaigns**

In `app/Http/Controllers/CampaignController.php` `agentCampaigns`, between the `type==='agent'` guard and the `agent_approved_at` gate, add:
```php
        if ($request->user()->status !== 'active') {
            return $this->sendError('Your agent account is not active.', [], 403);
        }
```

- [ ] **Step 3: Status guard on referrals**

In `app/Http/Controllers/AgentAuthController.php` `referrals`, between the `type==='agent'` guard and the `agent_approved_at` gate, add:
```php
        if ($user->status !== 'active') {
            return $this->sendError('Your agent account is not active.', [], 403);
        }
```

- [ ] **Step 4: Route**

In `routes/api.php`, in the `auth:sanctum` group next to the other `admin/agents` routes, add:
```php
    Route::post('admin/agents/{id}/status', [UserController::class, 'setAgentStatus']);
```

- [ ] **Step 5: Manual review + commit**

Confirm: `setAgentStatus` staff-guarded + `in:active,inactive` + `type='agent'` only + sets status; both agent endpoints reject non-active (403); route added. NEVER run migrate.
```bash
git add app/Http/Controllers/UserController.php app/Http/Controllers/CampaignController.php app/Http/Controllers/AgentAuthController.php routes/api.php
git commit -m "feat(agent): staff set-agent-status (reject/deactivate/reactivate) + active guards

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 2 (FE admin): Agents page actions

**Repo/branch:** `RenoXpert-Frontend-v2.1`, `feature/agent-deactivation` (off `production`).

**Files:**
- Modify: `src/services/api.ts` (`setAgentStatus`)
- Rewrite: `src/pages/User/AgentsMain.tsx`

- [ ] **Step 1: API fn**

In `src/services/api.ts`, add:
```ts
export const setAgentStatus = async (id: string | number, status: 'active' | 'inactive') => {
    try {
        const response = await axios.post(API_URL + `admin/agents/${id}/status`, { status }, { headers: getAuthHeaders() });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};
```

- [ ] **Step 2: Rewrite `AgentsMain.tsx`** (adds Status column + state-aware actions)

Replace `src/pages/User/AgentsMain.tsx` with:
```tsx
import React, { useEffect, useState } from 'react';
import { Slide, toast, ToastContainer } from 'react-toastify';
import { getAdminAgents, approveAgent, setAgentStatus } from '../../services/api';

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

    const run = async (id: number, fn: () => Promise<{ success?: boolean; message?: string } | undefined>, okMsg: string) => {
        setBusyId(id);
        try {
            const res = await fn();
            if (res && res.success === false) { toast.error(res.message || 'Action failed.'); }
            else { toast.success(okMsg); await load(); }
        } catch { toast.error('Action failed.'); }
        finally { setBusyId(null); }
    };

    const approve = (a: AdminAgent) => run(a.id, () => approveAgent(a.id), 'Agent approved.');
    const reject = (a: AdminAgent) => { if (!window.confirm(`Reject ${a.name || a.email}? They won't be able to log in.`)) return; run(a.id, () => setAgentStatus(a.id, 'inactive'), 'Agent rejected.'); };
    const deactivate = (a: AdminAgent) => { if (!window.confirm(`Deactivate ${a.name || a.email}?`)) return; run(a.id, () => setAgentStatus(a.id, 'inactive'), 'Agent deactivated.'); };
    const reactivate = (a: AdminAgent) => run(a.id, () => setAgentStatus(a.id, 'active'), 'Agent reactivated.');

    const Badge = ({ ok, yes, no }: { ok: boolean; yes: string; no: string }) => (
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${ok ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{ok ? yes : no}</span>
    );

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
                                <th className="px-4 py-3 font-semibold">Status</th>
                                <th className="px-4 py-3 font-semibold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {agents.map((a) => {
                                const active = a.status === 'active';
                                const approved = !!a.agent_approved_at;
                                const busy = busyId === a.id;
                                return (
                                    <tr key={a.id}>
                                        <td className="px-4 py-3 text-gray-900">{a.name || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{a.email}</td>
                                        <td className="px-4 py-3 text-gray-600">{a.phone_no ? `+${a.country_code || ''} ${a.phone_no}` : '-'}</td>
                                        <td className="px-4 py-3"><Badge ok={approved} yes="Approved" no="Pending" /></td>
                                        <td className="px-4 py-3"><Badge ok={active} yes="Active" no="Inactive" /></td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {!active ? (
                                                    <button type="button" disabled={busy} onClick={() => reactivate(a)} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{busy ? '…' : 'Reactivate'}</button>
                                                ) : !approved ? (
                                                    <>
                                                        <button type="button" disabled={busy} onClick={() => approve(a)} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{busy ? '…' : 'Approve'}</button>
                                                        <button type="button" disabled={busy} onClick={() => reject(a)} className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-50">Reject</button>
                                                    </>
                                                ) : (
                                                    <button type="button" disabled={busy} onClick={() => deactivate(a)} className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-50">{busy ? '…' : 'Deactivate'}</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
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

- [ ] **Step 3: Build + lint + commit**

Run: `npm run build` → exit 0.
Run: `npx eslint src/services/api.ts src/pages/User/AgentsMain.tsx --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'` → `api.ts` 17 (baseline) + `AgentsMain.tsx` 0 = `17`. Fix new issues.
```bash
git add src/services/api.ts src/pages/User/AgentsMain.tsx
git commit -m "feat(agent): admin reject/deactivate/reactivate actions + status column

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 3 (FE agent): branding + deactivated sign-out

**Repo/branch:** `RenoXpert-Frontend-v2.1`, `feature/agent-deactivation`.

**Files:**
- Create: `src/pages/AgentPages/AgentBrand.tsx`
- Modify: `src/services/agentApi.ts` (`status` on `AgentUser`)
- Modify: `src/pages/AgentPages/AgentHome.tsx`, `AgentDashboard.tsx`, `AgentLogin.tsx`, `AgentOnboarding.tsx`

- [ ] **Step 1: `AgentBrand` component**

Create `src/pages/AgentPages/AgentBrand.tsx`:
```tsx
import React from 'react';

const AgentBrand: React.FC<{ showLabel?: boolean; className?: string }> = ({ showLabel = true, className = '' }) => (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
        <img src="/app/RenoExpert_logo-01.svg" alt="RenoXpert" className="h-7 w-auto" />
        {showLabel && <span className="font-bold text-slate-900">Agent Portal</span>}
    </div>
);

export default AgentBrand;
```

- [ ] **Step 2: `status` on AgentUser**

In `src/services/agentApi.ts`, add `status?: string | null;` to the `AgentUser` interface.

- [ ] **Step 3: AgentHome — brand + deactivated sign-out**

In `src/pages/AgentPages/AgentHome.tsx`:
- Import `AgentBrand` (`import AgentBrand from './AgentBrand';`).
- In the `Header` subcomponent, replace `<span className="font-bold text-slate-900">Agent Portal</span>` with `<AgentBrand />`.
- In the pending-screen card, add `<AgentBrand showLabel={false} className="justify-center mb-4" />` directly above the `<h1>Account pending approval</h1>`.
- In the mount effect, immediately after `setUser(u)` is reached (i.e. right after the onboarding check passes — but BEFORE the approval/campaigns logic), add a deactivated guard. Concretely, after `u = await getAgentUser()` succeeds and before the `!u.onboarded_at` check, add:
  ```tsx
  if (u && u.status && u.status !== 'active') {
      toast.error('Your account has been deactivated.');
      agentLogout();
      navigate(LOCAL_PATH_PREFIX + 'login', { replace: true });
      return;
  }
  ```
  (`agentLogout` is already imported.)

- [ ] **Step 4: AgentDashboard — brand + deactivated sign-out**

In `src/pages/AgentPages/AgentDashboard.tsx`:
- Import `AgentBrand`; import `agentLogout` if not already imported (it is).
- Replace the header `<span className="font-bold text-slate-900">Agent Portal</span>` with `<AgentBrand />`.
- In the mount effect, after `u = await getAgentUser()` succeeds and before the `!u?.onboarded_at` check, add the same deactivated guard:
  ```tsx
  if (u && u.status && u.status !== 'active') { agentLogout(); navigate(LOCAL_PATH_PREFIX + 'login', { replace: true }); return; }
  ```

- [ ] **Step 5: AgentLogin + AgentOnboarding — brand on the card**

In `src/pages/AgentPages/AgentLogin.tsx`: import `AgentBrand`; add `<AgentBrand showLabel={false} className="justify-center mb-4" />` directly above the `<h1 ...>Agent Portal</h1>`.
In `src/pages/AgentPages/AgentOnboarding.tsx`: import `AgentBrand`; add `<AgentBrand showLabel={false} className="justify-center mb-4" />` directly above the `<h1 ...>Welcome — let's finish setup</h1>` (inside the existing `<div>` wrapping the heading, or just before it).

- [ ] **Step 6: Build + lint + commit**

Run: `npm run build` → exit 0.
Run: `npx eslint src/pages/AgentPages/AgentBrand.tsx src/pages/AgentPages/AgentHome.tsx src/pages/AgentPages/AgentDashboard.tsx src/pages/AgentPages/AgentLogin.tsx src/pages/AgentPages/AgentOnboarding.tsx src/services/agentApi.ts --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'` → `0`. Fix new issues (no `any`).
```bash
git add src/pages/AgentPages src/services/agentApi.ts
git commit -m "feat(agent): RenoXpert brand on all agent pages + deactivated sign-out

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 4: Verify + finalize

- [ ] **Step 1: FE build + scoped lint**

```bash
cd RenoXpert-Frontend-v2.1
npm run build   # exit 0
for f in src/services/api.ts src/services/agentApi.ts src/pages/User/AgentsMain.tsx src/pages/AgentPages/AgentBrand.tsx src/pages/AgentPages/AgentHome.tsx src/pages/AgentPages/AgentDashboard.tsx src/pages/AgentPages/AgentLogin.tsx src/pages/AgentPages/AgentOnboarding.tsx; do
  echo "$f: $(npx eslint "$f" --ext ts,tsx --format unix 2>/dev/null | grep -c ':[0-9]*:[0-9]*:')"
done
```
Expected: api.ts 17; everything else 0.

- [ ] **Step 2: BE manual review**

Re-read the BE diff: `setAgentStatus` staff-guarded + `in:active,inactive` + type=agent; agentCampaigns + referrals reject non-active; route added. No `php artisan` run.

- [ ] **Step 3: Finalize backend (PR to production)**

```bash
cd RenoXpert-Backend
git push -u origin feature/agent-deactivation
gh pr create --base production --head feature/agent-deactivation \
  --title "feat(agent): reject/deactivate/reactivate + active guards" \
  --body "<summary; no migration (reuses users.status); 🤖 Generated with [Claude Code](https://claude.com/claude-code)>"
```

- [ ] **Step 4: Finalize frontend (merge+push)**

```bash
cd RenoXpert-Frontend-v2.1
git checkout production && git pull --ff-only
git merge --ff-only feature/agent-deactivation
npm run build   # exit 0 gate
git branch -d feature/agent-deactivation
git push origin production
```

- [ ] **Step 5: Hand off QA**

Report: in admin Agents — pending shows Approve + Reject; approved shows Deactivate; inactive shows Reactivate; rejecting/deactivating blocks login + portal (403) and signs out a live session; reactivating restores access (unapproved → pending screen, approved → portal); agent token can't call the status endpoint (403). Branding: RenoXpert logo on login/onboarding/pending/portal/dashboard.

---

## Self-Review

**Spec coverage:** §3 BE (setAgentStatus staff-guarded + active guards on agentCampaigns/referrals + route) → T1 ✅; §3 FE admin (setAgentStatus API + state-aware Reject/Deactivate/Reactivate + status badge) → T2 ✅; §3 FE agent deactivated sign-out + §4 branding (AgentBrand on all pages) → T3 ✅; §5/§6 → Global Constraints + T4 ✅.

**Placeholder scan:** No TBD/TODO. BE PR body `<...>` is a compose-at-finalize instruction. Brand-insertion steps name the exact anchor text to replace/precede.

**Type consistency:** `setAgentStatus(id, status: 'active'|'inactive')` (FE) matches the BE `in:active,inactive` body + route `POST admin/agents/{id}/status`; `AgentUser.status` matches `UserResource.status`; `AgentBrand` props `{showLabel?, className?}`. The admin actions derive purely from `agent_approved_at` + `status`. ✅
