# Agent Portal — Design Spec (Agent Campaign, Sub-project 5 of 5 — FINAL)

- **Date:** 2026-06-26
- **Status:** Approved — proceeding to plan
- **Repos:** Backend `RenoXpert-Backend` (deploys from `production`, PR-protected) + Frontend `RenoXpert-Frontend-v2.1` (deploys from `production`, merge+push)
- **Builds on:** SP1 (per-user `referral_code`), SP2 (`buildReferralLink` + `?ref` capture/cookie + booking stamping), SP3 (`campaigns.visible_to_agents`), SP4 (agent Google auth + onboarding + the gated agent area). Agents = `users.type='agent'`.

## 1. Goal

Turn the gated placeholder `AgentHome` into the real **agent portal**: a logged-in agent sees the campaigns staff made visible to agents, and for each can **copy their referral link** (the public campaign URL with the agent's `?ref=<code>`) or **preview** it. This completes the loop: agent shares link → customer books with `?ref` → booking's referrer is the agent (SP2). Also fixes the agent area's full-width/centering issue (same ancestor-layout cause as the login page).

## 2. Decisions (locked)

- **Card content:** thumbnail + title + **Copy referral link** + **Preview ↗** (opens the public campaign with the agent's `?ref` in a new tab).
- **Which campaigns:** `visible_to_agents = true` **AND** `status IN ('published','active')` (hide drafts/unpublished). Confirmed live status is `published` (BE sets it); `active` also included.

## 3. Scope

- **Backend:** a slim `AgentCampaignResource`; `CampaignController@agentCampaigns` (auth, agent-guarded); `GET /agent/campaigns` route.
- **Frontend:** `getAgentCampaigns()` in `agentApi`; `getCampaignBaseUrl()` in the referral util; rebuild `AgentHome` into the portal (header + referral-code strip + responsive campaign grid with copy/preview) with an ancestor-proof full-viewport responsive layout.
- **Out of scope:** agent referral earnings/commission/reporting; agent profile editing beyond SP4 onboarding; per-campaign agent analytics; admin agent-management UI; pagination/search in the portal (show all visible — small list expected).

## 4. Backend — `RenoXpert-Backend`

- **`app/Http/Resources/AgentCampaignResource.php` (new):**
  ```php
  return [
      'id' => $this->id,
      'title' => $this->title,
      'slug' => $this->slug,
      'thumbnail' => $this->thumbnail,
      'booking_amount' => $this->booking_amount,
      'start_date' => $this->start_date,
      'end_date' => $this->end_date,
  ];
  ```
- **`CampaignController@agentCampaigns(Request $request)`:** guard `if ($request->user()?->type !== 'agent') return $this->sendError('Forbidden.', [], 403);`. Query `Campaign::where('visible_to_agents', true)->whereIn('status', ['published', 'active'])->orderByDesc('id')->get()`. Return `sendResponse(AgentCampaignResource::collection($campaigns), 'Agent campaigns retrieved.')`. Uses `BaseController`.
- **Route:** `GET /agent/campaigns → CampaignController@agentCampaigns` inside the `auth:sanctum` group.

## 5. Frontend — `RenoXpert-Frontend-v2.1`

- **`src/services/agentApi.ts`:** add `getAgentCampaigns()` → `GET {API_URL}agent/campaigns` with `getAgentAuthHeaders()`; returns the list (`response.data?.data ?? response.data`). Add an `AgentCampaign` interface `{ id; title; slug; thumbnail?: { file_url?: string } | null; booking_amount?: number | null; start_date?: string | null; end_date?: string | null }`.
- **`src/utils/referral.ts`:** add `getCampaignBaseUrl(): string` mirroring the env logic in `CampaignDetail.tsx`'s `CAMPAIGN_URL` (`VITE_CAMPAIGN_URL` / `VITE_STAGING_CAMPAIGN_URL` / `localhost:5173/campaign/`). Reused with the existing `buildReferralLink(base, slug, code)`.
- **Rebuild `src/pages/AgentPages/AgentHome.tsx`** into the portal:
  - **Layout fix:** ancestor-proof full-viewport shell — `fixed inset-0 overflow-y-auto bg-slate-50` with a sticky/normal header and an inner content container `mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-10`. (Resolves the page rendering at ~mobile width inside the Metronic/`#root: contents` body context.)
  - **Header** (full-width within the shell): "Agent Portal" + the agent's name + a **Sign out** button.
  - **Referral-code strip:** "Your referral code: `<code>`" + a Copy button (copies just the code).
  - **Campaign grid:** responsive `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6`. Each card: thumbnail (`thumbnail?.file_url`, else a placeholder block), title, and two actions: **Copy referral link** (`buildReferralLink(getCampaignBaseUrl(), slug, agent.referral_code)` → `navigator.clipboard` + a success/﹣error toast) and **Preview ↗** (anchor `target="_blank" rel="noopener"` to the same referral link).
  - **States:** loading skeleton/spinner while fetching; empty state ("No campaigns available yet.") when the list is empty; keep the SP4 redirects (no `a_token` → login; `onboarded_at == null` → onboarding) before rendering the portal.
  - On mount: `getAgentUser()` (auth + onboarding gate + the agent's `referral_code`), then `getAgentCampaigns()`.

## 6. Constraints

- **No schema change** (uses SP1/SP2/SP3 columns). **No new npm deps** (cookie/clipboard/`buildReferralLink` already exist; `@react-oauth/google` already added in SP4).
- Backend: new controller method uses `BaseController`; route under `auth:sanctum`; `php` CLI unavailable → manual review.
- Both repos deploy from **`production`**: backend **PR to `production`**, frontend **merge+push**.
- **FE gate:** `npm run build` exit 0 + scoped eslint no new errors; the rebuilt `AgentHome` + touched files clean; no `any`. No test runner.
- **Graceful:** if the agent has no `referral_code` yet (shouldn't happen — SP1 backfills + the creating hook), the copy/preview disable gracefully rather than building a `?ref=undefined` link.

## 7. Verification

- **Backend:** manual review — `agentCampaigns` guards `type==='agent'` (403), filters `visible_to_agents=true` + `status IN (published,active)`, returns the slim resource; route under auth; `AgentCampaignResource` exposes slug+thumbnail (needed for the link/card).
- **Frontend:** build exit 0; eslint clean; no `any`.
- **Manual QA (after deploy + the SP1–SP4 backend PRs merged/migrated + a campaign toggled visible_to_agents):** an onboarded agent lands on the portal full-width and centered on desktop and mobile; visible+published campaigns appear as cards; **Copy referral link** copies `https://campaign.renoxpert.my/campaigns/<slug>?ref=<agent code>`; **Preview** opens that link; a draft/unpublished or non-visible campaign does NOT appear; opening the previewed link and booking stamps that agent as the referrer (end-to-end with SP2); empty/loading states render.

## 8. Risks & mitigations

- **Width/centering regression (the reported bug)** → the portal uses the same ancestor-proof `fixed inset-0` technique that fixed the login page; verify on desktop + mobile widths.
- **Missing slug/thumbnail** → the dedicated `AgentCampaignResource` explicitly includes `slug` (the link needs it) and `thumbnail`.
- **Status-name drift** → filter is `whereIn(['published','active'])` per the confirmed live statuses; if a campaign is unexpectedly `draft` (the known EditCampaign status-demotion quirk), it simply won't list — acceptable, and out of scope to fix here.
- **`?ref=undefined`** → guard the copy/preview on a present `referral_code`.
- **Cross-portal token** → `getAgentCampaigns` uses the `a_token`; the BE guards `type==='agent'`, so a staff token can't read the agent list.

## 9. Non-goals

No commission/earnings/reporting; no agent-side booking management; no pagination/search/sort controls; no admin UI to manage agents; no change to the public campaign or booking pages; no per-campaign agent stats.

## 10. Suggested plan tasks

1. **BE:** `AgentCampaignResource` + `CampaignController@agentCampaigns` + `GET /agent/campaigns` route.
2. **FE:** `getAgentCampaigns` + `AgentCampaign` type; `getCampaignBaseUrl` util; rebuild `AgentHome` (layout fix + header + referral-code strip + campaign grid with copy/preview + states).
3. **Verify + finalize:** FE build/eslint, BE manual review; BE PR to `production`; FE merge+push.
