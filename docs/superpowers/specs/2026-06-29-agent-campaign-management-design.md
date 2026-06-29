# Agent Campaign Management — Design Spec

**Date:** 2026-06-29
**Status:** Approved (design)
**Repos:** Backend `RenoXpert-Backend` (PR → `production`), Frontend `RenoXpert-Frontend-v2.1` (merge+push → `production`)

## Goal

Replace the single global "visible to agents" flag on campaigns with **per-agent campaign assignment**: staff control exactly which campaigns each agent can see. An agent sees only the campaigns assigned to them (and only while those campaigns are published/active).

## Decisions (locked)

1. **Pure per-agent — replace global.** Drop `campaigns.visible_to_agents` entirely. Visibility is determined solely by an agent↔campaign mapping. A campaign with no assignments is invisible to all agents.
2. **Manage from both directions** over one shared mapping table: agent → pick campaigns, and campaign → pick agents.
3. **Clean-slate rollout — no backfill.** After deploy, the mapping table is empty, so agents see no campaigns until staff assign them. This is called out in the deploy notes.
4. **Sync-style API** — each management endpoint replaces the full set (idempotent), matching a multi-select checklist UI.

## Architecture

### Data model

New table **`agent_campaign_visibility`** (authored Laravel migration, **no DB-level foreign keys** — per the hand-managed-table convention; plain columns + indexes):

| Column | Type | Notes |
|---|---|---|
| `id` | bigIncrements | PK |
| `user_id` | unsignedBigInteger | the agent (`users.id`, `type='agent'`) — indexed |
| `campaign_id` | unsignedBigInteger | `campaigns.id` — indexed |
| `created_at` / `updated_at` | timestamps | |

Constraints: **unique composite (`user_id`, `campaign_id`)** to prevent duplicate assignments; separate index on each column for the two read directions.

The same migration **drops `campaigns.visible_to_agents`**; its `down()` re-adds the boolean (default false) so the migration is reversible.

### Eloquent relations

- `User::visibleCampaigns()` — `belongsToMany(Campaign, 'agent_campaign_visibility', 'user_id', 'campaign_id')->withTimestamps()`.
- `Campaign::visibleToAgents()` — `belongsToMany(User, 'agent_campaign_visibility', 'campaign_id', 'user_id')->withTimestamps()`.

(belongsToMany works on column names; it does not require DB FKs.)

### Backend endpoints

All staff endpoints reuse the existing guard `in_array($caller->type, ['staff','admin','super-admin','owner'])` (agent token → 403; agents cannot self-assign).

**Rewrite** `CampaignController@agentCampaigns` (`GET agent/campaigns`, agent-guarded, unchanged auth gates: type=agent + status active + agent_approved_at):
- Return campaigns assigned to **the calling agent** via the pivot **AND** `status IN ('published','active')`. The status filter stays so an assigned draft never leaks.
- Query: `$request->user()->visibleCampaigns()->whereIn('status', ['published','active'])->orderByDesc('id')->get()` → `AgentCampaignResource::collection`.

**Remove** `CampaignController@setAgentVisibility` and route `PATCH campaigns/{id}/agent-visibility`.

