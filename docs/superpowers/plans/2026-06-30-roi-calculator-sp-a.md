# ROI Calculator — SP-A (Data model + Backend + Staff Builder) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let staff configure and persist a per-layout-type ROI Calculator (`roi_calculator` JSON on `campaign_layout_types`) via a builder section in the campaign editor, round-tripping through the API.

**Architecture:** A new `roi_calculator` JSON column on `campaign_layout_types` (additive migration, no DB FK) is exposed in the layout-type resource and accepted in the campaign create/update save path. The frontend adds a pure compute util (`roiCalculator.ts`, reused by SP-B), a self-contained `RoiBuilder` React component, and wires it into the per-layout-type editor in `EditCampaign` (read on load, edit, include in save payload).

**Tech Stack:** Laravel 11 (backend, PR → `production`), React 18 + TypeScript + Tailwind + Vite (frontend, merge+push → `production`).

## Global Constraints

- Backend API controllers MUST `extend BaseController`. Hand-managed-table convention: additive migrations, **NO DB foreign keys**.
- NEVER run `php artisan migrate` (user runs it). No PHP/DB in the working environment → backend tasks verified by **manual review**.
- **No FE test runner exists** (no `test` script / vitest / jest). Do NOT add one. Verify frontend via `npm run build` (exit 0) + scoped eslint (0 new errors vs the 17-error baseline), and a **spot-check**: the builder preview must reproduce the known Astrum A/A-c numbers — Optimized total **RM3,150**, ROI **9.0%** at 100% occupancy, SPA 420,000.
- Renovation price for payback = **`getQuotationTotal(order)`** (full quotation total) from `src/utils/quotationPricing.ts`.
- The ROI builder is wired into **`EditCampaign` only** (NOT `AddCampaign`): the package links reference persisted `campaign_packages.id`, which don't exist until the campaign+packages are first saved.
- Data shape is the validated prototype model (see `roi-demo.html` / `roi-builder-demo.html` and the design spec `docs/superpowers/specs/2026-06-30-roi-calculator-design.md`).
- Commit trailers (verbatim) on every commit:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS
  ```
- Repos: backend `/home/ubuntu/projects/old/RenoXpert-Backend`, frontend `/home/ubuntu/projects/old/RenoXpert-Frontend-v2.1`.

## File Structure

**Backend (`RenoXpert-Backend`):**
- `database/migrations/2026_06_30_000000_add_roi_calculator_to_campaign_layout_types.php` (new) — add JSON column.
- `app/Models/CampaignLayoutType.php` — `$fillable` + `$casts`.
- `app/Http/Resources/CampaignLayoutTypeResource.php` — expose `roi_calculator`.
- `app/Http/Controllers/CampaignController.php` — accept `roi_calculator` in store + update (validation + create/update arrays).

**Frontend (`RenoXpert-Frontend-v2.1`):**
- `src/types/index.ts` — `RoiRoom` + `RoiCalculator` types; add `roi_calculator` to `CampaignLayoutType`.
- `src/utils/roiCalculator.ts` (new) — pure compute util (consumed here and in SP-B).
- `src/pages/Campaign/RoiBuilder.tsx` (new) — the builder UI component.
- `src/pages/Campaign/EditCampaign.tsx` — state + load + updater + render + payload.

---

## Task A1: Migration — add `roi_calculator` JSON column

**Files:**
- Create: `RenoXpert-Backend/database/migrations/2026_06_30_000000_add_roi_calculator_to_campaign_layout_types.php`

**Interfaces:**
- Produces: nullable JSON column `campaign_layout_types.roi_calculator`.

- [ ] **Step 1: Write the migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('campaign_layout_types', function (Blueprint $table) {
            $table->json('roi_calculator')->nullable()->after('rental_projection');
        });
    }

    public function down(): void
    {
        Schema::table('campaign_layout_types', function (Blueprint $table) {
            $table->dropColumn('roi_calculator');
        });
    }
};
```

- [ ] **Step 2: Manual review**

