# Campaign Visibility to Agents Implementation Plan (Agent Campaign SP3/5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `visible_to_agents` boolean on campaigns (hidden by default), toggled by staff via a quick switch in the admin campaign list and detail.

**Architecture:** Backend adds the column (authored ALTER on the hand-managed `campaigns` table), exposes it in the two admin resources, and adds a lightweight `PATCH campaigns/{id}/agent-visibility` endpoint. Frontend adds an API fn + toggle switches in the list and detail. The agent-facing list that filters on this flag is SP5.

**Tech Stack:** Laravel 11 (`BaseController`); React 18 + TS + Vite + Tailwind. No new deps.

## Global Constraints

- Backend: `campaigns` is a **hand-managed** base table → authored additive `Schema::table` ALTER. **NEVER run `php artisan migrate`** (user runs it). `php` CLI unavailable → manual review. New controller code uses `BaseController` `sendResponse`/`sendError` (CampaignController already extends it).
- Both repos deploy from **`production`**: backend **PR to `production`**, frontend **merge+push**. BE branch `feature/campaign-agent-visibility` off `origin/production`; FE branch `feature/campaign-agent-visibility` off `production`.
- No new npm deps. **FE gate:** `npm run build` exit 0 + scoped eslint no NEW errors (baselines: `api.ts` 17, `CampaignMain.tsx` 0, `CampaignDetail.tsx` 0, `types/index.ts` 0). No test runner.
- Default `false` (hidden / opt-in). Flag exposed in admin resources only — NOT the public `Campaign/CampaignResource`.
- **Commit trailers** on every commit:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS
  ```

---

### Task 1 (BE): visible_to_agents column + toggle endpoint

**Repo/branch:** `RenoXpert-Backend`, `feature/campaign-agent-visibility` (off `origin/production`).

**Files:**
- Create: `database/migrations/2026_06_25_000200_add_visible_to_agents_to_campaigns_table.php`
- Modify: `app/Models/Campaign.php` (`$fillable` + `$casts`)
- Modify: `app/Http/Resources/List/CampaignListResource.php`, `app/Http/Resources/CampaignResource.php`
- Modify: `app/Http/Controllers/CampaignController.php` (add `setAgentVisibility`)
- Modify: `routes/api.php` (one PATCH route in the auth group)

**Interfaces:**
- Produces: `campaigns.visible_to_agents` (bool) on admin resources; `PATCH campaigns/{id}/agent-visibility`.

- [ ] **Step 1: Migration**

Create `database/migrations/2026_06_25_000200_add_visible_to_agents_to_campaigns_table.php`:
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->boolean('visible_to_agents')->default(false)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropColumn('visible_to_agents');
        });
    }
};
```

- [ ] **Step 2: Model fillable + cast**

In `app/Models/Campaign.php`: add `'visible_to_agents',` to `$fillable` (e.g. after `'status',`); add `'visible_to_agents' => 'boolean',` to `$casts`.

- [ ] **Step 3: Expose in the two admin resources**

In `app/Http/Resources/List/CampaignListResource.php`, add after the `'status' => $this->status,` line:
```php
            'visible_to_agents' => $this->visible_to_agents,
```
Add the identical line after `'status' => $this->status,` in `app/Http/Resources/CampaignResource.php`. **Do NOT** modify `app/Http/Resources/Campaign/CampaignResource.php` (public).

- [ ] **Step 4: `setAgentVisibility` controller method**

In `app/Http/Controllers/CampaignController.php`, add (e.g. after `update`). (`Campaign`, `Validator`, and `CampaignResource` are already imported.)
```php
    public function setAgentVisibility(Request $request, $id)
    {
        $campaign = Campaign::find($id);
        if (is_null($campaign)) {
            return $this->sendError('Campaign not found.');
        }

        $validator = Validator::make($request->all(), [
            'visible_to_agents' => 'required|boolean',
        ]);
        if ($validator->fails()) {
            return $this->sendError('Validation Error.', $validator->errors(), 422);
        }

        $campaign->visible_to_agents = $request->boolean('visible_to_agents');
        $campaign->save();

        return $this->sendResponse(new CampaignResource($campaign), 'Campaign agent visibility updated.');
    }
```

- [ ] **Step 5: Route**

