# Agent Portal Implementation Plan (Agent Campaign SP5/5 — FINAL)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the gated `AgentHome` into the agent portal — a responsive list of agent-visible campaigns, each with a "Copy referral link" (the agent's `?ref` link) + "Preview" — and fix the agent area's full-width/centering.

**Architecture:** Backend adds a slim `AgentCampaignResource` + an agent-guarded `GET /agent/campaigns` (filters `visible_to_agents` + live status). Frontend adds `getAgentCampaigns` + `getCampaignBaseUrl`, and rebuilds `AgentHome` with an ancestor-proof full-viewport responsive layout reusing SP1 code / SP2 `buildReferralLink` / SP3 flag.

**Tech Stack:** Laravel 11 (`BaseController`); React 18 + TS + Vite + Tailwind. No schema change, no new deps.

## Global Constraints

- **No schema change** (uses SP1/SP2/SP3 columns). **No new npm deps.**
- Backend: new controller method uses `BaseController`; route under `auth:sanctum`. `php` CLI unavailable → BE manual review. **NEVER run migrate** (none needed here).
- Both repos deploy from **`production`**: backend **PR to `production`**, frontend **merge+push**. BE branch `feature/agent-portal` off `origin/production`; FE branch `feature/agent-portal` off `production`.
- **FE gate:** `npm run build` exit 0 + scoped eslint no NEW errors; rebuilt/new files clean (0); no `any`. No test runner.
- Agent campaigns filter: `visible_to_agents = true AND status IN ('published','active')`. Card = thumbnail + title + Copy referral link + Preview.
- **Commit trailers** on every commit:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS
  ```

---

### Task 1 (BE): Agent campaigns endpoint

**Repo/branch:** `RenoXpert-Backend`, `feature/agent-portal` (off `origin/production`).

**Files:**
- Create: `app/Http/Resources/AgentCampaignResource.php`
- Modify: `app/Http/Controllers/CampaignController.php` (add `agentCampaigns` + import); `routes/api.php`

**Interfaces:**
- Consumes: SP3 `campaigns.visible_to_agents`.
- Produces: `GET agent/campaigns` (auth, agent) → `[{ id, title, slug, thumbnail, booking_amount, start_date, end_date }]`.

- [ ] **Step 1: `AgentCampaignResource`**

Create `app/Http/Resources/AgentCampaignResource.php`:
```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AgentCampaignResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'thumbnail' => $this->thumbnail,
            'booking_amount' => $this->booking_amount,
            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
        ];
    }
}
```

- [ ] **Step 2: `agentCampaigns` controller method**

In `app/Http/Controllers/CampaignController.php`, add `use App\Http\Resources\AgentCampaignResource;` with the other resource imports. Add the method (e.g. after `setAgentVisibility`):
```php
    public function agentCampaigns(Request $request)
    {
        if (optional($request->user())->type !== 'agent') {
            return $this->sendError('Forbidden.', [], 403);
        }

        $campaigns = Campaign::where('visible_to_agents', true)
            ->whereIn('status', ['published', 'active'])
            ->orderByDesc('id')
            ->get();

        return $this->sendResponse(AgentCampaignResource::collection($campaigns), 'Agent campaigns retrieved.');
    }
```

- [ ] **Step 3: Route**

In `routes/api.php`, inside the `auth:sanctum` group (near the other `agent/...` route), add:
```php
    Route::get('agent/campaigns', [CampaignController::class, 'agentCampaigns']);
```

- [ ] **Step 4: Manual review + commit**

Confirm: resource exposes slug+thumbnail; method guards `type==='agent'` (403), filters `visible_to_agents=true` + `whereIn status ['published','active']`, returns the collection; route under auth. NEVER run php/migrate.
```bash
git add app/Http/Resources/AgentCampaignResource.php app/Http/Controllers/CampaignController.php routes/api.php
git commit -m "feat(agent): agent campaigns endpoint (visible + live)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 2 (FE): Agent portal page

**Repo/branch:** `RenoXpert-Frontend-v2.1`, `feature/agent-portal` (off `production`).

**Files:**
- Modify: `src/services/agentApi.ts` (`getAgentCampaigns` + `AgentCampaign`)
- Modify: `src/utils/referral.ts` (`getCampaignBaseUrl`)
- Rewrite: `src/pages/AgentPages/AgentHome.tsx`

**Interfaces:**
- Consumes: Task 1 endpoint; SP2 `buildReferralLink`; `getAgentUser` (SP4).

- [ ] **Step 1: `getCampaignBaseUrl` in `referral.ts`**

Append to `src/utils/referral.ts`:
```ts
/** Public campaign base URL (mirrors CampaignDetail's CAMPAIGN_URL env logic). */
export function getCampaignBaseUrl(): string {
    const env = import.meta.env.VITE_APP_ENV;
    if (env === 'production') return import.meta.env.VITE_CAMPAIGN_URL || '';
    if (env === 'staging') return import.meta.env.VITE_STAGING_CAMPAIGN_URL || '';
    if (env === 'local') return 'localhost:5173/campaign/';
    return '';
}
```

- [ ] **Step 2: `getAgentCampaigns` + type in `agentApi.ts`**

