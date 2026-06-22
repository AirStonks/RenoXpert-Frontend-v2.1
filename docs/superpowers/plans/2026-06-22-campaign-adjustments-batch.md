# Campaign Adjustments Batch — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use `- [ ]`. **Task 4 (drag-reorder) is the high-risk item — capable model + thorough review; it must reindex the index-keyed state maps correctly (same bug class fixed earlier in B2).**

**Goal:** Six adjustments from live testing: (1) allow a template quotation to be linked to multiple packages; (2) drag-reorder layouts + packages in the admin; (3) collapse/expand layout sections; (4) public: drop "Start from RM0" when no linked quotation (show Booking Fee); (5) fix the public background seam on scroll; (6) remove the T&C button from the quotation-detail mobile sticky bar.

**Architecture:** Backend = one migration (drop a unique index). Frontend = public display fixes + admin enhancements (collapse + @dnd-kit drag-reorder) in `AddCampaign.tsx`/`EditCampaign.tsx`. Reorder uses a bundle→arrayMove→unbundle approach so all index-keyed maps stay consistent.

**Tech Stack:** Laravel 11; React 18 + TS, Vite, Tailwind, @dnd-kit/core + @dnd-kit/sortable (installed). Repos: BE `/home/ubuntu/projects/old/RenoXpert-Backend`, FE `/home/ubuntu/projects/old/RenoXpert-Frontend-v2.1`.

## Global Constraints
- **Migrations authored but NOT run by us** (user runs `php artisan migrate`); BE `production` is PR-protected → finalize BE via PR. (`php` unavailable here → `php -l`/manual review.)
- **FE gate:** `npm run build` exit 0 + scoped eslint introduces no new errors. Baselines: AddCampaign.tsx 1, EditCampaign.tsx 1, CampaignDetailPage.tsx 0, CampaignLayoutDetailPage.tsx 0, CampaignPackageDetailPage.tsx 1, App.tsx 0 — confirm per file before editing; the gate is "count not increased". No test runner.
- **Reorder MUST reindex all per-index maps** (`packageValueSources`, `collapsedPackages`, `selectedPackageOrderTemplates`, `packageErrors`, `packageLayoutIndex` for packages; the layout image maps + `collapsedLayoutTypes` + `packageLayoutIndex` VALUES for layouts). Use the bundle approach (Task 4) — never reorder the array without remapping the maps.
- **Co-author trailers** on every commit.

---

### Task 0: Branches + commit this plan
- [ ] FE: `git checkout production && git pull --ff-only && git checkout -b feature/campaign-adjustments`; commit this plan file. BE: `git checkout production && git pull --ff-only 2>/dev/null; git checkout -b feature/allow-duplicate-quotation-link`. (Append trailers.)

---

### Task 1: BE — allow duplicate linked quotation (drop unique index)

**Files:** Create `RenoXpert-Backend/database/migrations/2026_06_22_020000_drop_unique_order_id_on_campaign_packages.php` (authored, NOT run).