In `routes/api.php`, in the authenticated group next to the other `campaigns/...` routes (line ~321-323), add:
```php
    Route::patch('campaigns/{id}/agent-visibility', [CampaignController::class, 'setAgentVisibility']);
```

- [ ] **Step 6: Manual review (no `php` CLI)**

Confirm: migration additive boolean default false; model fillable + boolean cast; flag added to `CampaignListResource` + `CampaignResource` only (NOT the public one); endpoint validates boolean, updates only the column, returns the resource; route in the auth group. NEVER run migrate.

- [ ] **Step 7: Commit**

```bash
git add database/migrations/2026_06_25_000200_add_visible_to_agents_to_campaigns_table.php app/Models/Campaign.php app/Http/Resources/List/CampaignListResource.php app/Http/Resources/CampaignResource.php app/Http/Controllers/CampaignController.php routes/api.php
git commit -m "feat(agent): campaign visible_to_agents flag + staff toggle endpoint

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 2 (FE): API + toggle switches (list + detail)

**Repo/branch:** `RenoXpert-Frontend-v2.1`, `feature/campaign-agent-visibility` (off `production`).

**Files:**
- Modify: `src/services/api.ts` (`setCampaignAgentVisibility`)
- Modify: `src/types/index.ts` (`Campaign.visible_to_agents`)
- Modify: `src/pages/Campaign/CampaignMain.tsx` (toggle per row)
- Modify: `src/pages/Campaign/CampaignDetail.tsx` (toggle in header)

**Interfaces:**
- Consumes: Task 1 endpoint + resource field.
- Produces: `setCampaignAgentVisibility(id, visible)`.

- [ ] **Step 1: API function**

In `src/services/api.ts` (near the other campaign fns), add:
```ts
export const setCampaignAgentVisibility = async (id: string | number, visible: boolean) => {
    try {
        const response = await axios.patch(API_URL + `campaigns/${id}/agent-visibility`, { visible_to_agents: visible }, { headers: getAuthHeaders() });
        return response.data;
    } catch (error) {
        handle401Error(error as AxiosError);
    }
};
```

- [ ] **Step 2: Type field**

In `src/types/index.ts`, in the `Campaign` interface, add:
```ts
    visible_to_agents?: boolean;
