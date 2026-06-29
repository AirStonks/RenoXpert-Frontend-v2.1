# Agent Campaign Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the global `campaigns.visible_to_agents` flag with per-agent campaign assignment — staff control exactly which campaigns each agent sees, managed from both the agent side and the campaign side.

**Architecture:** A new `agent_campaign_visibility` mapping table (no DB FKs, per the hand-managed-table convention) joins agents (`users.type='agent'`) to campaigns. `belongsToMany` relations drive a rewritten agent-campaigns query and four sync-style staff endpoints. The frontend gets a reusable assignment modal used from the Agents page (pick campaigns for an agent) and the Campaign detail page (pick agents for a campaign); the old global toggle is removed everywhere.

**Tech Stack:** Laravel 11 (backend, PR → `production`), React 18 + TypeScript + Tailwind + Vite (frontend, merge+push → `production`), axios, react-toastify.

## Global Constraints

- Backend API controllers MUST `extend BaseController` (else `sendResponse`/`sendError` throw at runtime).
- Hand-managed tables get authored **additive** migrations with **NO DB-level foreign keys** — plain columns + indexes only.
- NEVER run `php artisan migrate` — the user runs it. There is no PHP/DB in the working environment, so backend tasks are verified by **manual review**, not a test runner.
- Staff-only endpoints reuse the guard `in_array($caller->type, ['staff', 'admin', 'super-admin', 'owner'])` — an agent token must get 403 (no self-assignment).
- The agent-facing campaigns query keeps the status filter `status IN ('published','active')` so an assigned draft never leaks.
- Frontend verification per task: `npm run build` (exit 0) + scoped eslint on touched files (0 new errors). Baseline has 17 pre-existing eslint errors — do not count those.
- Commit trailers (verbatim) on every commit:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS
  ```
- Backend repo path: `/home/ubuntu/projects/old/RenoXpert-Backend`. Frontend repo path: `/home/ubuntu/projects/old/RenoXpert-Frontend-v2.1`.

## File Structure

**Backend (`RenoXpert-Backend`):**
- `database/migrations/2026_06_29_000000_create_agent_campaign_visibility_table.php` (new) — create mapping table + drop `visible_to_agents`.
- `app/Models/Campaign.php` — add `visibleToAgents()` relation; remove `visible_to_agents` from `$fillable`/`$casts`.
- `app/Models/User.php` — add `visibleCampaigns()` relation.
- `app/Http/Resources/CampaignResource.php` — remove `visible_to_agents`.
- `app/Http/Resources/List/CampaignListResource.php` — remove `visible_to_agents`.
- `app/Http/Controllers/CampaignController.php` — rewrite `agentCampaigns`; remove `setAgentVisibility`; add `agentCampaignIds`, `setAgentCampaigns`, `campaignAgentIds`, `setCampaignAgents`; detach pivot in `destroy`.
- `routes/api.php` — remove the `agent-visibility` route; add four management routes.

**Frontend (`RenoXpert-Frontend-v2.1`):**
- `src/services/api.ts` — add 4 functions; (later) remove `setCampaignAgentVisibility`.
- `src/types/index.ts` — (later) remove `visible_to_agents` from the Campaign type.
- `src/pages/User/AssignmentModal.tsx` (new) — reusable checklist modal.
- `src/pages/User/AgentsMain.tsx` — "Manage campaigns" action + modal.
- `src/pages/Campaign/CampaignDetail.tsx` — remove global toggle; add "Manage agents" + modal.
- `src/pages/Campaign/CampaignMain.tsx` — remove the per-row global toggle.

---

## Task 1: Migration — create mapping table, drop the global flag

**Files:**
- Create: `RenoXpert-Backend/database/migrations/2026_06_29_000000_create_agent_campaign_visibility_table.php`

**Interfaces:**
- Produces: table `agent_campaign_visibility(id, user_id, campaign_id, created_at, updated_at)` with unique(`user_id`,`campaign_id`) + per-column indexes; drops `campaigns.visible_to_agents`.

- [ ] **Step 1: Write the migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('agent_campaign_visibility', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('campaign_id');
            $table->timestamps();

            // No DB-level foreign keys (hand-managed-table convention) — plain indexes only.
            $table->unique(['user_id', 'campaign_id']);
            $table->index('user_id');
            $table->index('campaign_id');
        });

        if (Schema::hasColumn('campaigns', 'visible_to_agents')) {
            Schema::table('campaigns', function (Blueprint $table) {
                $table->dropColumn('visible_to_agents');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('campaigns', 'visible_to_agents')) {
            Schema::table('campaigns', function (Blueprint $table) {
                $table->boolean('visible_to_agents')->default(false)->after('status');
            });
        }

        Schema::dropIfExists('agent_campaign_visibility');
    }
};
```