In `src/services/agentApi.ts`, add the interface (near `AgentUser`) and the fetch (after `getAgentUser`):
```ts
export interface AgentCampaign {
    id: number;
    title: string;
    slug: string;
    thumbnail?: { file_url?: string } | null;
    booking_amount?: number | null;
    start_date?: string | null;
    end_date?: string | null;
}

export const getAgentCampaigns = async (): Promise<AgentCampaign[]> => {
    const response = await axios.get(API_URL + 'agent/campaigns', { headers: getAgentAuthHeaders() });
    return response.data?.data ?? response.data ?? [];
};
```

- [ ] **Step 3: Rebuild `AgentHome.tsx`**

Replace the entire contents of `src/pages/AgentPages/AgentHome.tsx` with:
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

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const u = await getAgentUser();
                if (!active) return;
                if (!u?.onboarded_at) { navigate(LOCAL_PATH_PREFIX + 'onboarding', { replace: true }); return; }
                setUser(u);
                const list = await getAgentCampaigns();
                if (!active) return;
                setCampaigns(Array.isArray(list) ? list : []);
            } catch {
                if (active) navigate(LOCAL_PATH_PREFIX + 'login', { replace: true });
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

    return (
        <div className="fixed inset-0 overflow-y-auto bg-slate-50">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 py-4">
                <span className="font-bold text-slate-900">Agent Portal</span>
                <div className="flex items-center gap-3">
                    {user?.name && <span className="hidden sm:inline text-sm text-slate-500">{user.name}</span>}
                    <button type="button" onClick={signOut} className="text-sm font-semibold text-slate-500 hover:text-slate-700">Sign out</button>
                </div>
            </header>

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

- [ ] **Step 4: Build + lint**

Run: `npm run build` → exit 0.
Run: `npx eslint src/services/agentApi.ts src/utils/referral.ts src/pages/AgentPages/AgentHome.tsx --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'` → `0`. Fix any new error (no `any`).

- [ ] **Step 5: Commit**

```bash
git add src/services/agentApi.ts src/utils/referral.ts src/pages/AgentPages/AgentHome.tsx
git commit -m "feat(agent): agent portal — visible campaigns + referral link/preview + full-width layout

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 3: Verify + finalize

- [ ] **Step 1: FE build + scoped lint**

```bash
cd RenoXpert-Frontend-v2.1
npm run build   # exit 0
for f in src/services/agentApi.ts src/utils/referral.ts src/pages/AgentPages/AgentHome.tsx; do
  echo "$f: $(npx eslint "$f" --ext ts,tsx --format unix 2>/dev/null | grep -c ':[0-9]*:[0-9]*:')"
done
```
Expected: all 0.

- [ ] **Step 2: BE manual review**

Re-read the BE diff: `AgentCampaignResource` (slug+thumbnail present); `agentCampaigns` guards `type==='agent'` (403) + filters `visible_to_agents=true` + `status IN (published,active)` + returns the collection; route under `auth:sanctum`. No `php artisan` run.

- [ ] **Step 3: Finalize backend (PR to production)**

```bash
cd RenoXpert-Backend
git push -u origin feature/agent-portal
gh pr create --base production --head feature/agent-portal \
  --title "feat(agent): agent campaigns endpoint (Agent Campaign SP5)" \
  --body "<summary; no migration needed (uses SP3 visible_to_agents); 🤖 Generated with [Claude Code](https://claude.com/claude-code)>"
```

- [ ] **Step 4: Finalize frontend (merge+push)**

```bash
cd RenoXpert-Frontend-v2.1
git checkout production && git pull --ff-only
git merge --ff-only feature/agent-portal
npm run build   # exit 0 gate
git branch -d feature/agent-portal
git push origin production
```

- [ ] **Step 5: Hand off QA**

Report: onboarded agent lands on a full-width, centered portal (desktop + mobile); visible+published campaigns show as cards; Copy referral link copies the `?ref` link; Preview opens the public campaign with `?ref`; non-visible/draft campaigns don't appear; end-to-end — previewing then booking stamps the agent as referrer (SP2). Reminder: depends on the SP1–SP4 backend PRs being merged + migrated.

---

## Self-Review

**Spec coverage:** §4 BE (AgentCampaignResource + agentCampaigns guarded/filtered + route) → Task 1 ✅; §5 FE (getAgentCampaigns + AgentCampaign type + getCampaignBaseUrl + AgentHome rebuild with layout fix + header + referral-code strip + grid + copy/preview + states) → Task 2 ✅; §6/§7 constraints + verify → Global Constraints + Task 3 ✅.

**Placeholder scan:** No TBD/TODO. The BE PR body `<...>` is a compose-at-finalize instruction. No vague steps — full code provided for the new resource, controller method, and the AgentHome rewrite.

**Type consistency:** `AgentCampaign` (FE) fields match `AgentCampaignResource` (BE) exactly (id/title/slug/thumbnail/booking_amount/start_date/end_date); `getAgentCampaigns(): AgentCampaign[]`; `buildReferralLink(base, slug, code)` + `getCampaignBaseUrl()` used as `linkFor(slug)`; route `GET agent/campaigns` matches the fetch path; `type==='agent'` guard consistent with SP4. ✅