```

- [ ] **Step 3: Toggle in the admin list (`CampaignMain.tsx`)**

The list renders rows via `campaigns.map((campaign) => (...<tr>...))` (~line 284), with `campaigns` held in component state. Add an "Agents" column: a header `<th>Agents</th>` in the table head, and a cell `<td>` in each row containing a toggle switch bound to `campaign.visible_to_agents`. On change:
- import `setCampaignAgentVisibility` from `../../services/api` and `toast` from `react-toastify` (if not already imported).
- optimistic update: immediately set the row's `visible_to_agents` in local state; call `await setCampaignAgentVisibility(campaign.id, next)`; if the result indicates failure (falsy / `success === false`), revert the local state and `toast.error(...)`; else `toast.success('Agent visibility updated.')`.

Concrete switch (a small controlled Tailwind toggle; define a local `AgentVisibilityToggle` in the file or inline):
```tsx
const AgentVisibilityToggle = ({ campaign, onChanged }: { campaign: Campaign; onChanged: (id: number, v: boolean) => void }) => {
    const [busy, setBusy] = useState(false);
    const on = !!campaign.visible_to_agents;
    const toggle = async () => {
        if (busy) return;
        setBusy(true);
        const next = !on;
        onChanged(campaign.id!, next); // optimistic
        try {
            const res = await setCampaignAgentVisibility(campaign.id!, next);
            if (res && res.success === false) { onChanged(campaign.id!, on); toast.error(res.message || 'Failed to update agent visibility.'); }
            else { toast.success('Agent visibility updated.'); }
        } catch {
            onChanged(campaign.id!, on); toast.error('Failed to update agent visibility.');
        } finally { setBusy(false); }
    };
    return (
        <button type="button" onClick={toggle} disabled={busy} aria-pressed={on}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? 'bg-green-500' : 'bg-gray-300'} disabled:opacity-50`}>
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
    );
};
```
Wire `onChanged` to update the `campaigns` state array (set that campaign's `visible_to_agents`). Render `<AgentVisibilityToggle campaign={campaign} onChanged={updateRowVisibility} />` in the new cell. (If `campaigns` comes from a fetch hook without a setter, mirror it into a local `useState` that seeds from the fetched list, or expose a setter — keep it minimal and type-safe, no `any`.)

- [ ] **Step 4: Toggle on the detail page (`CampaignDetail.tsx`)**

In the campaign detail header (near the title / "Copy Referral Link" button), add the same toggle bound to the loaded `campaign.visible_to_agents` with a label "Visible to agents". On change call `setCampaignAgentVisibility(campaign.id, next)`; update the local campaign state (or refetch) and toast. Reuse the same switch markup as Step 3 (you may extract a shared tiny component, but a second inline instance is acceptable for SP3).

- [ ] **Step 5: Build + lint**

Run: `npm run build` → exit 0.
Run: `npx eslint src/services/api.ts src/types/index.ts src/pages/Campaign/CampaignMain.tsx src/pages/Campaign/CampaignDetail.tsx --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'` → `api.ts` 17, others 0 → combined `17`. Fix any new error.

- [ ] **Step 6: Commit**

```bash
git add src/services/api.ts src/types/index.ts src/pages/Campaign/CampaignMain.tsx src/pages/Campaign/CampaignDetail.tsx
git commit -m "feat(agent): staff toggle for campaign agent-visibility (list + detail)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 3: Verify + finalize

- [ ] **Step 1: FE build + scoped lint**

```bash
cd RenoXpert-Frontend-v2.1
npm run build   # exit 0
for f in src/services/api.ts src/types/index.ts src/pages/Campaign/CampaignMain.tsx src/pages/Campaign/CampaignDetail.tsx; do
  echo "$f: $(npx eslint "$f" --ext ts,tsx --format unix 2>/dev/null | grep -c ':[0-9]*:[0-9]*:')"
done
```
Expected: api.ts 17; types/index.ts 0; CampaignMain.tsx 0; CampaignDetail.tsx 0.

- [ ] **Step 2: BE manual review**

Re-read the BE diff: additive boolean default false; model fillable+cast; flag in `CampaignListResource` + `CampaignResource` (not public); endpoint validates boolean + updates only the column + returns resource; route in auth group. No `php artisan` run.

- [ ] **Step 3: Finalize backend (PR to production)**

```bash
cd RenoXpert-Backend
git push -u origin feature/campaign-agent-visibility
gh pr create --base production --head feature/campaign-agent-visibility \
  --title "feat(agent): campaign visible_to_agents flag + staff toggle (SP3)" \
  --body "<summary; run php artisan migrate after merge (adds campaigns.visible_to_agents boolean default false); 🤖 Generated with [Claude Code](https://claude.com/claude-code)>"
```

- [ ] **Step 4: Finalize frontend (merge+push)**

```bash
cd RenoXpert-Frontend-v2.1
git checkout production && git pull --ff-only
git merge --ff-only feature/campaign-agent-visibility
npm run build   # exit 0 gate
git branch -d feature/campaign-agent-visibility
git push origin production
```

- [ ] **Step 5: Hand off manual QA**

Report to the user (after merge + migrate): existing campaigns show the toggle OFF; toggling ON in the list persists on reload and reflects on the detail page (and vice-versa); a failed toggle reverts with an error toast; public customer pages unaffected.

---

## Self-Review

**Spec coverage:** §4 BE (migration + model + 2 admin resources + endpoint + route) → Task 1 ✅; §5 FE (API + type + list toggle + detail toggle) → Task 2 ✅; §6/§7 constraints + verify → Global Constraints + Task 3 ✅.

**Placeholder scan:** No TBD/TODO. The BE PR body `<...>` is a compose-at-finalize instruction. The Step-3 "if campaigns comes from a fetch hook without a setter" guidance is a bounded, type-safe instruction (no `any`), not a blank.

**Type consistency:** `visible_to_agents` boolean across migration/model/resources/type; `setCampaignAgentVisibility(id, visible: boolean)` body `{ visible_to_agents }` matches the endpoint validation `required|boolean` and route `PATCH campaigns/{id}/agent-visibility`; `AgentVisibilityToggle` reads `campaign.visible_to_agents`. ✅