Confirm: additive `json` column, nullable, `after('rental_projection')`; no `$table->foreign(...)`; `down()` drops the column; filename timestamp `2026_06_30_000000` sorts after the latest existing migration (`2026_06_29_000000`).

- [ ] **Step 3: Commit**

```bash
cd /home/ubuntu/projects/old/RenoXpert-Backend
git add database/migrations/2026_06_30_000000_add_roi_calculator_to_campaign_layout_types.php
git commit -m "feat(roi): add roi_calculator JSON column to campaign_layout_types

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

## Task A2: Model, resource, and save path accept `roi_calculator`

**Files:**
- Modify: `RenoXpert-Backend/app/Models/CampaignLayoutType.php`
- Modify: `RenoXpert-Backend/app/Http/Resources/CampaignLayoutTypeResource.php`
- Modify: `RenoXpert-Backend/app/Http/Controllers/CampaignController.php` (store validation ~147; store create-array ~228; update validation ~290; update update-array ~366; update create-array ~375)

**Interfaces:**
- Consumes: the JSON column from Task A1.
- Produces: `roi_calculator` persisted on create + update and returned by `CampaignLayoutTypeResource`.

- [ ] **Step 1: Model — fillable + cast**

In `app/Models/CampaignLayoutType.php`, add `'roi_calculator',` to the `$fillable` array (e.g. right after `'rental_projection',`) and add `'roi_calculator' => 'array',` to the `$casts` array.

- [ ] **Step 2: Resource — expose the field**

In `app/Http/Resources/CampaignLayoutTypeResource.php`, add to the returned array (after `'rental_projection' => $this->rental_projection,`):

```php
            'roi_calculator' => $this->roi_calculator,
```

- [ ] **Step 3: Store — validation + create array**

In `CampaignController@store`, add to the validation rules (next to `'layout_types.*.sort' => 'nullable|integer',`):

```php
                'layout_types.*.roi_calculator' => 'nullable|array',
```

And in the layout-type create call (the `$campaign->layoutTypes()->create([...])` inside the `foreach ($input['layout_types'] ...)`), add:

```php
                            'roi_calculator' => $layoutType['roi_calculator'] ?? null,
```

- [ ] **Step 4: Update — validation + both arrays**

In `CampaignController@update`, add to the validation rules (next to `'layout_types.*.sort' => 'nullable|integer',`):

```php
                'layout_types.*.roi_calculator' => 'nullable|array',
```

In the **update** branch (`$layout->update([...])`) add:

```php
                                    'roi_calculator' => $layoutType['roi_calculator'] ?? null,
```

In the **create** branch within the same sync loop (`$campaign->layoutTypes()->create([...])`) add:

```php
                                'roi_calculator' => $layoutType['roi_calculator'] ?? null,
```

> Note: we deliberately do NOT hard-validate `roi_calculator.packages.*` against `campaign_packages` server-side. On create, package ids don't exist yet; and the builder only offers this layout's saved packages. A stale/deleted package id resolves gracefully on the frontend (SP-B). This avoids a create-ordering failure.

- [ ] **Step 5: Manual review**

`grep -rn "roi_calculator" app/` should show: model (fillable + cast), resource, and `CampaignController` (1 store-validation + 1 store-create + 1 update-validation + 1 update-update + 1 update-create = 5 controller hits). Confirm `CampaignController` still `extends BaseController`.

- [ ] **Step 6: Commit**

```bash
cd /home/ubuntu/projects/old/RenoXpert-Backend
git add app/Models/CampaignLayoutType.php app/Http/Resources/CampaignLayoutTypeResource.php app/Http/Controllers/CampaignController.php
git commit -m "feat(roi): persist + expose roi_calculator on campaign layout types

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

## Task A3: Frontend types + pure compute util

**Files:**
- Modify: `RenoXpert-Frontend-v2.1/src/types/index.ts` (add types; add `roi_calculator` to `CampaignLayoutType`)
- Create: `RenoXpert-Frontend-v2.1/src/utils/roiCalculator.ts`