- [ ] **Step 2: Manual review**

Verify: table name `agent_campaign_visibility`; columns `user_id`/`campaign_id` are `unsignedBigInteger`; unique composite present; **no** `$table->foreign(...)` calls; `up()` drops `visible_to_agents` guarded by `hasColumn`; `down()` is the exact inverse. Confirm the filename timestamp `2026_06_29_000000` sorts after the existing latest migration (`2026_06_26_000100`).

- [ ] **Step 3: Commit**

```bash
cd /home/ubuntu/projects/old/RenoXpert-Backend
git add database/migrations/2026_06_29_000000_create_agent_campaign_visibility_table.php
git commit -m "feat(agent): agent_campaign_visibility table + drop global visible_to_agents

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

## Task 2: Model relations + remove the dead flag from model/resources

**Files:**
- Modify: `RenoXpert-Backend/app/Models/Campaign.php` (fillable ~line 31, casts ~line 39)
- Modify: `RenoXpert-Backend/app/Models/User.php` (add relation after `itemPermissions()`, ~line 118)
- Modify: `RenoXpert-Backend/app/Http/Resources/CampaignResource.php` (line 47)
- Modify: `RenoXpert-Backend/app/Http/Resources/List/CampaignListResource.php` (line 40)

**Interfaces:**
- Produces:
  - `Campaign::visibleToAgents()` → `belongsToMany(User, 'agent_campaign_visibility', 'campaign_id', 'user_id')`
  - `User::visibleCampaigns()` → `belongsToMany(Campaign, 'agent_campaign_visibility', 'user_id', 'campaign_id')`

- [ ] **Step 1: Remove `visible_to_agents` from `Campaign::$fillable`**

In `app/Models/Campaign.php`, delete the line `'visible_to_agents',` from the `$fillable` array.

- [ ] **Step 2: Remove `visible_to_agents` from `Campaign::$casts`**

In the same file, delete the line `'visible_to_agents' => 'boolean',` from `$casts`.

- [ ] **Step 3: Add the `visibleToAgents` relation to Campaign**

Add this method inside the `Campaign` class (e.g. near the other relations):

```php
    public function visibleToAgents()
    {
        return $this->belongsToMany(User::class, 'agent_campaign_visibility', 'campaign_id', 'user_id')
            ->withTimestamps();
    }
```

- [ ] **Step 4: Add the `visibleCampaigns` relation to User**

In `app/Models/User.php`, add this method after `itemPermissions()` (around line 118):

```php
    public function visibleCampaigns()
    {
        return $this->belongsToMany(Campaign::class, 'agent_campaign_visibility', 'user_id', 'campaign_id')
            ->withTimestamps();
    }
```

(Both models are in `App\Models`, so no `use` import is needed.)

- [ ] **Step 5: Remove `visible_to_agents` from both resources**

In `app/Http/Resources/CampaignResource.php` delete the line `'visible_to_agents' => $this->visible_to_agents,` (line 47). In `app/Http/Resources/List/CampaignListResource.php` delete the line `'visible_to_agents' => $this->visible_to_agents,` (line 40).

- [ ] **Step 6: Manual review**

Grep the backend for leftover references: `grep -rn "visible_to_agents" app/` — the ONLY remaining hit should be `CampaignController.php` (handled in Task 3). Confirm relation column order is correct: on `User`, foreign pivot key = `user_id`, related pivot key = `campaign_id`; on `Campaign`, reversed.

- [ ] **Step 7: Commit**

```bash
cd /home/ubuntu/projects/old/RenoXpert-Backend
git add app/Models/Campaign.php app/Models/User.php app/Http/Resources/CampaignResource.php app/Http/Resources/List/CampaignListResource.php
git commit -m "feat(agent): belongsToMany agent<->campaign relations; drop visible_to_agents from model/resources

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