- [ ] **Step 1: Create the migration** (drops ANY unique index on `campaign_packages.order_id`, name-agnostic via information_schema):
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        $database = DB::getDatabaseName();
        $indexes = DB::select(
            "SELECT DISTINCT INDEX_NAME FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'campaign_packages'
             AND COLUMN_NAME = 'order_id' AND NON_UNIQUE = 0",
            [$database]
        );
        foreach ($indexes as $idx) {
            DB::statement("ALTER TABLE `campaign_packages` DROP INDEX `{$idx->INDEX_NAME}`");
        }
    }

    public function down(): void
    {
        // Intentionally NOT restoring the unique index: duplicate order_id links are now allowed by design.
    }
};
```

- [ ] **Step 2: Verify** — `php -l` on the migration (or manual review). Do NOT run migrate. Note for the user: confirm with `SHOW CREATE TABLE campaign_packages;` that the unique index on `order_id` is gone after they run the migration; a duplicate-linked package then saves without error.
- [ ] **Step 3: Commit** `feat(campaign): allow a template quotation to link to multiple packages (drop unique order_id index)` (+ trailers; note: run migration manually).

---

### Task 2: Public display fixes (#4 Start-from fallback, #6 remove sticky T&C, #5 background seam)

**Files:** Modify `src/pages/CampaignPages/CampaignLayoutDetailPage.tsx`, `src/pages/CampaignPages/CampaignPackageDetailPage.tsx`, and (for #5) `src/pages/CampaignPages/CampaignDetailPage.tsx` (and possibly `index.html`/`CampaignHeader.tsx` — investigate).

- [ ] **Step 1 (#4): Start-from fallback** — in `CampaignLayoutDetailPage.tsx`, the pricing block (~lines 439–454) currently always shows "Start from RM{startFrom} initial down" then Booking Fee. Change so that when `startFrom > 0` it shows the Start-from block (large) with Booking Fee beneath; when `startFrom <= 0` (no linked quotation) it HIDES the Start-from block and shows the **Booking Fee as the primary** figure. Replace the block with:
```tsx
<div className="pt-4 border-t border-slate-100">
    {startFrom > 0 ? (
        <>
            <div className="text-xs text-slate-400 leading-none mb-1">Start from</div>
            <div className="text-2xl sm:text-3xl font-bold text-campaign">
                RM {formatRM(startFrom)}
                <span className="text-xs sm:text-sm font-medium text-slate-400"> initial down</span>
            </div>
            {pkg.booking_amount && pkg.booking_amount > 0 && (
                <div className="mt-2">
                    <div className="text-sm text-slate-500">Booking Fee <span className="font-semibold text-slate-700">RM {pkg.booking_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                    <div className="text-[10px] sm:text-xs font-semibold text-red-600">Non-refundable</div>
                </div>
            )}
        </>
    ) : (
        pkg.booking_amount && pkg.booking_amount > 0 ? (
            <>
                <div className="text-xs text-slate-400 leading-none mb-1">Booking Fee</div>
                <div className="text-2xl sm:text-3xl font-bold text-campaign">
                    RM {pkg.booking_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] sm:text-xs font-semibold text-red-600 mt-1">Non-refundable</div>
            </>
        ) : null
    )}
</div>
```

- [ ] **Step 2 (#6): Remove the T&C button** from the quotation-detail mobile sticky bar — in `CampaignPackageDetailPage.tsx`, delete the `<button ... onClick={() => setActiveTab('tnc')}>Terms &amp; Conditions</button>` (~lines 1116–1122) inside the `lg:hidden fixed bottom-0` sticky bar. Leave the rest of the bar (program figure + Initial Down) intact. Ensure no now-unused var/import results (the `setActiveTab` is still used by the tab control elsewhere, so fine).

- [ ] **Step 3 (#5): Fix the background seam** — INVESTIGATE first: read `CampaignDetailPage.tsx` page-root (`<div className="w-full min-h-screen bg-slate-50">`, ~line 250), `CampaignHeader.tsx` (its bg), and confirm whether the seam is a body-background gap or a stray section bg. Then apply the minimal fix to make the background continuous on scroll. Most likely fix: ensure the page background is painted at the document level so no seam shows — e.g. add `bg-slate-50` to `<body>` (in `index.html` or a root style) OR change the page root to guarantee full coverage. If the seam is a specific element's bg boundary, remove/extend that bg instead. Pick the smallest fix that yields one continuous `slate-50` background while scrolling; the user verifies visually. Document exactly what you changed and why in the report.

- [ ] **Step 4: Verify** — `npm run build` exit 0; scoped eslint on the 3 changed files → no new errors (counts: CampaignLayoutDetailPage 0, CampaignPackageDetailPage stays 1, CampaignDetailPage stays 0). Manual: a no-quotation package shows Booking Fee (no "Start from RM0"); the quotation-detail sticky bar has no T&C button; the landing background is seamless on scroll.
- [ ] **Step 5: Commit** `fix(campaign): public Start-from fallback, remove sticky T&C, seamless background` (+ trailers).

---

### Task 3: Admin — collapse/expand layout sections (#3)

**Files:** Modify `src/pages/Campaign/AddCampaign.tsx` + `src/pages/Campaign/EditCampaign.tsx`.

- [ ] **Step 1:** Add `const [collapsedLayoutTypes, setCollapsedLayoutTypes] = useState<Record<number, boolean>>({});` and a toggle `const toggleLayoutCollapse = (idx: number) => setCollapsedLayoutTypes(prev => ({ ...prev, [idx]: !prev[idx] }));` (both files; mirror the existing `collapsedPackages`/`togglePackageCollapse`).
- [ ] **Step 2:** In the layout-type section header (AddCampaign ~line 1387 / EditCampaign equivalent), add a chevron collapse button before/with the name (reuse the package header's `ChevronDown`/`ChevronUp` pattern) calling `toggleLayoutCollapse(layoutIdx)`.
- [ ] **Step 3:** Wrap the layout section BODY (the image uploaders + sub-packages + "Add sub-package") in `{!collapsedLayoutTypes[layoutIdx] && ( ... )}` so it collapses. Keep the header (name/description inputs may stay visible or move inside the body — keep name input visible in the header row; collapse the images + sub-packages). 
- [ ] **Step 4:** When a layout is removed, drop its `collapsedLayoutTypes` key + reindex (use the existing `shiftNumericIndexMap` in `removeLayoutType`). 
- [ ] **Step 5: Verify** — build exit 0; eslint counts unchanged (Add 1, Edit 1). Manual: layout sections collapse/expand; packages still collapse.
- [ ] **Step 6: Commit** `feat(campaign): collapsible layout-type sections in admin (#3)` (+ trailers).

---

### Task 4: Admin — drag-reorder layouts + packages (#2)  [HIGH RISK — capable model]

**Files:** Modify `src/pages/Campaign/AddCampaign.tsx` + `src/pages/Campaign/EditCampaign.tsx`.
**READ first:** the existing `src/pages/Order/components/SortablePackageItem.tsx` (the codebase's @dnd-kit pattern), the packages/layoutTypes state + maps + render maps, and the `shiftNumericIndexMap`/`shiftIndexMap` helpers already in these files.

**Approach (bundle→arrayMove→unbundle) — the safe way to keep index-keyed maps consistent:**
- Use `DndContext` + `SortableContext` (verticalListSortingStrategy) from @dnd-kit, with `arrayMove` from `@dnd-kit/sortable`.
- **Package reorder** (within a layout's sub-list in layout mode; the whole list in flat mode): on drop with old index `from` → new index `to` over the FULL `packages` array indices, build descriptors bundling every per-index map, move, and rebuild:
```tsx
const reorderPackages = (from: number, to: number) => {
    const desc = packages.map((pkg, i) => ({
        pkg,
        vs: packageValueSources[String(i)],
        col: collapsedPackages[i],
        tmpl: selectedPackageOrderTemplates[String(i)],
        err: packageErrors[String(i)],
        layoutIdx: packageLayoutIndex[i],
    }));
    const moved = arrayMove(desc, from, to);
    setPackages(moved.map(d => d.pkg));
    setPackageValueSources(Object.fromEntries(moved.map((d, i) => [String(i), d.vs]).filter(([, v]) => v !== undefined)));
    setSelectedPackageOrderTemplates(Object.fromEntries(moved.map((d, i) => [String(i), d.tmpl]).filter(([, v]) => v !== undefined)));
    setPackageErrors(Object.fromEntries(moved.map((d, i) => [String(i), d.err]).filter(([, v]) => v !== undefined)));
    setCollapsedPackages(Object.fromEntries(moved.map((d, i) => [i, d.col]).filter(([, v]) => v !== undefined)));
    setPackageLayoutIndex(Object.fromEntries(moved.map((d, i) => [i, d.layoutIdx]).filter(([, v]) => v !== undefined)));
};
```
  In LAYOUT mode, only allow reordering WITHIN a layout: the sortable list per layout contains that layout's package indices; map the within-layout from/to back to absolute `packages` indices before calling `reorderPackages` (or implement a within-group reorder that preserves each package's `layoutIdx`). Keep it simple: reorder the absolute array but ensure the dropped item keeps its `layoutIdx` (since the bundle carries `layoutIdx`, grouping by `packageLayoutIndex` still renders correctly regardless of absolute order).
- **Layout reorder:** bundle layout descriptors (layoutType + `collapsedLayoutTypes[i]` + the layout image maps for that index) + compute the old→new index permutation; `arrayMove` layoutTypes; rebuild the layout-index-keyed maps; AND remap `packageLayoutIndex` VALUES via the permutation (each package's `layoutIdx` = newIndexOf(oldLayoutIdx)). Provide an explicit `oldToNew` array from the move.
- Wire drag handles into the package-card header and the layout-section header (a `GripVertical` handle). Use `closestCenter`, `PointerSensor`/`KeyboardSensor`. Each sortable item id = a stable string (use the package's array index or a stable key; since indices shift, prefer a stable per-item id — e.g. for packages use `pkg.id ?? `new-${i}`` and map back to index on drop; for layouts use `lt.id ?? `new-${i}``).

- [ ] **Step 1:** Add the @dnd-kit imports + sensors + a `DndContext`/`SortableContext` around the package list (flat + per-layout) and around the layout-types list. Implement `reorderPackages(from,to)` and `reorderLayouts(from,to)` with the bundle/remap above. Add `GripVertical` drag handles to both headers.
- [ ] **Step 2:** Do the same in EditCampaign.tsx (same helpers; Edit also has `layoutProjectionUrl`/`layoutRenderingImgs`/`layoutUploading` to remap on layout reorder, and Add has `layoutProjectionFile`/`layoutRenderingFiles`).
- [ ] **Step 3:** On submit, the `sort` sent for layout_types is the (now reordered) array index (already `sort: i`), and package order = array order — so reordering persists via the existing payload (layout_types `sort` + packages array order + `layout_type_index`). Confirm no extra backend change needed.
- [ ] **Step 4: Verify** — build exit 0; eslint counts unchanged (Add 1, Edit 1 — no `any`/unused from dnd). Manual: drag to reorder packages (flat + within a layout) and layouts; after reorder, each package keeps its correct linked-order/value-source/collapse/layout assignment (NO mis-grouping), and removing/editing still works; save persists the new order.
- [ ] **Step 5: Commit** `feat(campaign): drag-reorder layouts + packages in admin (#2)` (+ trailers).

---

### Task 5: Verify & finalize
- [ ] **Step 1:** FE `npm run build` exit 0; scoped eslint all touched FE files → no new errors. BE `php -l` (or manual) on the migration.
- [ ] **Step 2: Manual QA** (needs B1 live + migration run): duplicate-quotation link saves; drag-reorder layouts/packages persists + no mis-grouping; layout collapse; public Start-from fallback; seamless background; no sticky T&C button.
- [ ] **Step 3: Finalize** — FE via `superpowers:finishing-a-development-branch` (production not protected → merge+push or PR). BE via PR (protected) — push `feature/allow-duplicate-quotation-link` + open PR (note: run the migration).

---

## Self-Review
**Coverage:** #1→Task1; #4+#6+#5→Task2; #3→Task3; #2→Task4; verify→Task5. **Placeholders:** Task1/Task2 #4/#6 literal; #5 is investigate-and-fix (CSS, needs in-browser confirmation — flagged); Task3 literal pattern; Task4 is a flagged high-risk guided build with the concrete bundle/remap helper. **Risk:** Task4 reorder must reindex ALL per-index maps (bundle approach) + remap `packageLayoutIndex` values on layout reorder — same bug class as B2; review thoroughly. **Consistency:** the bundle keys match each map's key type (string for valueSources/templates/errors, number for collapsed/layoutIndex); `sort: i` + array order persist reorder via the existing B2 payload.
