# ROI Calculator — Design Spec

**Date:** 2026-06-30
**Status:** Approved (design, validated via interactive prototypes)
**Repos:** Backend `RenoXpert-Backend` (PR → `production`), Frontend `RenoXpert-Frontend-v2.1` (merge+push → `production`)

## Goal

Turn each campaign layout type's static "Rental Projection" slide into an **interactive ROI Calculator**: a public, buyer-facing calculator (floating button on the layout pages) plus a staff-side builder (in the campaign editor) that configures the numbers. The calculator shows the Whole-Unit vs Co-Living vs Optimized (partition) comparison and computes ROI %, income, and renovation payback live.

Design was validated with two throwaway HTML prototypes (`roi-demo.html` buyer side, `roi-builder-demo.html` staff side) before this spec. Those prototypes are the visual + behavioral source of truth; they are not committed app code.

## Locked decisions

1. **Fixed structure (not staff-defined columns).** Each layout has one Whole-Unit lump rent + a list of Co-Living rooms; each room carries a `partition` flag. The three comparison scenarios are *derived*:
   - **Whole Unit** — the lump.
   - **Co-Living** — sum of rooms where `partition === false`.
   - **Optimized Co-Living** — sum of all rooms (only shown when the layout has ≥1 partition room).
2. **Per-room rate model: `fixed` or `±`.** No min/max inputs. Each room has one `amount` + a `mode`: `fixed` → single value; `pm` (±) → `amount ± pm_spread`. `pm_spread` is one **global, editable** value per layout (default 50). *Known limitation, accepted:* a single spread can't reproduce mixed slide spreads (650–850 vs 850–1100); per-room spread is a deferred enhancement (YAGNI).
3. **Renovation cost comes from packages, one per mode.** No typed renovation number. In the builder, staff link a package for **w/o partition** and a package for **with partition** (chosen from the layout type's `campaign_packages`). The renovation cost = that package's quotation price. The buyer's partition toggle swaps which package feeds the payback.
4. **Buyer inputs:** rental strategy (Whole Unit / Co-Living), partition toggle (only in Co-Living, only when partition rooms exist), occupancy stepper (Worst/Normal/Best = 85/90/100% by default, configurable per layout), and editable purchase price (SPA).
5. **Display:** the full 3-column comparison table is **always shown** (Whole / Co-Living / Optimized); the toggles **highlight** the active column (they don't hide columns) and drive the renovation/payback block. Above the table sits an **emphasis band** ordered **Profit → Difference → Cost** (decreasing visual weight, not a numbered stepper). Ranges render as `"RM x - RM y"` (no mean shown).
6. **Removed from earlier iterations:** rent-level slider, per-room on/off toggles, manual renovation-cost field.
7. **Fallback:** when `roi_calculator.enabled` is false/absent, the layout page keeps showing today's static `rental_projection` image.

## Computations

> `ROI % = monthly × 12 ÷ SPA` · `Annual = monthly × 12` · `Payback months = renovation price ÷ (selected monthly − whole-unit monthly)` (using the conservative/low end of any range). Occupancy multiplies monthly income.

All pricing is computed on the **frontend** (mirrors the existing `src/utils/quotationPricing.ts` approach). New pure, unit-tested util `src/utils/roiCalculator.ts`:

```ts
type RoomRate = { mode: 'fixed' | 'pm'; amount: number };
type Range = [lo: number, hi: number];

roomRange(rate: RoomRate, spread: number): Range
scenarioTotalRange(model, scenario: 'whole'|'co'|'opt', occupancyPct: number): Range
roiPercent(monthly: number, spa: number): number
annual(monthly: number): number
paybackMonths(renovationPrice: number, selectedMonthly: number, wholeMonthly: number): number | null
```

**Renovation price resolution:** the linked package is one of the layout type's `campaign_packages`, whose `order` is already nested in the public layout API. The calculator resolves its price via the existing util — default **`getQuotationTotal(order)`** (full renovation price). (Plan note: if the "Renovation Price Start From" framing is preferred, switch to `getInitialDownPayment(order)`. Decision recorded as `getQuotationTotal` unless the user says otherwise.)

## Data model

New JSON column `roi_calculator` on `campaign_layout_types` (additive Laravel migration; mirrors the existing `rental_projection`/`metadata` JSON columns — no new table, no DB FK). Added to `CampaignLayoutType` `$fillable` + `$casts` (`'roi_calculator' => 'array'`).

```jsonc
roi_calculator: {
  enabled: true,
  spa_price: 420000,
  unit_facts: { name: "Type A/A-c", size: "570–668 sq ft", beds_baths: "3BR + 1B" },
  pm_spread: 50,
  occupancy_steps: { worst: 85, normal: 90, best: 100 },
  whole_unit: { amount: 2000 },
  rooms: [
    { id: "it1", label: "Partition Room (Room 1)", amount: 850, mode: "fixed", partition: true },
    { id: "it2", label: "Single Room (Room 2)",   amount: 600, mode: "fixed", partition: false },
    { id: "it5", label: "Parking",                amount: 200, mode: "fixed", partition: false }
  ],
  packages: { without_partition: 123, with_partition: 124 },   // campaign_package ids on this layout type
  disclaimers: ["All utility charges… owner's responsibility", "Excludes electrical appliances & air-conds."]
}
```

`id`s for rooms are client-generated stable strings. `packages.*` reference `campaign_packages.id` belonging to the same layout type (validated on save).

## Architecture

### Backend
- Additive migration: `roi_calculator` JSON on `campaign_layout_types`.
- `CampaignLayoutType` model: add to `$fillable` + `$casts`.
- Persistence: extend the existing layout-type save path (where `rental_projection`/`name`/etc. are written in the campaign create/update flow) to accept and store `roi_calculator`. Validation: `packages.without_partition` / `packages.with_partition`, if present, must be `campaign_packages.id` rows whose `layout_type_id` matches this layout (reject mismatches).
- Public API: the layout type's public resource (consumed by `CampaignLayoutDetailPage`) must include `roi_calculator`, and the linked packages must carry enough order/quotation data for the FE pricing util (they already do for the existing package cards).

### Frontend — public calculator (SP-B)
- `src/utils/roiCalculator.ts` — the pure compute util above (+ unit tests).
- A floating **"ROI Calculator"** button + drawer/modal component, scoped to one layout type, mounted on `src/pages/CampaignPages/CampaignLayoutDetailPage.tsx` and `src/pages/CampaignPages/CampaignPackageDetailPage.tsx`.
- Drawer contents, mirroring `roi-demo.html`: strategy + partition + occupancy controls + SPA input; the Profit→Difference→Cost emphasis band; the always-on 3-column comparison table (featured column highlighted); the linked renovation-package card. Reuses crimson/`campaign` Tailwind tokens.
- Existing "View Quotation" / booking CTA + referral attribution remain untouched.
- Fallback to the static `rental_projection` image when `roi_calculator.enabled` is false.

### Frontend — staff builder (SP-A)
- A "ROI Calculator" section in the per-layout-type editor (`src/pages/Campaign/EditCampaign.tsx`, and `AddCampaign` if it edits layout types), mirroring `roi-builder-demo.html`: enable toggle; SPA; unit facts; `pm_spread`; occupancy steps; whole-unit amount; the rooms table (label, amount, mode ±/fixed, partition checkbox, reorder, delete, add); the two package-link dropdowns (sourced from this layout's packages, showing each package's resolved price); a live preview (all three scenarios + payback); persisted in the campaign save payload as `roi_calculator`.

## Decomposition

Two sub-projects, built in order, each its own implementation plan:
- **SP-A — Data model + backend persistence + staff builder.** Deliverable: staff can configure and save a layout's `roi_calculator`; round-trips through the API; live preview matches the prototype.
- **SP-B — Public interactive calculator + `roiCalculator.ts` util.** Deliverable: the floating button + drawer renders the validated calculator on the layout + quotation pages, computing from the saved data; fallback to the static image when disabled.

## Error handling & edge cases

- **No partition rooms** (e.g. Astrum C-c): hide the partition toggle and the Optimized column; `packages.with_partition` may be null.
- **Missing package link:** if the relevant package isn't set, hide the payback figure (show the income/ROI only); the builder surfaces this as "configure a package."
- **SPA = 0 / empty:** guard ROI division (show "–").
- **Deleted package** referenced by `roi_calculator`: resolve gracefully (treat as missing link).
- **Disabled calculator:** static image fallback; the floating button is hidden.

## Out of scope (YAGNI)

- Per-room ± spread (single global spread for now).
- Net ROI after running costs / financing / multi-year projection.
- Buyer choosing among multiple packages (one package per mode only).
- Saving/sharing a buyer's specific calculation.

## Verification

- **Frontend:** `npm run build` (exit 0) + scoped eslint (0 new errors on touched files); unit tests for `roiCalculator.ts` (range math, ROI, payback, occupancy, partition derivation).
- **Backend:** manual review (no PHP/DB in the working environment); migration reviewed for additive/no-DB-FK + reversible `down()`.
- **Process:** ultracode Workflow per task (implement → 2 adversarial review lenses → fix loop → whole-branch review); controllers extend `BaseController`; never run `php artisan migrate` (user runs it). BE ships as a PR to `production`; FE merge+push.

## Affected files (reference)

**Backend:** `database/migrations/<new>_add_roi_calculator_to_campaign_layout_types.php` (new), `app/Models/CampaignLayoutType.php`, the campaign create/update controller path that saves layout types, and the public layout-type resource.

**Frontend:** `src/utils/roiCalculator.ts` (new) + test, a new ROI calculator drawer component + a new builder section component, `src/pages/CampaignPages/CampaignLayoutDetailPage.tsx`, `src/pages/CampaignPages/CampaignPackageDetailPage.tsx`, `src/pages/Campaign/EditCampaign.tsx` (+ `AddCampaign` if applicable), `src/services/api.ts` (layout-type payload), `src/types/index.ts` (the `roi_calculator` type).