## Task 3: Controller — rewrite agentCampaigns, remove global toggle, add management endpoints

**Files:**
- Modify: `RenoXpert-Backend/app/Http/Controllers/CampaignController.php` (rewrite `agentCampaigns` ~444; remove `setAgentVisibility` ~464; add 4 methods; detach in `destroy` ~534)
- Modify: `RenoXpert-Backend/routes/api.php` (remove line 328; add 4 routes near line 333)

**Interfaces:**
- Consumes: `User::visibleCampaigns()`, `Campaign::visibleToAgents()` (Task 2); `AgentCampaignResource` (existing); the staff guard pattern (existing in `UserController`).
- Produces routes:
  - `GET admin/agents/{id}/campaigns` → `agentCampaignIds` → `{ data: { campaign_ids: int[] } }`
  - `PUT admin/agents/{id}/campaigns` body `{ campaign_ids: int[] }` → `setAgentCampaigns`
  - `GET admin/campaigns/{id}/agents` → `campaignAgentIds` → `{ data: { user_ids: int[] } }`
  - `PUT admin/campaigns/{id}/agents` body `{ user_ids: int[] }` → `setCampaignAgents`

- [ ] **Step 1: Rewrite `agentCampaigns`**

Replace the body's query block. The auth gates (type=agent, status active, agent_approved_at) stay **unchanged**; only the campaign query changes:

```php
        $campaigns = $request->user()->visibleCampaigns()
            ->whereIn('status', ['published', 'active'])
            ->orderByDesc('campaigns.id')
            ->get();

        return $this->sendResponse(AgentCampaignResource::collection($campaigns), 'Agent campaigns retrieved.');
```

