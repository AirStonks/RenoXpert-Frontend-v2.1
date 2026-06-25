# Campaign Visibility to Agents — Design Spec (Agent Campaign, Sub-project 3 of 5)

- **Date:** 2026-06-25
- **Status:** Approved — proceeding to plan
- **Repos:** Backend `RenoXpert-Backend` (deploys from `production`, PR-protected) + Frontend `RenoXpert-Frontend-v2.1` (deploys from `production`, merge+push)
- **Part of:** Agent Campaign (SP1 ✅, SP2 ✅; SP4 agent Google auth, SP5 agent portal pending).

## 1. Goal

Let staff control which campaigns are visible to agents: a `visible_to_agents` boolean on campaigns, **hidden by default**, toggled by staff via a **quick switch** in the admin campaign list and detail. The agent-facing list that consumes this flag is **SP5** — SP3 only creates the flag, exposes it to admin, and makes it toggleable.

## 2. Decisions (locked)

- Default: **`false`** (hidden; opt-in). Existing campaigns backfill to false.
- Toggle: **quick switch** in the admin campaign **list** + **detail**, via a **dedicated lightweight endpoint** (avoids the heavy `updateCampaign` FormData path).

## 3. Scope

- **Backend:** `campaigns.visible_to_agents` column + model + admin resources + a toggle endpoint.
- **Frontend (admin):** an API fn + toggle switches in the campaign list and detail + the `Campaign` type field.
- **Out of scope:** the agent-facing campaign list/endpoint that filters on the flag (SP5); agent identity/auth (SP4); exposing the flag on the public customer site.

## 4. Backend — `RenoXpert-Backend`

- **Migration (authored; `campaigns` is a hand-managed base table → `Schema::table` ALTER; user runs it):** add `visible_to_agents` `boolean NOT NULL default false` (additive; existing rows default to false). `down()` drops the column. No FK/index needed.
- **`Campaign` model:** add `'visible_to_agents'` to `$fillable`; add `'visible_to_agents' => 'boolean'` to `$casts`.
- **Resources:** add `'visible_to_agents' => $this->visible_to_agents` to `app/Http/Resources/List/CampaignListResource.php` (admin list — needed for the toggle state) **and** `app/Http/Resources/CampaignResource.php` (admin detail). **Do NOT** add it to the public `app/Http/Resources/Campaign/CampaignResource.php`.
- **Endpoint:** `PATCH campaigns/{id}/agent-visibility` (authenticated/staff group), `CampaignController@setAgentVisibility`. Body: `{ visible_to_agents: boolean }` (validated `required|boolean`). Loads the campaign (404 if missing), sets only that column, saves, returns the updated `CampaignResource`. Uses `BaseController` `sendResponse`/`sendError` (CampaignController already extends BaseController). It does NOT touch packages/layout types/other fields (lightweight, distinct from `update`).

## 5. Frontend (admin) — `RenoXpert-Frontend-v2.1`

- **`services/api.ts`:** `setCampaignAgentVisibility(id, visible: boolean)` → `PATCH {API_URL}campaigns/${id}/agent-visibility` with `{ visible_to_agents: visible }` and auth headers; returns `response.data`.
- **`Campaign` type** (`src/types`): add `visible_to_agents?: boolean`.
- **Admin list** (`src/pages/Campaign/CampaignMain.tsx`): per campaign row, a small toggle switch labelled e.g. "Agents" bound to `campaign.visible_to_agents`; on change call `setCampaignAgentVisibility(id, next)`, optimistically update local state (and revert + error toast on failure), success toast otherwise.
- **Admin detail** (`src/pages/Campaign/CampaignDetail.tsx`): the same toggle in the header area, bound to the loaded campaign's flag, calling the same API + refetch/update.
- Reuse existing toast (`react-toastify`) and styling patterns (a Tailwind switch consistent with the codebase). No new dependency.

## 6. Constraints

- Backend schema: `campaigns` hand-managed → authored additive ALTER; **NEVER run `php artisan migrate`** (user runs it). `php` CLI unavailable → manual review. New controller code uses `BaseController` helpers.
- Both repos deploy from **`production`**: backend **PR to `production`**, frontend **merge+push**.
- **No new npm deps.** **FE gate:** `npm run build` exit 0 + scoped eslint no new errors (`api.ts` baseline 17; `CampaignMain.tsx`, `CampaignDetail.tsx`, `types/index.ts` at their current baselines). No test runner.
- **Graceful:** until the migration runs, the flag reads as undefined/false; the toggle simply reflects/sets false.

## 7. Verification

- **Backend:** manual review — migration additive boolean default false; model fillable + boolean cast; flag in `CampaignListResource` + `CampaignResource` (NOT the public one); endpoint validates boolean, updates only the column, returns the resource, in the auth group.
- **Frontend:** build exit 0; eslint no new errors.
- **Manual QA (after migrate + deploy):** every existing campaign shows the toggle OFF; toggling ON in the list persists (reload shows ON) and reflects on the detail page (and vice-versa); a failed toggle reverts with an error toast; the public customer campaign pages are unaffected.

## 8. Risks & mitigations

- **Heavy `updateCampaign` misuse** → a dedicated `setAgentVisibility` endpoint touches only the one column (no package/layout rebuild).
- **Optimistic UI desync** → revert local state + error toast on API failure.
- **Hand-managed table** → authored additive ALTER (boolean default false), consistent with prior campaign-column migrations; never rebuild the table.

## 9. Non-goals

No agent-facing list/filtering (SP5); no agent auth (SP4); no per-agent visibility (it's a single global "visible to all agents" flag); no public-site exposure of the flag; no change to `status`/`published_at` semantics.

## 10. Suggested plan tasks

1. **BE:** migration + model + both admin resources + `setAgentVisibility` endpoint + route.
2. **FE:** `setCampaignAgentVisibility` API + `Campaign` type + toggle in `CampaignMain` (list) + toggle in `CampaignDetail`.
3. **Verify + finalize:** FE build/eslint, BE manual review; BE PR to `production`; FE merge+push.