**Interfaces:**
- Produces:
  - `RoiRoom`, `RoiCalculator` types.
  - `roomRange(room, spread): [number, number]`
  - `hasPartition(model): boolean`
  - `scenarioMonthlyRange(model, scenario: 'whole'|'co'|'opt', occupancyPct): [number, number]`
  - `roiPercent(monthly, spa): number`, `annual(monthly): number`
  - `paybackMonths(renovationPrice, selectedMonthly, wholeMonthly): number | null`

- [ ] **Step 1: Add the types**

In `src/types/index.ts`, add near the other campaign types:

```ts
export interface RoiRoom {
    id: string;
    label: string;
    amount: number;
    mode: 'fixed' | 'pm';
    partition: boolean;
}

export interface RoiCalculator {
    enabled: boolean;
    spa_price: number;
    unit_facts: { name?: string; size?: string; beds_baths?: string };
    pm_spread: number;
    occupancy_steps: { worst: number; normal: number; best: number };
    whole_unit: { amount: number };
    rooms: RoiRoom[];
    packages: { without_partition: number | null; with_partition: number | null };
    disclaimers: string[];
}
```

Then add `roi_calculator?: RoiCalculator | null;` to the existing `CampaignLayoutType` interface (the one that already has `rental_projection?`).

- [ ] **Step 2: Create the util**

Create `src/utils/roiCalculator.ts`:

```ts
import type { RoiCalculator, RoiRoom } from '../types';

export type RoiRange = [number, number];
export type RoiScenario = 'whole' | 'co' | 'opt';

export function roomRange(room: RoiRoom, spread: number): RoiRange {
    return room.mode === 'pm' ? [room.amount - spread, room.amount + spread] : [room.amount, room.amount];
}

export function hasPartition(model: RoiCalculator): boolean {
    return model.rooms.some((r) => r.partition);
}

function scenarioRooms(model: RoiCalculator, scenario: RoiScenario): RoiRoom[] {
    if (scenario === 'opt') return model.rooms;
    return model.rooms.filter((r) => !r.partition);
}

export function scenarioMonthlyRange(model: RoiCalculator, scenario: RoiScenario, occupancyPct: number): RoiRange {
    const occ = (occupancyPct || 100) / 100;
    let lo = 0;
    let hi = 0;
    if (scenario === 'whole') {
        lo = model.whole_unit.amount;
        hi = model.whole_unit.amount;
    } else {
        for (const r of scenarioRooms(model, scenario)) {
            const [a, b] = roomRange(r, model.pm_spread);
            lo += a;
            hi += b;
        }
    }
    return [lo * occ, hi * occ];
}

export function roiPercent(monthly: number, spa: number): number {
    return spa > 0 ? (monthly * 12) / spa * 100 : 0;
}

export function annual(monthly: number): number {
    return monthly * 12;
}

export function paybackMonths(renovationPrice: number, selectedMonthly: number, wholeMonthly: number): number | null {
    const uplift = selectedMonthly - wholeMonthly;
    return uplift > 0 ? renovationPrice / uplift : null;
}
```

- [ ] **Step 3: Verify build + lint**

```bash
cd /home/ubuntu/projects/old/RenoXpert-Frontend-v2.1
npm run build   # expect exit 0
npx eslint src/utils/roiCalculator.ts src/types/index.ts --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'   # expect no NEW errors
```

(Numeric correctness is spot-checked through the builder preview in Task A5: Astrum A optimized = RM3,150 → 9.0%.)

- [ ] **Step 4: Commit**

```bash
git add src/utils/roiCalculator.ts src/types/index.ts
git commit -m "feat(roi): RoiCalculator types + pure compute util

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

## Task A4: `RoiBuilder` component

**Files:**
- Create: `RenoXpert-Frontend-v2.1/src/pages/Campaign/RoiBuilder.tsx`

**Interfaces:**
- Consumes: types + util from Task A3.
- Produces: default-exported `RoiBuilder` with props `{ value: RoiCalculator | null; packages: RoiPackageOption[]; onChange: (next: RoiCalculator) => void }`, and exported `RoiPackageOption = { id: number; label: string; price: number }`.

- [ ] **Step 1: Write the component**

Create `src/pages/Campaign/RoiBuilder.tsx`:

```tsx
import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import type { RoiCalculator, RoiRoom } from '../../types';
import { scenarioMonthlyRange, roiPercent, paybackMonths } from '../../utils/roiCalculator';

