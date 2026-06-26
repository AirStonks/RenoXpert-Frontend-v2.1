# Agent Enhancements + Referral Dashboard — Design Spec

- **Date:** 2026-06-26
- **Status:** Proposed — awaiting user review before implementation planning
- **Repos:** Backend `RenoXpert-Backend` (deploys from `production`, PR-protected) + Frontend `RenoXpert-Frontend-v2.1` (deploys from `production`, merge+push)
- **Builds on:** the completed Agent Campaign feature (SP1–SP5). Agents = `users.type='agent'`.

## 0. Items (combined batch)

- **E1 — `country_code` normalization** (small): store agent `country_code` without a leading `+`.
- **E2 — Onboarding approval gate**: after an agent submits onboarding, they are **pending approval**; staff approve in a new admin **Agents** page before the agent gets portal access.
- **E3 — Referral dashboard**: an agent page showing their referred bookings + summary.

Order: E1 + E2 first, then E3. Combined spec/plan; built via the adversarial workflow.

## 1. Decisions (locked)

- **Approval mechanism:** a new `users.agent_approved_at` (nullable timestamp). The agent stays `status='active'` (so it can still authenticate to onboard / see a pending screen); `agent_approved_at` is the **portal gate**. (Using `status='pending'` would break login, which already 403s non-active agents.)
- **Approval UI:** a dedicated admin **Agents** page (agents listed pending-first, Approve action).
- **Dashboard rows:** campaign + date + status + amount **+ customer name** (from the booking).
- **country_code scope:** normalize on the **agent onboarding write path** + the FE default only; **no backfill** of existing rows.

## 2. Security (critical — auth is generic `auth:sanctum`, no per-type middleware)

The admin agent-management endpoints MUST be guarded to back-office users so an **agent token cannot self-approve or read other agents' PII**:
- "Staff" = `in_array($request->user()->type, ['staff','admin','super-admin','owner'])`. The admin **list** and **approve** endpoints return **403** if the caller is not staff (explicitly excludes `type='agent'`).
- Agent self-service endpoints (campaigns, referrals) guard `type==='agent'` **and** `agent_approved_at != null` (403 otherwise).

## 3. E1 — country_code normalization

- **BE** `AgentAuthController@onboarding`: `$user->country_code = ltrim(trim((string) $request->input('country_code')), '+');` (so `'+60'` → `'60'`).
- **FE** `AgentOnboarding.tsx`: default `countryCode` state to `'60'` (was `'+60'`); label stays "Code". No other change.

## 4. E2 — Onboarding approval gate