(Note: `orderByDesc('campaigns.id')` is table-qualified to avoid ambiguity with the pivot's `id`.)

- [ ] **Step 2: Remove `setAgentVisibility`**

Delete the entire `public function setAgentVisibility(Request $request, $id) { ... }` method.

- [ ] **Step 3: Add the four management methods**

Add these methods to `CampaignController` (ensure `use App\Models\User;` exists at the top — add it if missing):

```php
    public function agentCampaignIds(Request $request, $id)
    {
        $caller = $request->user();
        if (!$caller || !in_array($caller->type, ['staff', 'admin', 'super-admin', 'owner'])) {
            return $this->sendError('Forbidden.', [], 403);
        }
        $agent = User::where('type', 'agent')->find($id);
        if (is_null($agent)) {
            return $this->sendError('Agent not found.', [], 404);
        }
        return $this->sendResponse(
            ['campaign_ids' => $agent->visibleCampaigns()->pluck('campaigns.id')],
            'Agent campaigns retrieved.'
        );
    }

    public function setAgentCampaigns(Request $request, $id)
    {
        $caller = $request->user();
        if (!$caller || !in_array($caller->type, ['staff', 'admin', 'super-admin', 'owner'])) {
            return $this->sendError('Forbidden.', [], 403);
        }
        $agent = User::where('type', 'agent')->find($id);
        if (is_null($agent)) {
            return $this->sendError('Agent not found.', [], 404);
        }
        $validator = Validator::make($request->all(), [
            'campaign_ids' => 'present|array',
            'campaign_ids.*' => 'integer|exists:campaigns,id',
        ]);
        if ($validator->fails()) {
            return $this->sendError('Validation Error.', $validator->errors(), 422);
        }
        $agent->visibleCampaigns()->sync($request->input('campaign_ids', []));
        return $this->sendResponse(
            ['campaign_ids' => $agent->visibleCampaigns()->pluck('campaigns.id')],
            'Agent campaigns updated.'
        );
    }

    public function campaignAgentIds(Request $request, $id)
    {
        $caller = $request->user();
        if (!$caller || !in_array($caller->type, ['staff', 'admin', 'super-admin', 'owner'])) {
            return $this->sendError('Forbidden.', [], 403);
        }
        $campaign = Campaign::find($id);
        if (is_null($campaign)) {
            return $this->sendError('Campaign not found.', [], 404);
        }
        return $this->sendResponse(
            ['user_ids' => $campaign->visibleToAgents()->pluck('users.id')],
            'Campaign agents retrieved.'
        );
    }

    public function setCampaignAgents(Request $request, $id)
    {
        $caller = $request->user();
        if (!$caller || !in_array($caller->type, ['staff', 'admin', 'super-admin', 'owner'])) {
            return $this->sendError('Forbidden.', [], 403);
        }
        $campaign = Campaign::find($id);
        if (is_null($campaign)) {
            return $this->sendError('Campaign not found.', [], 404);
        }
        $validator = Validator::make($request->all(), [
            'user_ids' => 'present|array',
            'user_ids.*' => 'integer|exists:users,id',
        ]);
        if ($validator->fails()) {
            return $this->sendError('Validation Error.', $validator->errors(), 422);
        }
        $ids = array_values(array_unique($request->input('user_ids', [])));
        $agentCount = User::where('type', 'agent')->whereIn('id', $ids)->count();
        if ($agentCount !== count($ids)) {
            return $this->sendError('All assigned users must be agents.', [], 422);
        }
        $campaign->visibleToAgents()->sync($ids);
        return $this->sendResponse(
            ['user_ids' => $campaign->visibleToAgents()->pluck('users.id')],
            'Campaign agents updated.'
        );
    }
```

- [ ] **Step 4: Detach pivot rows on campaign delete**

In `public function destroy($id)`, immediately before `$campaign->delete();` (~line 549), add:

```php
            $campaign->visibleToAgents()->detach();
```

- [ ] **Step 5: Update routes**

In `routes/api.php`, **remove** line 328:
```php
    Route::patch('campaigns/{id}/agent-visibility', [CampaignController::class, 'setAgentVisibility']);
```
And **add** these four routes right after the `admin/agents/{id}/status` route (~line 333):
```php
    Route::get('admin/agents/{id}/campaigns', [CampaignController::class, 'agentCampaignIds']);
    Route::put('admin/agents/{id}/campaigns', [CampaignController::class, 'setAgentCampaigns']);
    Route::get('admin/campaigns/{id}/agents', [CampaignController::class, 'campaignAgentIds']);
    Route::put('admin/campaigns/{id}/agents', [CampaignController::class, 'setCampaignAgents']);
```

- [ ] **Step 6: Manual review**

Confirm: `grep -rn "visible_to_agents\|setAgentVisibility\|agent-visibility" app/ routes/` returns **zero** hits. Confirm `use App\Models\User;` present in CampaignController. Confirm all four new methods have the staff guard as their first statement. Confirm `agentCampaigns` still has its three agent gates intact above the new query.

- [ ] **Step 7: Commit**

```bash
cd /home/ubuntu/projects/old/RenoXpert-Backend
git add app/Http/Controllers/CampaignController.php routes/api.php
git commit -m "feat(agent): per-agent campaign endpoints + pivot-based agentCampaigns; remove global toggle

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

## Task 4: Frontend API client — add the four management functions

**Files:**
- Modify: `RenoXpert-Frontend-v2.1/src/services/api.ts`

**Interfaces:**
- Consumes: BE routes from Task 3; existing `getAuthHeaders`, `handle401Error`, `API_URL`, `axios`, `AxiosError`.
- Produces:
  - `getAgentCampaignIds(agentId: number)` → envelope with `data.campaign_ids: number[]`
  - `setAgentCampaignIds(agentId: number, campaignIds: number[])`
  - `getCampaignAgentIds(campaignId: number)` → envelope with `data.user_ids: number[]`
  - `setCampaignAgentIds(campaignId: number, userIds: number[])`

- [ ] **Step 1: Add the four functions**

Add directly after the existing `setCampaignAgentVisibility` function (do NOT remove `setCampaignAgentVisibility` yet — it is still imported by the campaign pages until Task 7):

```ts
export const getAgentCampaignIds = async (agentId: number) => {
    try {
        const response = await axios.get(API_URL + `admin/agents/${agentId}/campaigns`, { headers: getAuthHeaders() });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
};

export const setAgentCampaignIds = async (agentId: number, campaignIds: number[]) => {
    try {
        const response = await axios.put(API_URL + `admin/agents/${agentId}/campaigns`, { campaign_ids: campaignIds }, { headers: getAuthHeaders() });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
};

export const getCampaignAgentIds = async (campaignId: number) => {
    try {
        const response = await axios.get(API_URL + `admin/campaigns/${campaignId}/agents`, { headers: getAuthHeaders() });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
};

export const setCampaignAgentIds = async (campaignId: number, userIds: number[]) => {
    try {
        const response = await axios.put(API_URL + `admin/campaigns/${campaignId}/agents`, { user_ids: userIds }, { headers: getAuthHeaders() });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
        throw error;
    }
};
```

- [ ] **Step 2: Verify build + lint**

```bash
cd /home/ubuntu/projects/old/RenoXpert-Frontend-v2.1
npm run build   # expect exit 0
npx eslint src/services/api.ts --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'   # expect no NEW errors vs baseline
```

- [ ] **Step 3: Commit**

```bash
git add src/services/api.ts
git commit -m "feat(agent): API client for per-agent campaign assignment

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

## Task 5: Reusable AssignmentModal component

**Files:**
- Create: `RenoXpert-Frontend-v2.1/src/pages/User/AssignmentModal.tsx`

**Interfaces:**
- Produces: `AssignmentItem { id: number; label: string; sublabel?: string }` and default-exported `AssignmentModal` with props `{ title: string; items: AssignmentItem[]; selectedIds: number[]; loading?: boolean; saving?: boolean; onSave: (ids: number[]) => void; onClose: () => void }`.

- [ ] **Step 1: Write the component**

```tsx
import React, { useState, useEffect } from 'react';

export interface AssignmentItem {
    id: number;
    label: string;
    sublabel?: string;
}

interface AssignmentModalProps {
    title: string;
    items: AssignmentItem[];
    selectedIds: number[];
    loading?: boolean;
    saving?: boolean;
    onSave: (ids: number[]) => void;
    onClose: () => void;
}

const AssignmentModal: React.FC<AssignmentModalProps> = ({ title, items, selectedIds, loading = false, saving = false, onSave, onClose }) => {
    const [selected, setSelected] = useState<Set<number>>(new Set(selectedIds));
    const [query, setQuery] = useState('');

    useEffect(() => { setSelected(new Set(selectedIds)); }, [selectedIds]);

    const toggle = (id: number) => setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });

    const q = query.trim().toLowerCase();
    const filtered = q
        ? items.filter((i) => i.label.toLowerCase().includes(q) || (i.sublabel || '').toLowerCase().includes(q))
        : items;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                    <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">✕</button>
                </div>
                <div className="px-5 py-3">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search…"
                        className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                        {loading ? (
                            <p className="py-6 text-center text-sm text-gray-400">Loading…</p>
                        ) : filtered.length === 0 ? (
                            <p className="py-6 text-center text-sm text-gray-400">Nothing to show.</p>
                        ) : filtered.map((i) => (
                            <label key={i.id} className="flex cursor-pointer items-center gap-3 py-2.5">
                                <input type="checkbox" checked={selected.has(i.id)} onChange={() => toggle(i.id)} className="h-4 w-4 rounded border-gray-300" />
                                <span className="flex-1">
                                    <span className="block text-sm text-gray-900">{i.label}</span>
                                    {i.sublabel && <span className="block text-xs text-gray-400">{i.sublabel}</span>}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4">
                    <span className="text-xs text-gray-400">{selected.size} selected</span>
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600">Cancel</button>
                        <button type="button" disabled={saving || loading} onClick={() => onSave(Array.from(selected))} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignmentModal;
```

- [ ] **Step 2: Verify build + lint**

```bash
cd /home/ubuntu/projects/old/RenoXpert-Frontend-v2.1
npm run build
npx eslint src/pages/User/AssignmentModal.tsx --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'   # expect 0
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/User/AssignmentModal.tsx
git commit -m "feat(agent): reusable AssignmentModal checklist component

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

## Task 6: Agents page — "Manage campaigns" per agent

**Files:**
- Modify: `RenoXpert-Frontend-v2.1/src/pages/User/AgentsMain.tsx`

**Interfaces:**
- Consumes: `AssignmentModal` + `AssignmentItem` (Task 5); `getAgentCampaignIds`, `setAgentCampaignIds` (Task 4); `campaignIndex` (existing, returns `{ data: Campaign[], totalCount }`).

- [ ] **Step 1: Add imports**

At the top of `AgentsMain.tsx`, extend the api import and add the modal + campaign list import:

```tsx
import { getAdminAgents, approveAgent, setAgentStatus, campaignIndex, getAgentCampaignIds, setAgentCampaignIds } from '../../services/api';
import AssignmentModal, { AssignmentItem } from './AssignmentModal';
```

- [ ] **Step 2: Add modal state + handlers**

Inside the `AgentsMain` component, after the existing `useState` declarations, add:

```tsx
    const [manageAgent, setManageAgent] = useState<AdminAgent | null>(null);
    const [campaignItems, setCampaignItems] = useState<AssignmentItem[]>([]);
    const [assignedCampaignIds, setAssignedCampaignIds] = useState<number[]>([]);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalSaving, setModalSaving] = useState(false);

    const openManage = async (a: AdminAgent) => {
        setManageAgent(a);
        setModalLoading(true);
        setCampaignItems([]);
        setAssignedCampaignIds([]);
        try {
            const [campaignsRes, assignedRes] = await Promise.all([
                campaignIndex(1000, 1),
                getAgentCampaignIds(a.id),
            ]);
            const list: Array<{ id: number | string; title?: string; status?: string }> = campaignsRes?.data || [];
            setCampaignItems(list.map((c) => ({ id: Number(c.id), label: c.title || `Campaign #${c.id}`, sublabel: c.status || undefined })));
            setAssignedCampaignIds((assignedRes?.data?.campaign_ids || []).map((n: number) => Number(n)));
        } catch {
            toast.error('Could not load campaigns.');
            setManageAgent(null);
        } finally {
            setModalLoading(false);
        }
    };

    const saveManage = async (ids: number[]) => {
        if (!manageAgent) return;
        setModalSaving(true);
        try {
            await setAgentCampaignIds(manageAgent.id, ids);
            toast.success('Campaign access updated.');
            setManageAgent(null);
        } catch {
            toast.error('Could not save campaign access.');
        } finally {
            setModalSaving(false);
        }
    };
```

- [ ] **Step 3: Add the "Campaigns" button to the Action cell**

In the action `<div className="flex items-center justify-end gap-2">`, add a button as the first child (shown for every agent, before the state-specific buttons):

```tsx
                                                <button type="button" disabled={busy} onClick={() => openManage(a)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-50">Campaigns</button>
```

- [ ] **Step 4: Render the modal**

Just before the closing `<ToastContainer ... />` line at the end of the JSX, add:

```tsx
            {manageAgent && (
                <AssignmentModal
                    title={`Campaigns for ${manageAgent.name || manageAgent.email}`}
                    items={campaignItems}
                    selectedIds={assignedCampaignIds}
                    loading={modalLoading}
                    saving={modalSaving}
                    onSave={saveManage}
                    onClose={() => setManageAgent(null)}
                />
            )}
```

- [ ] **Step 5: Verify build + lint**

```bash
cd /home/ubuntu/projects/old/RenoXpert-Frontend-v2.1
npm run build
npx eslint src/pages/User/AgentsMain.tsx --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'   # expect 0
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/User/AgentsMain.tsx
git commit -m "feat(agent): manage per-agent campaign access from Agents page

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

## Task 7: Campaign pages — remove global toggle, add "Manage agents" to detail, drop dead code

**Files:**
- Modify: `RenoXpert-Frontend-v2.1/src/pages/Campaign/CampaignMain.tsx` (remove toggle: import line 3, component ~40, render ~377, `updateRowVisibility` ~173)
- Modify: `RenoXpert-Frontend-v2.1/src/pages/Campaign/CampaignDetail.tsx` (remove toggle state/handler/UI ~434-457, ~722; add Manage agents)
- Modify: `RenoXpert-Frontend-v2.1/src/services/api.ts` (remove now-unused `setCampaignAgentVisibility`)
- Modify: `RenoXpert-Frontend-v2.1/src/types/index.ts` (remove `visible_to_agents?: boolean;` line 1661)

**Interfaces:**
- Consumes: `AssignmentModal`/`AssignmentItem` (Task 5); `getCampaignAgentIds`, `setCampaignAgentIds`, `getAdminAgents` (Task 4/existing).

- [ ] **Step 1: CampaignMain — remove the per-row global toggle**

In `src/pages/Campaign/CampaignMain.tsx`:
- Change the import on line 3 from `import { campaignIndex, setCampaignAgentVisibility } from '../../services/api';` to `import { campaignIndex } from '../../services/api';`
- Delete the entire `const AgentVisibilityToggle = ({ ... }) => { ... };` component (starts ~line 40).
- Delete the `updateRowVisibility` function (~line 173).
- Delete the render usage `<AgentVisibilityToggle campaign={campaign} onChanged={updateRowVisibility} />` (~line 377). If it sits in its own table cell/column, also remove that column's empty `<td>` wrapper and the corresponding `<th>` header so the table columns stay aligned.

- [ ] **Step 2: CampaignDetail — remove toggle state, handler, and UI**

In `src/pages/Campaign/CampaignDetail.tsx`:
- Remove `setCampaignAgentVisibility` from the import on line 23 → `import { setBookingReferral, getCurrentUser } from '../../services/api';`
- Delete `agentVisible`/`agentVisibleBusy` state (lines ~434-435), the `useEffect` that sets `agentVisible` from `campaign.visible_to_agents` (~436-438), and the entire `handleToggleAgentVisibility` function (~440-458).
- Delete the toggle UI block around lines 722-724 (the `<button ... onClick={handleToggleAgentVisibility} ...>` switch and its surrounding label/wrapper that reads "Agent visibility" or similar).

- [ ] **Step 3: CampaignDetail — add imports + Manage agents state/handlers**

Add to the api import on line 23: `getAdminAgents`, `getCampaignAgentIds`, `setCampaignAgentIds`. Add the modal import:

```tsx
import AssignmentModal, { AssignmentItem } from '../User/AssignmentModal';
```

Add state + handlers inside the component (near the other hooks):

```tsx
    const [manageAgentsOpen, setManageAgentsOpen] = useState(false);
    const [agentItems, setAgentItems] = useState<AssignmentItem[]>([]);
    const [assignedAgentIds, setAssignedAgentIds] = useState<number[]>([]);
    const [agentsModalLoading, setAgentsModalLoading] = useState(false);
    const [agentsModalSaving, setAgentsModalSaving] = useState(false);

    const openManageAgents = async () => {
        if (!campaign) return;
        setManageAgentsOpen(true);
        setAgentsModalLoading(true);
        setAgentItems([]);
        setAssignedAgentIds([]);
        try {
            const [agentsRes, assignedRes] = await Promise.all([
                getAdminAgents(),
                getCampaignAgentIds(Number(campaign.id)),
            ]);
            const list: Array<{ id: number; name?: string; email?: string }> = agentsRes?.data || [];
            setAgentItems(list.map((u) => ({ id: Number(u.id), label: u.name || u.email || `Agent #${u.id}`, sublabel: u.email || undefined })));
            setAssignedAgentIds((assignedRes?.data?.user_ids || []).map((n: number) => Number(n)));
        } catch {
            toast.error('Could not load agents.');
            setManageAgentsOpen(false);
        } finally {
            setAgentsModalLoading(false);
        }
    };

    const saveManageAgents = async (ids: number[]) => {
        if (!campaign) return;
        setAgentsModalSaving(true);
        try {
            await setCampaignAgentIds(Number(campaign.id), ids);
            toast.success('Agent access updated.');
            setManageAgentsOpen(false);
        } catch {
            toast.error('Could not save agent access.');
        } finally {
            setAgentsModalSaving(false);
        }
    };
```

- [ ] **Step 4: CampaignDetail — add the "Manage agents" button + modal**

Where the old toggle lived (a campaign-settings area), add a button:

```tsx
                                <button type="button" onClick={openManageAgents} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700">Manage agents</button>
```

And near the end of the component's JSX (alongside other modals / before the closing fragment), add:

```tsx
            {manageAgentsOpen && (
                <AssignmentModal
                    title="Agents who can see this campaign"
                    items={agentItems}
                    selectedIds={assignedAgentIds}
                    loading={agentsModalLoading}
                    saving={agentsModalSaving}
                    onSave={saveManageAgents}
                    onClose={() => setManageAgentsOpen(false)}
                />
            )}
```

- [ ] **Step 5: Remove the dead `setCampaignAgentVisibility` and the type field**

In `src/services/api.ts`, delete the entire `export const setCampaignAgentVisibility = async (...) => { ... };` function. In `src/types/index.ts`, delete the line `visible_to_agents?: boolean;` (line 1661).

- [ ] **Step 6: Verify build + lint**

```bash
cd /home/ubuntu/projects/old/RenoXpert-Frontend-v2.1
npm run build   # expect exit 0 — confirms no dangling references to visible_to_agents / setCampaignAgentVisibility / AgentVisibilityToggle
grep -rn "visible_to_agents\|setCampaignAgentVisibility\|AgentVisibilityToggle\|agent-visibility" src/   # expect zero hits
npx eslint src/pages/Campaign/CampaignMain.tsx src/pages/Campaign/CampaignDetail.tsx src/services/api.ts src/types/index.ts --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'   # expect no NEW errors vs baseline
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/Campaign/CampaignMain.tsx src/pages/Campaign/CampaignDetail.tsx src/services/api.ts src/types/index.ts
git commit -m "feat(agent): manage agents per campaign; remove global agent-visibility toggle

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

## Finalization (after all tasks + whole-branch review)

- **Backend:** push the branch and open a PR targeting `production` (backend is PR-protected). PR body ends with the `🤖 Generated with [Claude Code]` footer. Migration is NOT run by us — the user runs `php artisan migrate` on deploy.
- **Frontend:** merge the feature branch into `production` (`--no-ff`) and push (frontend is not PR-protected).
- **Deploy note (clean slate):** after the migration runs, `visible_to_agents` is gone and the mapping table is empty, so **every agent sees zero campaigns until staff assign them** via the Agents page ("Campaigns" button) or the Campaign detail page ("Manage agents").

## Self-Review (completed)

- **Spec coverage:** pure per-agent (Task 1 drops flag, Task 3 pivot query) ✓; both directions (Task 6 agent→campaigns, Task 7 campaign→agents) ✓; clean slate (empty table, deploy note) ✓; sync API (Task 3 `sync()`) ✓; no DB FK (Task 1) ✓; status filter retained (Task 3) ✓; staff-guarded + non-agent→422 (Task 3) ✓; orphan cleanup (Task 3 destroy detach) ✓; resources/model/types cleaned (Tasks 2, 7) ✓.
- **Type consistency:** `campaign_ids`/`user_ids` envelope keys identical across BE (Task 3) and FE (Task 4); `AssignmentItem`/`AssignmentModal` prop names identical across Tasks 5/6/7; relation pivot column order consistent (Task 2 → Task 3 queries).
- **Build-green ordering:** `setCampaignAgentVisibility` and the `visible_to_agents` type field are removed only in Task 7 (same task that removes their last usages), so every intermediate FE commit builds.