export type RoiPackageOption = { id: number; label: string; price: number };

interface Props {
    value: RoiCalculator | null;
    packages: RoiPackageOption[];
    onChange: (next: RoiCalculator) => void;
}

let _uid = 0;
const newRoomId = () => `room_${Date.now()}_${++_uid}`;

const emptyModel = (): RoiCalculator => ({
    enabled: true,
    spa_price: 0,
    unit_facts: {},
    pm_spread: 50,
    occupancy_steps: { worst: 85, normal: 90, best: 100 },
    whole_unit: { amount: 0 },
    rooms: [],
    packages: { without_partition: null, with_partition: null },
    disclaimers: [],
});

const money = (n: number) => 'RM' + Math.round(n).toLocaleString('en-MY');
const fmtRange = (lo: number, hi: number, f: (n: number) => string) =>
    Math.round(lo) === Math.round(hi) ? f(lo) : `${f(lo)} – ${f(hi)}`;

const RoiBuilder: React.FC<Props> = ({ value, packages, onChange }) => {
    if (!value) {
        return (
            <button
                type="button"
                onClick={() => onChange(emptyModel())}
                className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-semibold"
            >
                Enable ROI Calculator
            </button>
        );
    }
    const m = value;
    const patch = (p: Partial<RoiCalculator>) => onChange({ ...m, ...p });
    const patchRoom = (id: string, p: Partial<RoiRoom>) =>
        patch({ rooms: m.rooms.map((r) => (r.id === id ? { ...r, ...p } : r)) });
    const addRoom = () =>
        patch({ rooms: [...m.rooms, { id: newRoomId(), label: 'New room', amount: 600, mode: 'fixed', partition: false }] });
    const delRoom = (id: string) => patch({ rooms: m.rooms.filter((r) => r.id !== id) });
    const moveRoom = (idx: number, dir: -1 | 1) => {
        const j = idx + dir;
        if (j < 0 || j >= m.rooms.length) return;
        const rooms = [...m.rooms];
        [rooms[idx], rooms[j]] = [rooms[j], rooms[idx]];
        patch({ rooms });
    };
    const priceOf = (id: number | null) => (id == null ? 0 : packages.find((p) => p.id === id)?.price ?? 0);

    // preview @100% occupancy
    const hasPart = m.rooms.some((r) => r.partition);
    const whole = scenarioMonthlyRange(m, 'whole', 100);
    const co = scenarioMonthlyRange(m, 'co', 100);
    const opt = scenarioMonthlyRange(m, 'opt', 100);
    const pay = (total: number, reno: number) => {
        const mo = paybackMonths(reno, total, whole[0]);
        return mo == null ? '–' : `${mo.toFixed(1)} mo`;
    };

    const inputCls = 'border border-gray-300 rounded-md px-2 py-1 text-sm';

    return (
        <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={m.enabled} onChange={(e) => patch({ enabled: e.target.checked })} />
                Calculator enabled
            </label>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <label className="text-xs font-medium text-gray-600">SPA price (RM)
                    <input type="number" className={`mt-1 block w-full ${inputCls}`} value={m.spa_price}
                        onChange={(e) => patch({ spa_price: Number(e.target.value) || 0 })} />
                </label>
                <label className="text-xs font-medium text-gray-600">± spread (RM)
                    <input type="number" className={`mt-1 block w-full ${inputCls}`} value={m.pm_spread}
                        onChange={(e) => patch({ pm_spread: Number(e.target.value) || 0 })} />
                </label>
                <label className="text-xs font-medium text-gray-600">Whole-unit rent (RM/mo)
                    <input type="number" className={`mt-1 block w-full ${inputCls}`} value={m.whole_unit.amount}
                        onChange={(e) => patch({ whole_unit: { amount: Number(e.target.value) || 0 } })} />
                </label>
                <label className="text-xs font-medium text-gray-600">Size
                    <input type="text" className={`mt-1 block w-full ${inputCls}`} value={m.unit_facts.size ?? ''}
                        onChange={(e) => patch({ unit_facts: { ...m.unit_facts, size: e.target.value } })} />
                </label>
                <label className="text-xs font-medium text-gray-600">Beds / baths
                    <input type="text" className={`mt-1 block w-full ${inputCls}`} value={m.unit_facts.beds_baths ?? ''}
                        onChange={(e) => patch({ unit_facts: { ...m.unit_facts, beds_baths: e.target.value } })} />
                </label>
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-semibold text-gray-900">Co-Living rooms</h5>
                    <button type="button" onClick={addRoom} className="px-2.5 py-1 bg-blue-600 text-white rounded-md text-xs font-semibold flex items-center gap-1">
                        <Plus className="h-3.5 w-3.5" /> Room
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="text-xs text-gray-500 text-left">
                            <th className="py-1">Room</th><th>Amount</th><th>Mode</th><th>Partition</th><th></th>
                        </tr></thead>
                        <tbody>
                            {m.rooms.map((r, i) => (
                                <tr key={r.id} className="border-t border-gray-100">
                                    <td className="py-1 pr-2"><input type="text" className={`w-40 ${inputCls}`} value={r.label}
                                        onChange={(e) => patchRoom(r.id, { label: e.target.value })} /></td>
                                    <td className="pr-2"><input type="number" className={`w-20 ${inputCls}`} value={r.amount}
                                        onChange={(e) => patchRoom(r.id, { amount: Number(e.target.value) || 0 })} /></td>
                                    <td className="pr-2"><select className={inputCls} value={r.mode}
                                        onChange={(e) => patchRoom(r.id, { mode: e.target.value as 'fixed' | 'pm' })}>
                                        <option value="fixed">fixed</option><option value="pm">±</option></select></td>
                                    <td className="pr-2 text-center"><input type="checkbox" checked={r.partition}
                                        onChange={(e) => patchRoom(r.id, { partition: e.target.checked })} /></td>
                                    <td className="text-right whitespace-nowrap">
                                        <button type="button" onClick={() => moveRoom(i, -1)} className="text-gray-400 px-1" disabled={i === 0}><ArrowUp className="h-3.5 w-3.5 inline" /></button>
                                        <button type="button" onClick={() => moveRoom(i, 1)} className="text-gray-400 px-1" disabled={i === m.rooms.length - 1}><ArrowDown className="h-3.5 w-3.5 inline" /></button>
                                        <button type="button" onClick={() => delRoom(r.id)} className="text-red-500 px-1"><Trash2 className="h-3.5 w-3.5 inline" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-gray-400 mt-1">Mode ± = amount ± spread. Partition rooms only count when the buyer turns Partition on.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-xs font-medium text-gray-600">Package — w/o partition
                    <select className={`mt-1 block w-full ${inputCls}`} value={m.packages.without_partition ?? ''}
                        onChange={(e) => patch({ packages: { ...m.packages, without_partition: e.target.value ? Number(e.target.value) : null } })}>
                        <option value="">— none —</option>
                        {packages.map((p) => <option key={p.id} value={p.id}>{p.label} — {money(p.price)}</option>)}
                    </select>
                </label>
                <label className="text-xs font-medium text-gray-600">Package — with partition
                    <select className={`mt-1 block w-full ${inputCls}`} value={m.packages.with_partition ?? ''}
                        onChange={(e) => patch({ packages: { ...m.packages, with_partition: e.target.value ? Number(e.target.value) : null } })}>
                        <option value="">— none —</option>
                        {packages.map((p) => <option key={p.id} value={p.id}>{p.label} — {money(p.price)}</option>)}
                    </select>
                </label>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Preview @100% occupancy</h5>
                <table className="w-full text-sm text-right">
                    <thead><tr className="text-xs text-gray-500"><th className="text-left">Scenario</th><th>Whole</th><th>Co-Living</th>{hasPart && <th>Optimized</th>}</tr></thead>
                    <tbody>
                        <tr><td className="text-left font-semibold">Total/mo</td><td>{fmtRange(whole[0], whole[1], money)}</td><td>{fmtRange(co[0], co[1], money)}</td>{hasPart && <td>{fmtRange(opt[0], opt[1], money)}</td>}</tr>
                        <tr className="text-red-600 font-semibold"><td className="text-left">ROI %</td>
                            <td>{fmtRange(roiPercent(whole[0], m.spa_price), roiPercent(whole[1], m.spa_price), (v) => v.toFixed(1) + '%')}</td>
                            <td>{fmtRange(roiPercent(co[0], m.spa_price), roiPercent(co[1], m.spa_price), (v) => v.toFixed(1) + '%')}</td>
                            {hasPart && <td>{fmtRange(roiPercent(opt[0], m.spa_price), roiPercent(opt[1], m.spa_price), (v) => v.toFixed(1) + '%')}</td>}</tr>
                        <tr className="text-gray-500"><td className="text-left">Payback</td><td>–</td><td>{pay(co[0], priceOf(m.packages.without_partition))}</td>{hasPart && <td>{pay(opt[0], priceOf(m.packages.with_partition))}</td>}</tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RoiBuilder;
```

- [ ] **Step 2: Verify build + lint**

```bash
cd /home/ubuntu/projects/old/RenoXpert-Frontend-v2.1
npm run build   # expect exit 0
npx eslint src/pages/Campaign/RoiBuilder.tsx --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'   # expect 0
```

(Confirm `lucide-react` icons `Plus`, `Trash2`, `ArrowUp`, `ArrowDown` exist — they are already used elsewhere in the app; if any import is unavailable, substitute a unicode glyph button.)

- [ ] **Step 3: Commit**

```bash
git add src/pages/Campaign/RoiBuilder.tsx
git commit -m "feat(roi): RoiBuilder staff component (rooms, package links, live preview)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

## Task A5: Wire `RoiBuilder` into `EditCampaign`

**Files:**
- Modify: `RenoXpert-Frontend-v2.1/src/pages/Campaign/EditCampaign.tsx` (state type ~101; load map ~182; new updater; render in layout editor ~1963; payload map ~858; imports)

**Interfaces:**
- Consumes: `RoiBuilder` + `RoiPackageOption` (Task A4); `RoiCalculator` type (Task A3); `getQuotationTotal` (existing); `packages` + `packageLayoutIndex` state (existing).

- [ ] **Step 1: Imports**

Add to `EditCampaign.tsx` imports:

```tsx
import RoiBuilder, { RoiPackageOption } from './RoiBuilder';
import { getQuotationTotal } from '../../utils/quotationPricing';
```

And add `RoiCalculator` to the existing `import { ... } from '../../types';` line.

- [ ] **Step 2: Extend the `layoutTypes` state type**

Change the `layoutTypes` state declaration (currently `useState<{ id?: number | string; name: string; description?: string }[]>([])`) to:

```tsx
    const [layoutTypes, setLayoutTypes] = useState<{ id?: number | string; name: string; description?: string; roi_calculator?: RoiCalculator | null }[]>([]);
```

- [ ] **Step 3: Load existing `roi_calculator`**

In the load effect where `setLayoutTypes(campaign.layout_types.map(...))` is called, change the mapped object to include `roi_calculator`:

```tsx
                setLayoutTypes(campaign.layout_types.map((lt) => ({ id: lt.id, name: lt.name || '', description: lt.description || '', roi_calculator: lt.roi_calculator ?? null })));
```

- [ ] **Step 4: Add the updater**

Next to `updateLayoutType`, add:

```tsx
    const setLayoutRoi = (idx: number, value: RoiCalculator) => {
        setLayoutTypes(prev => prev.map((lt, i) => (i === idx ? { ...lt, roi_calculator: value } : lt)));
    };
```

- [ ] **Step 5: Render the builder in the layout editor**

In the per-layout-type editor, immediately before the `{/* Sub-packages for this layout */}` block (inside the same layout card, where `layoutIdx` is in scope), insert:

```tsx
                                                {/* ROI Calculator */}
                                                <div className="space-y-3 pt-2 border-t border-indigo-200">
                                                    <h4 className="text-sm font-semibold text-gray-900">ROI Calculator</h4>
                                                    <RoiBuilder
                                                        value={layoutTypes[layoutIdx]?.roi_calculator ?? null}
                                                        packages={packages
                                                            .map((pkg, index) => ({ pkg, index }))
                                                            .filter(({ index, pkg }) => packageLayoutIndex[index] === layoutIdx && pkg.id != null)
                                                            .map(({ pkg }): RoiPackageOption => ({ id: Number(pkg.id), label: pkg.name || `Package #${pkg.id}`, price: getQuotationTotal(pkg.order ?? null) }))}
                                                        onChange={(next) => setLayoutRoi(layoutIdx, next)}
                                                    />
                                                </div>

```

- [ ] **Step 6: Include `roi_calculator` in the save payload**

In `handleSubmit` where `layout_types` is built, change the map to carry `roi_calculator`:

```tsx
                    ? layoutTypes.map((lt, i) => ({ id: lt.id, name: lt.name, description: lt.description ?? '', sort: i, roi_calculator: lt.roi_calculator ?? null }))
```

- [ ] **Step 7: Verify build + lint + spot-check**

```bash
cd /home/ubuntu/projects/old/RenoXpert-Frontend-v2.1
npm run build   # expect exit 0 — confirms types line up across util/component/EditCampaign
npx eslint src/pages/Campaign/EditCampaign.tsx --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'   # expect no NEW errors
```

Spot-check (manual, by the user when running the app): in EditCampaign, enable the ROI Calculator on a layout, enter SPA 420000, whole-unit 2000, ± spread 50, rooms `Partition Room`=850/fixed/partition, `Single`=600, `Single`=600, `Queen`=900, `Parking`=200 → preview must show Optimized total **RM3,150**, ROI **9.0%**. Save, reload the campaign, and confirm the values round-trip (proves backend persistence A1/A2).

- [ ] **Step 8: Commit**

```bash
git add src/pages/Campaign/EditCampaign.tsx
git commit -m "feat(roi): wire RoiBuilder into EditCampaign layout editor + save payload

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

## Finalization (after all tasks + whole-branch review)

- **Backend:** push the branch, open a PR targeting `production` (PR body ends with the `🤖 Generated with [Claude Code]` footer). Migration is run by the user.
- **Frontend:** merge the branch into `production` (`--no-ff`) and push.
- **Deploy note:** run the migration (adds the nullable `roi_calculator` column). No data backfill needed — layouts without ROI config simply have `roi_calculator = null` and the public side (SP-B) falls back to the static image.

## Self-Review (completed)

- **Spec coverage:** JSON column + model/cast (A1, A2) ✓; resource exposure for the public side (A2) ✓; save path accepts data on create + update (A2) ✓; fixed-structure model + `fixed`/`±` + global spread (A3 types/util) ✓; package-link-one-per-mode (A4 dropdowns, A5 options via `getQuotationTotal`) ✓; builder with rooms/preview (A4) ✓; EditCampaign-only wiring (A5, per Global Constraints rationale) ✓. (Public calculator + drawer + fallback = SP-B, out of scope here.)
- **Type consistency:** `RoiCalculator`/`RoiRoom` shape identical across types (A3), util (A3), component (A4), and EditCampaign (A5); `RoiPackageOption = {id,label,price}` defined in A4 and consumed in A5; `roi_calculator` JSON key identical across BE (A2) and FE payload (A5) and resource (A2).
- **Placeholder scan:** no TBD/TODO; every code step shows complete code.
- **No test runner:** verification is build + lint + the documented Astrum-A spot-check (noted in Global Constraints and A5).