**New staff endpoints:**
- `GET admin/agents/{id}/campaigns` → `{ campaign_ids: number[] }` for that agent (404 if the user isn't an agent).
- `PUT admin/agents/{id}/campaigns` body `{ campaign_ids: number[] }` → validates the target user is `type='agent'`; validates each id exists in `campaigns`; **syncs** the agent's set (`$agent->visibleCampaigns()->sync($ids)`). Returns the resulting `campaign_ids`.
- `GET admin/campaigns/{id}/agents` → `{ user_ids: number[] }` for that campaign (404 if campaign missing).
- `PUT admin/campaigns/{id}/agents` body `{ user_ids: number[] }` → validates each id is a `type='agent'` user (reject non-agents with 422); **syncs** the campaign's agent set. Returns the resulting `user_ids`.

Placement: agent↔campaign management endpoints live in `CampaignController` (both deal with campaign/agent mapping); they are registered under the existing authenticated route group alongside the other `admin/agents/*` routes.

**Remove `visible_to_agents`** from: `Campaign::$fillable` + `$casts` (`app/Models/Campaign.php:31,39`), `CampaignResource` (`:47`), `CampaignListResource` (`:40`).

### Frontend — staff

**Agents page** `src/pages/User/AgentsMain.tsx`:
- Add a **"Manage campaigns"** action per agent row → opens a modal listing all campaigns with their status; checkboxes reflect the agent's current assignments (loaded via `GET admin/agents/{id}/campaigns`). Save → `PUT admin/agents/{id}/campaigns`.

**Campaign edit/detail** `src/pages/Campaign/CampaignDetail.tsx`:
- Remove the existing global agent-visibility toggle (`setAgentVisible` at `:437`).
- Add a **"Manage agents"** panel → lists agents (reuse the admin agents list) with checkboxes reflecting `GET admin/campaigns/{id}/agents`. Save → `PUT admin/campaigns/{id}/agents`.

**Campaign list** `src/pages/Campaign/CampaignMain.tsx`:
- Remove the per-row global agent-visibility toggle (`:42`, `:174`).

**API client** `src/services/api.ts`:
- Remove the `agent-visibility` PATCH call (`:3252`).
- Add: `getAgentCampaignIds(agentId)`, `setAgentCampaignIds(agentId, campaignIds)`, `getCampaignAgentIds(campaignId)`, `setCampaignAgentIds(campaignId, userIds)`.

**Types** `src/types/index.ts`:
- Remove `visible_to_agents?: boolean` from the Campaign type (`:1661`).

### Frontend — agent portal

No change. `AgentHome` already calls `getAgentCampaigns()`; it now simply returns the per-agent set.

## Error handling & edge cases

- **Orphan pivot rows** (campaign or agent later deleted): never surface, because both read queries join back to live `campaigns` (status-filtered) / agent `users`. Additionally, the campaign-delete path cleans up its pivot rows defensively.
- **Pending/inactive agents** remain assignable; the existing agent-side gate (status active + `agent_approved_at`) blocks their access regardless, so assignment is independent of approval state.
- **Non-agent user ids** in `PUT campaigns/{id}/agents` → 422 (only `type='agent'` users may be assigned).
- **Sync semantics:** passing an empty array clears all assignments for that agent/campaign. This is the intended "remove everything" path.

## Rollout / deploy notes

- Run the migration (drops `visible_to_agents`, creates the empty mapping table).
- **Clean slate:** every agent sees zero campaigns until staff assign them via the new UI. Communicate this so staff re-assign promptly after deploy.
- Backend ships as a PR to `production`; frontend is merge+push to `production`.

## Out of scope (YAGNI)

- Bulk "assign this campaign to ALL agents" shortcut (can be added later if the checklist proves tedious).
- Audit log of who changed which assignment.
- Agent-visible categorization/tagging beyond the simple assignment.

## Verification

- **Frontend:** `npm run build` (exit 0) + scoped eslint (0 errors on touched files).
- **Backend:** manual review (no PHP/DB in the working environment); migration reviewed for the no-DB-FK convention and reversible `down()`.
- **Process:** ultracode Workflow — per task `implement → 2 adversarial review lenses → fix loop → whole-branch review`; controllers extend `BaseController`; never run `php artisan migrate` (user runs it).

## Affected files (reference)

**Backend:** `database/migrations/<new>_create_agent_campaign_visibility_and_drop_visible_to_agents.php` (new), `app/Models/Campaign.php`, `app/Models/User.php`, `app/Http/Controllers/CampaignController.php`, `app/Http/Resources/CampaignResource.php`, `app/Http/Resources/List/CampaignListResource.php`, `routes/api.php`.

**Frontend:** `src/services/api.ts`, `src/types/index.ts`, `src/pages/User/AgentsMain.tsx`, `src/pages/Campaign/CampaignDetail.tsx`, `src/pages/Campaign/CampaignMain.tsx` (+ a small reusable assignment-modal component).