### Backend
- **Migration (managed `users`):** `agent_approved_at` nullable timestamp. `User` `$fillable` + `'agent_approved_at' => 'datetime'` cast. `UserResource` exposes `agent_approved_at`.
- **Agent portal gate:** in `CampaignController@agentCampaigns`, after the `type==='agent'` guard, add `if (is_null($request->user()->agent_approved_at)) return $this->sendError('Your agent account is pending approval.', [], 403);`. (Same gate on the E3 referrals endpoint.)
- **Admin endpoints (staff-guarded; new `AgentAdminController` or methods on `UserController`):**
  - `GET /admin/agents` — staff-guard; returns `User::where('type','agent')->orderByRaw('agent_approved_at IS NOT NULL')->orderByDesc('id')->get()` via `UserResource` (pending first). (A dedicated endpoint, NOT the generic `getUsersWithType`, so it's staff-guarded.)
  - `POST /admin/agents/{id}/approve` — staff-guard; load the user, require `type==='agent'`, set `agent_approved_at = now()`, save, return `UserResource`. Idempotent (re-approving is a no-op-ish overwrite).
  - Routes in the `auth:sanctum` group.

### Frontend
- **`agentApi`:** add `agent_approved_at?: string | null` to `AgentUser`.
- **Agent gating** (`AgentHome` + the onboarding flow): after `getAgentUser()` — `!onboarded_at` → `/onboarding`; **`onboarded_at` set but `agent_approved_at` null → a "Pending approval" screen** (a centered card: "Your account is pending approval. You'll get access once a RenoXpert admin approves it." + Sign out); `agent_approved_at` set → portal. `AgentOnboarding` submit → navigate home (home then shows the pending screen). The campaigns fetch only runs when approved.
- **Admin Agents page** (staff domain): new `src/pages/User/AgentsMain.tsx` at route `/agents` (in the staff route group + localhost mirror), with a **sidebar menu entry** "Agents". Lists agents (name, email, phone, status, Approved/Pending badge, onboarded date) pending-first; an **Approve** button per pending agent → calls the approve endpoint → refresh + toast. Staff API fns `getAdminAgents()` + `approveAgent(id)` (use the staff `token` headers).

## 5. E3 — Referral dashboard

### Backend
- **`AgentAuthController@referrals`** (`auth:sanctum`, guard `type==='agent'` + `agent_approved_at != null`): query `Booking::where('referred_by_user_id', $request->user()->id)->with('campaign')->orderByDesc('id')->get()`. Return `sendResponse([ 'summary' => [ 'total' => N, 'paid' => count(status==='paid'), 'total_amount' => sum(amount) ], 'bookings' => [ { campaign_title, customer_name (metadata.name), amount, status, date (booked_at ?? created_at) } ] ], 'Referrals retrieved.')`. (Slim, derived fields only — no raw booking internals.)
- **Route:** `GET /agent/referrals` in the `auth:sanctum` group.

### Frontend
- **`agentApi`:** `getAgentReferrals()` → `GET agent/referrals`; types for the summary + rows.
- **Dashboard page** `src/pages/AgentPages/AgentDashboard.tsx` at agent route `/dashboard` (+ localhost mirror): same full-viewport responsive shell as the portal; summary cards (Total referred · Paid · Total amount) + a responsive table/list of referred bookings (campaign, customer name, date, status pill, amount). Loading/empty/error states; same auth+onboarding+approval gates.
- **Nav:** a simple switch in the agent header between **Campaigns** (`/`) and **Dashboard** (`/dashboard`) (shared on both AgentHome + AgentDashboard).

## 6. Constraints

- One migration (`users.agent_approved_at`, additive nullable) — **authored, user runs `migrate`**. `php` CLI unavailable → BE manual review. New controllers/methods use `BaseController`; agent + admin endpoints carry the §2 guards.
- No new npm deps. Both repos deploy from **`production`**: backend **PR to `production`**, frontend **merge+push**.
- **FE gate:** `npm run build` exit 0 + scoped eslint no new errors; new files clean; no `any`. No test runner.
- **Graceful:** until `agent_approved_at` migrates, the FE reads it as undefined → every agent shows "pending" (acceptable; once migrated + approved, access opens). Note for QA: existing test agents will need approving (or a one-time manual `agent_approved_at` set) after deploy.

## 7. Verification

- **Backend:** manual review — migration additive nullable + cast + resource; agentCampaigns + referrals gate on `agent_approved_at`; admin list + approve **staff-guarded (agent token → 403)**; approve sets the timestamp for a `type='agent'` user only; referrals scoped to the caller's id; country_code `ltrim('+')`.
- **Frontend:** build exit 0; eslint clean; no `any`.
- **Manual QA (after migrate + deploy):** a new agent onboards → sees "Pending approval", the portal/dashboard are NOT accessible; staff open admin **Agents**, see the pending agent, click **Approve**; the agent (re)loads → portal + dashboard now work; the dashboard lists that agent's referred bookings with customer name + summary; an **agent token cannot** hit `/admin/agents` or `/admin/agents/{id}/approve` (403); a newly onboarded agent's `country_code` is stored as `60` (no `+`).

## 8. Risks & mitigations

- **Agent self-approval / PII exposure** (generic `auth:sanctum`) → §2 staff-guard on the admin list + approve endpoints (explicitly reject `type==='agent'`); a dedicated `/admin/agents` (not the generic users-by-type) so it's guarded.
- **Login vs approval state clash** → approval uses `agent_approved_at`, NOT `status`, so pending agents can still authenticate to onboard/see status.
- **Existing test agents locked out after deploy** → they'll show pending until approved via the new admin page (or a one-time DB set). Flagged for QA.
- **Customer PII to agents** → only the customer **name** is exposed on the dashboard (per decision); no phone/email.
- **Referrals scope** → query strictly `referred_by_user_id = caller id`; an agent can only see their own referrals.

## 9. Non-goals

- No agent **rejection/deactivation** UI (approve-only; deactivate later via `status` if needed). No email/notification on approval. No backfill of existing `country_code`. No commission/payout. No agent self-edit of profile beyond onboarding. No admin editing of agent details (just approve).

## 10. Suggested plan tasks

1. **BE-approval+country_code:** `agent_approved_at` migration + model/resource; onboarding `ltrim('+')`; agentCampaigns approval gate; admin `GET /admin/agents` + `POST /admin/agents/{id}/approve` (staff-guarded) + routes.
2. **BE-referrals:** `AgentAuthController@referrals` (agent+approved guard, summary + rows) + route + the same approval gate.
3. **FE-agent-gate:** `AgentUser.agent_approved_at`; pending-approval screen + gating in AgentHome/onboarding; country_code default `'60'`.
4. **FE-admin-agents:** `getAdminAgents`/`approveAgent` + `AgentsMain` page + `/agents` route + sidebar entry.
5. **FE-dashboard:** `getAgentReferrals` + `AgentDashboard` page + `/dashboard` route + Campaigns/Dashboard nav.
6. **Verify + finalize:** FE build/eslint, BE manual review; BE PR to `production`; FE merge+push.
