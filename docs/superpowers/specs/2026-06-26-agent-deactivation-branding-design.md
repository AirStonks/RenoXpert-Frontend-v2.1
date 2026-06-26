# Agent Rejection/Deactivation + Portal Branding — Design Spec

- **Date:** 2026-06-26
- **Status:** Proposed — awaiting user review before implementation planning
- **Repos:** Backend `RenoXpert-Backend` (deploys from `production`, PR-protected) + Frontend `RenoXpert-Frontend-v2.1` (deploys from `production`, merge+push)
- **Builds on:** the agent feature + approval gate (`agent_approved_at`, admin Agents page, staff-guarded admin endpoints). Agents = `users.type='agent'`.

## 0. Items

- **A — Rejection / deactivation:** staff can set an agent active/inactive; reject (pending), deactivate (approved), and reactivate, all via a single `status` toggle.
- **B — Branding:** the RenoXpert logo + "Agent Portal" on every agent page.

## 1. Decisions (locked)

- **A:** a single `status='inactive'` value (no separate "rejected"); **Reject** (pending) and **Deactivate** (approved) both set `inactive`; **Reactivate** sets `active`. Reuses the existing login active-gate. No migration (the `status` column exists).
- **B:** logo (`/app/RenoExpert_logo-01.svg`) + "Agent Portal" on **all** agent pages (login, onboarding, pending screen, portal header, dashboard header).

## 2. Scope

- **Backend:** a staff-guarded `POST /admin/agents/{id}/status` endpoint; a `status==='active'` guard on the agent self-service endpoints.
- **Frontend:** admin Agents page state-aware actions + `setAgentStatus` API; agent pages get the brand + a deactivated-status sign-out.
- **Out of scope:** a distinct "rejected" state; agent re-application emails; bulk actions; editing other agent fields; any non-agent user management.

## 3. A — Rejection / deactivation

### Backend
- **`UserController@setAgentStatus(Request, $id)`** (`auth:sanctum`): **staff-guard** `in_array($caller->type, ['staff','admin','super-admin','owner'])` → 403 otherwise. Validate `status` `required|in:active,inactive`. Load `User::where('id',$id)->where('type','agent')->first()` (404 if none). Set `status` and save. Return `UserResource`. (`status` is already in `$fillable`, but set it explicitly via `$agent->status = ...` to stay consistent with the other agent writes; `agent_approved_at` is untouched.)
- **Route:** `POST /admin/agents/{id}/status → UserController@setAgentStatus` in the `auth:sanctum` group (next to the other `admin/agents` routes).
- **Agent self-service status guard:** in `CampaignController@agentCampaigns` and `AgentAuthController@referrals`, add (after the `type==='agent'` guard, before the approval gate): `if ($user->status !== 'active') return $this->sendError('Your agent account is not active.', [], 403);`. This way a deactivated agent with a still-valid token loses portal access immediately. (The login flow already 403s a non-active agent.)

### Frontend (admin `AgentsMain`)
- `services/api.ts`: `setAgentStatus(id, status: 'active' | 'inactive')` → `POST admin/agents/{id}/status` with the staff `token`.
- Per-row, state-aware actions (derive from `agent_approved_at` + `status`):
  - **Pending** (`!agent_approved_at && status==='active'`): **Approve** (existing) + **Reject** (`setAgentStatus(id,'inactive')`).
  - **Approved & active** (`agent_approved_at && status==='active'`): **Deactivate** (`setAgentStatus(id,'inactive')`).
  - **Inactive** (`status!=='active'`): **Reactivate** (`setAgentStatus(id,'active')`).
- Show two badges: approval (Approved/Pending) and status (Active/Inactive). All actions: busy state, refresh on success, error toast on failure (incl. `res.success===false`). A confirm prompt on Reject/Deactivate (destructive) is acceptable but optional.

### Frontend (agent side)
- `getAgentUser` already returns `status`. In `AgentHome` and `AgentDashboard`, after loading the user: if `status !== 'active'`, show a brief "Your account has been deactivated. Please contact RenoXpert." then sign out (clear `a_token` + go to login). (Belt-and-suspenders with the BE 403s.)

## 4. B — Branding

- **New** `src/pages/AgentPages/AgentBrand.tsx` — a small presentational component: `<img src="/app/RenoExpert_logo-01.svg" alt="RenoXpert" className="h-7 w-auto" />` + a "Agent Portal" label (prop to show/hide the label; optional `className`). The logo lives in `public/app/` → served at `/app/...` on the agent domain too.
- Use it:
  - `AgentLogin`, `AgentOnboarding`, and the **pending screen** (in `AgentHome`): above the card title (logo centered).
  - `AgentHome` + `AgentDashboard` headers: replace the plain `"Agent Portal"` text span with `<AgentBrand />` (logo + label).

## 5. Constraints

- **No migration** (reuses `status`). **No new npm deps.** Backend endpoints use `BaseController` + the §3 staff guard. `php` CLI unavailable → BE manual review.
- Both repos deploy from **`production`**: backend **PR to `production`**, frontend **merge+push**.
- **FE gate:** `npm run build` exit 0 + scoped eslint no new errors; new files clean; no `any`. No test runner.
- **Security:** the status endpoint is staff-guarded exactly like the approve endpoint (agent token → 403, can't deactivate/reactivate anyone).

## 6. Verification

- **Backend:** manual review — `setAgentStatus` staff-guarded + `in:active,inactive` + `type='agent'` only + sets status; agentCampaigns + referrals reject non-active (403); approve endpoint unchanged.
- **Frontend:** build exit 0; eslint clean; no `any`.
- **Manual QA (after deploy):** in admin Agents, a pending agent shows Approve + **Reject**; rejecting sets Inactive and the agent can no longer log in; an approved agent shows **Deactivate** → Inactive; an inactive agent shows **Reactivate** → Active (and regains access; if still unapproved, lands back on the pending screen); a deactivated agent currently in the portal is signed out on next load; the agent token still cannot call `/admin/agents/{id}/status` (403). Branding: the RenoXpert logo + "Agent Portal" appear on login, onboarding, pending, portal, and dashboard.

## 7. Risks & mitigations

- **Deactivated agent with a live token** → the agent endpoints now check `status==='active'` (403) AND the FE signs out on a non-active status; the login gate blocks re-auth.
- **Agent self-deactivating others** → status endpoint is staff-guarded (agent → 403), mirroring approve.
- **Reactivate semantics** → reactivating restores `status='active'`; `agent_approved_at` is unchanged, so a never-approved agent returns to the pending screen (correct), an approved one regains full access.
- **Logo path on the agent domain** → `/app/RenoExpert_logo-01.svg` is a static public asset served on every domain by the same build (verified present in `public/app/`).

## 8. Non-goals

No distinct "rejected" status; no approval/deactivation emails; no bulk approve/reject; no agent profile editing by staff; no audit log of status changes; no change to non-agent user management.

## 9. Suggested plan tasks

1. **BE:** `setAgentStatus` endpoint + route + `status==='active'` guard on `agentCampaigns` and `referrals`.
2. **FE admin:** `setAgentStatus` API + AgentsMain state-aware actions (Reject/Deactivate/Reactivate) + status badge.
3. **FE agent:** `AgentBrand` component + brand on all agent pages + deactivated-status sign-out in AgentHome/AgentDashboard.
4. **Verify + finalize:** FE build/eslint, BE manual review; BE PR to `production`; FE merge+push.
