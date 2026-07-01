# ROI Calculator — SP-B (Public buyer-facing calculator) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public, buyer-facing ROI calculator (a floating button + drawer) to the campaign layout page and its quotation sub-page, driven by the layout's saved `roi_calculator` config and computed with the existing `roiCalculator.ts` util.

**Architecture:** One self-contained `RoiCalculatorDrawer` component renders the floating button + drawer (mirroring the approved `roi-demo.html` v3 prototype): strategy/partition/occupancy/SPA controls, a Profit→Difference→Cost emphasis band, an always-on 3-column comparison table with the active column highlighted, and a package-linked renovation/payback block. It's mounted on `CampaignLayoutDetailPage` and `CampaignPackageDetailPage`, each resolving the layout's `roi_calculator` + the linked package prices (`getQuotationTotal`). Frontend-only — the backend already exposes `roi_calculator` via `CampaignLayoutTypeResource`.

**Tech Stack:** React 18 + TypeScript + Tailwind + Vite; the public campaign pages' crimson `campaign` token.

## Global Constraints

- Frontend-only (merge+push → `production`). No backend changes (data already exposed).
- **No FE test runner** — do NOT add one. Verify via `npm run build` (exit 0) + scoped eslint (0 new errors vs the 17-error baseline). Spot-check: on a layout configured like Astrum A/A-c (SPA 420,000; whole 2,000; rooms Partition 850/partition, Single 600, Single 600, Queen 900, Parking 200) the drawer's **Optimized** column shows total **RM3,150** and ROI **9.0%** at 100% occupancy.
- Compute only via the existing `src/utils/roiCalculator.ts` (created in SP-A) — do NOT reimplement the math.
- Renovation price = `getQuotationTotal(pkg.order as Order | undefined)` (established idiom, see `CampaignLayoutDetailPage.tsx:389`).
- **Fallback:** when a layout's `roi_calculator` is null or `enabled === false`, render nothing (no button); the existing static `rental_projection` image stays as-is. Do NOT remove or alter the static image rendering.
- Ranges display as `"RM x - RM y"` (no mean). Featured column highlight = `bg-rose-50` + `text-campaign`.
- Commit trailers (verbatim) on every commit:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS
  ```
- Repo: `/home/ubuntu/projects/old/RenoXpert-Frontend-v2.1`.

## File Structure

- `src/pages/CampaignPages/components/RoiCalculatorDrawer.tsx` (new) — the buyer calculator (button + drawer). One responsibility, self-contained.
- `src/pages/CampaignPages/CampaignLayoutDetailPage.tsx` — mount the drawer for the current layout.
- `src/pages/CampaignPages/CampaignPackageDetailPage.tsx` — resolve the layout from the viewed package, mount the drawer.

**Existing anchors (already in the code):**
- `CampaignLayoutDetailPage.tsx`: `layout` (`:82`), `layoutPackages` (`:84`), imports `getQuotationTotal` (`:22`) + `Order` (`:19`), renders `<ToastContainer` near the end.
- `CampaignPackageDetailPage.tsx`: `campaign` state, `selectedCampaignPackage` (`~:99`), imports `Order` (`:6`); does NOT yet import `getQuotationTotal`.
- `roiCalculator.ts` exports: `scenarioMonthlyRange`, `roiPercent`, `annual`, `paybackMonths`, `roomRange`, `hasPartition`, and type `RoiScenario`.
- `CampaignLayoutType.roi_calculator?: RoiCalculator | null` and `CampaignPackage` (`id?: string`, `name?: string`, `layout_type_id?`, `order?: Order`) already typed.

---

## Task B1: `RoiCalculatorDrawer` component

**Files:**
- Create: `src/pages/CampaignPages/components/RoiCalculatorDrawer.tsx`

**Interfaces:**
- Consumes: `roiCalculator.ts` util + `RoiCalculator` type (from SP-A).
- Produces: default-exported `RoiCalculatorDrawer` with props `{ roi: RoiCalculator; packages: RoiCalcPackage[] }`, and exported `type RoiCalcPackage = { id: number; name: string; price: number }`.

- [ ] **Step 1: Write the component**

```tsx
import React, { useState } from 'react';
import type { RoiCalculator } from '../../../types';
import { scenarioMonthlyRange, roiPercent, annual, paybackMonths, roomRange, hasPartition } from '../../../utils/roiCalculator';
import type { RoiScenario } from '../../../utils/roiCalculator';

export type RoiCalcPackage = { id: number; name: string; price: number };

interface Props {
    roi: RoiCalculator;
    packages: RoiCalcPackage[];
}

const money = (n: number) => 'RM' + Math.round(n).toLocaleString('en-MY');
const fmtRange = (lo: number, hi: number, f: (n: number) => string) =>
    Math.round(lo) === Math.round(hi) ? f(lo) : `${f(lo)} - ${f(hi)}`;

const RoiCalculatorDrawer: React.FC<Props> = ({ roi, packages }) => {
    const part = hasPartition(roi);
    const [open, setOpen] = useState(false);
    const [strategy, setStrategy] = useState<'whole' | 'co'>('co');
    const [partition, setPartition] = useState<'no' | 'yes'>(part ? 'yes' : 'no');
    const [occ, setOcc] = useState<number>(roi.occupancy_steps.normal);
    const [spa, setSpa] = useState<number>(roi.spa_price);

    const pkgById = (id: number | null) => (id == null ? null : packages.find((p) => p.id === id) ?? null);
    const active: RoiScenario = strategy === 'whole' ? 'whole' : (part && partition === 'yes' ? 'opt' : 'co');

    const cols: { key: RoiScenario; label: string }[] = [
        { key: 'whole', label: 'Whole Unit' },
        { key: 'co', label: 'Co-Living' },
        ...(part ? [{ key: 'opt' as RoiScenario, label: 'Optimized Co-Living' }] : []),
    ];
    const totals: Record<string, [number, number]> = {};
    cols.forEach((c) => { totals[c.key] = scenarioMonthlyRange(roi, c.key, occ); });

    const wholeM = scenarioMonthlyRange(roi, 'whole', occ)[0];
    const t = totals[active];
    const profA: [number, number] = [annual(t[0]), annual(t[1])];

    const renoPkg = active === 'whole' ? null : (active === 'opt' ? pkgById(roi.packages.with_partition) : pkgById(roi.packages.without_partition));
    const diffM: [number, number] = [t[0] - wholeM, t[1] - wholeM];
    const months = renoPkg ? paybackMonths(renoPkg.price, t[0], wholeM) : null;

    const seg = (on: boolean) => `flex-1 px-3 py-2 text-sm font-semibold ${on ? 'bg-campaign text-white' : 'bg-white text-slate-500'}`;
    const featCell = (on: boolean) => (on ? 'bg-rose-50' : '');
    const roiCell = (r: [number, number]) =>
        spa > 0 ? fmtRange(roiPercent(r[0], spa), roiPercent(r[1], spa), (v) => v.toFixed(1) + '%') : '–';

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="fixed bottom-5 right-5 z-40 rounded-full bg-campaign px-5 py-3 text-sm font-bold text-white shadow-lg hover:opacity-90"
            >
                ROI Calculator
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setOpen(false)}>
                    <div className="h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-xl sm:p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">ROI Calculator</h2>
                            <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600" aria-label="Close">✕</button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">Rental strategy</label>
                                <div className="flex overflow-hidden rounded-lg border border-slate-200">
                                    <button type="button" className={seg(strategy === 'whole')} onClick={() => setStrategy('whole')}>Whole Unit</button>
                                    <button type="button" className={seg(strategy === 'co')} onClick={() => setStrategy('co')}>Co-Living</button>
                                </div>
                            </div>
                            {strategy === 'co' && part && (
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-600">Renovation</label>
                                    <div className="flex overflow-hidden rounded-lg border border-slate-200">
                                        <button type="button" className={seg(partition === 'no')} onClick={() => setPartition('no')}>W/o partition</button>
                                        <button type="button" className={seg(partition === 'yes')} onClick={() => setPartition('yes')}>With partition</button>
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">Occupancy</label>
                                <div className="flex overflow-hidden rounded-lg border border-slate-200">
                                    {([['Worst', roi.occupancy_steps.worst], ['Normal', roi.occupancy_steps.normal], ['Best', roi.occupancy_steps.best]] as [string, number][]).map(([lbl, val]) => (
                                        <button key={lbl} type="button" className={seg(occ === val)} onClick={() => setOcc(val)}>{lbl} {val}%</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">Purchase price (SPA)</label>
                                <input type="number" value={spa} onChange={(e) => setSpa(Number(e.target.value) || 0)}
                                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                            </div>
                        </div>

                        {/* Profit -> Difference -> Cost emphasis band */}
                        <div className="my-4 rounded-xl border border-slate-200 p-4">
                            <div className="flex flex-wrap items-baseline gap-2">
                                <span className="w-20 text-[10px] font-bold uppercase tracking-wide text-slate-400">Profit</span>
                                <span className="text-2xl font-extrabold text-green-600">{fmtRange(profA[0], profA[1], money)}</span>
                                <span className="text-xs text-slate-400">{fmtRange(t[0], t[1], money)}/mo · per year</span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-baseline gap-2 border-t border-dashed border-slate-200 pt-2">
                                <span className="w-20 text-[10px] font-bold uppercase tracking-wide text-slate-400">Difference</span>
                                {active === 'whole'
                                    ? <span className="text-lg font-extrabold text-slate-400">Baseline</span>
                                    : (<>
                                        <span className="text-lg font-extrabold text-campaign">+{fmtRange(annual(diffM[0]), annual(diffM[1]), money)}</span>
                                        <span className="text-xs text-slate-400">+{fmtRange(diffM[0], diffM[1], money)}/mo vs whole unit</span>
                                    </>)}
                            </div>
                            <div className="mt-2 flex flex-wrap items-baseline gap-2 border-t border-dashed border-slate-200 pt-2">
                                <span className="w-20 text-[10px] font-bold uppercase tracking-wide text-slate-400">Cost</span>
                                {renoPkg
                                    ? (<>
                                        <span className="text-sm font-bold text-slate-900">{money(renoPkg.price)}</span>
                                        <span className="text-xs text-slate-400">{months != null ? `pays back in ${months.toFixed(1)} mo` : 'one-time renovation'}</span>
                                    </>)
                                    : <span className="text-sm font-bold text-slate-400">–</span>}
                            </div>
                        </div>

                        {/* Always-on comparison table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                                <thead>
                                    <tr className="text-[11px] uppercase text-slate-400">
                                        <th className="text-left">Condo</th>
                                        {cols.map((c) => <th key={c.key} className={c.key === active ? 'text-campaign' : ''}>{c.label}{c.key === active ? ' ★' : ''}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {roi.rooms.map((rm, i) => (
                                        <tr key={rm.id} className="border-t border-slate-100">
                                            <td className="py-2 text-left text-slate-700">{rm.label}</td>
                                            {cols.map((c) => {
                                                if (c.key === 'whole') {
                                                    return i === 0
                                                        ? <td key={c.key} rowSpan={roi.rooms.length} className={`align-middle text-center font-semibold ${featCell(active === 'whole')}`}>{money(roi.whole_unit.amount)}<div className="text-[10px] font-normal text-slate-400">whole unit</div></td>
                                                        : null;
                                                }
                                                const show = c.key === 'opt' ? true : !rm.partition;
                                                if (!show) return <td key={c.key} className={featCell(c.key === active)}><span className="text-slate-300">–</span></td>;
                                                const [lo, hi] = roomRange(rm, roi.pm_spread);
                                                return <td key={c.key} className={featCell(c.key === active)}>{fmtRange(lo, hi, money)}</td>;
                                            })}
                                        </tr>
                                    ))}
                                    <tr className="border-t-2 border-slate-800 font-extrabold">
                                        <td className="py-2 text-left">Total / month</td>
                                        {cols.map((c) => <td key={c.key} className={featCell(c.key === active)}>{fmtRange(totals[c.key][0], totals[c.key][1], money)}</td>)}
                                    </tr>
                                    <tr className="font-extrabold text-campaign">
                                        <td className="text-left">ROI %</td>
                                        {cols.map((c) => <td key={c.key} className={featCell(c.key === active)}>{roiCell(totals[c.key])}</td>)}
                                    </tr>
                                    <tr className="font-semibold text-slate-500">
                                        <td className="text-left">Annual income</td>
                                        {cols.map((c) => <td key={c.key} className={featCell(c.key === active)}>{fmtRange(annual(totals[c.key][0]), annual(totals[c.key][1]), money)}</td>)}
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {renoPkg && (
                            <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <span className="text-sm font-semibold text-slate-700">{renoPkg.name}</span>
                                <span className="text-sm font-extrabold text-campaign">{money(renoPkg.price)}</span>
                            </div>
                        )}

                        {roi.disclaimers.length > 0 && (
                            <ul className="mt-3 space-y-1 text-[11px] text-slate-400">
                                {roi.disclaimers.map((d, i) => <li key={i}>* {d}</li>)}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default RoiCalculatorDrawer;
```

- [ ] **Step 2: Verify build + lint**

```bash
cd /home/ubuntu/projects/old/RenoXpert-Frontend-v2.1
npm run build   # expect exit 0
npx eslint src/pages/CampaignPages/components/RoiCalculatorDrawer.tsx --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'   # expect 0
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/CampaignPages/components/RoiCalculatorDrawer.tsx
git commit -m "feat(roi): public RoiCalculatorDrawer (buyer calculator button + drawer)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

## Task B2: Mount on `CampaignLayoutDetailPage`

**Files:**
- Modify: `src/pages/CampaignPages/CampaignLayoutDetailPage.tsx` (import; render before `<ToastContainer`)

**Interfaces:**
- Consumes: `RoiCalculatorDrawer` + `RoiCalcPackage` (Task B1); existing `layout` (`:82`), `layoutPackages` (`:84`), `getQuotationTotal` (`:22`), `Order` (`:19`).

- [ ] **Step 1: Import the drawer**

Add near the other `./components` imports (e.g. after the `CampaignHeader` import):

```tsx
import RoiCalculatorDrawer, { RoiCalcPackage } from './components/RoiCalculatorDrawer';
```

- [ ] **Step 2: Render the drawer (guarded by enabled)**

Immediately before the `<ToastContainer` element in the returned JSX, add:

```tsx
                {layout.roi_calculator && layout.roi_calculator.enabled && (
                    <RoiCalculatorDrawer
                        roi={layout.roi_calculator}
                        packages={layoutPackages.map((p): RoiCalcPackage => ({ id: Number(p.id), name: p.name ?? '', price: getQuotationTotal(p.order as Order | undefined) }))}
                    />
                )}
```

(`layout` is guaranteed non-null here — the page already early-returns a loading/not-found state above when `layout` is null.)

- [ ] **Step 3: Verify build + lint**

```bash
cd /home/ubuntu/projects/old/RenoXpert-Frontend-v2.1
npm run build   # expect exit 0
npx eslint src/pages/CampaignPages/CampaignLayoutDetailPage.tsx --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'   # expect no NEW errors
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/CampaignPages/CampaignLayoutDetailPage.tsx
git commit -m "feat(roi): mount ROI calculator on the campaign layout page

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

## Task B3: Mount on `CampaignPackageDetailPage` (quotation sub-page)

**Files:**
- Modify: `src/pages/CampaignPages/CampaignPackageDetailPage.tsx` (imports; resolve layout + packages; render)

**Interfaces:**
- Consumes: `RoiCalculatorDrawer` + `RoiCalcPackage` (Task B1); existing `campaign` state, `selectedCampaignPackage` (`~:99`), `getQuotationTotal` (add import), `Order` (`:6`).

- [ ] **Step 1: Add imports**

Add:

```tsx
import { getQuotationTotal } from '../../utils/quotationPricing';
import RoiCalculatorDrawer, { RoiCalcPackage } from './components/RoiCalculatorDrawer';
```

(`getQuotationPackagePrice` is already imported from `quotationPricing`; add `getQuotationTotal` alongside it or as a separate import line.)

- [ ] **Step 2: Resolve the layout for the viewed package**

Inside the component body, after `selectedCampaignPackage` is defined, add:

```tsx
    const roiLayoutTypeId = selectedCampaignPackage?.layout_type_id;
    const roiLayout = (campaign?.layout_types ?? []).find((lt) => String(lt.id) === String(roiLayoutTypeId)) ?? null;
    const roiLayoutPackages = (campaign?.packages ?? []).filter((p) => String(p.layout_type_id) === String(roiLayoutTypeId));
```

- [ ] **Step 3: Render the drawer (guarded)**

As the last child of the component's root returned element (immediately before its closing tag), add:

```tsx
            {roiLayout?.roi_calculator && roiLayout.roi_calculator.enabled && (
                <RoiCalculatorDrawer
                    roi={roiLayout.roi_calculator}
                    packages={roiLayoutPackages.map((p): RoiCalcPackage => ({ id: Number(p.id), name: p.name ?? '', price: getQuotationTotal(p.order as Order | undefined) }))}
                />
            )}
```

- [ ] **Step 4: Verify build + lint + spot-check**

```bash
cd /home/ubuntu/projects/old/RenoXpert-Frontend-v2.1
npm run build   # expect exit 0
npx eslint src/pages/CampaignPages/CampaignPackageDetailPage.tsx --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'   # expect no NEW errors
```

Spot-check (manual, when running the app): open a layout with a configured, enabled ROI calculator → the floating "ROI Calculator" button appears on both the layout page and its quotation page; the drawer's Optimized column reproduces the configured numbers (Astrum A → RM3,150 / 9.0% at 100%). Open a layout with no/disabled ROI config → no button, static rental-projection image unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/pages/CampaignPages/CampaignPackageDetailPage.tsx
git commit -m "feat(roi): mount ROI calculator on the quotation sub-page

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

## Finalization (after all tasks + whole-branch review)

- **Frontend:** merge the branch into `production` (`--no-ff`) and push. No backend change, no migration.
- **Deploy note:** the calculator appears only on layouts whose `roi_calculator` is configured + enabled (via the SP-A builder). Unconfigured layouts are unchanged (static image, no button).
- After this, the two throwaway prototypes `roi-demo.html` / `roi-builder-demo.html` in the repo root can be deleted (design reference only).

## Self-Review (completed)

- **Spec coverage:** floating button + drawer on layout page (B2) and quotation sub-page (B3) ✓; strategy/partition/occupancy-stepper/SPA controls (B1) ✓; always-on 3-col comparison with highlight + ranges as "RM x - RM y" (B1) ✓; Profit→Difference→Cost emphasis band (B1) ✓; renovation cost from linked package via `getQuotationTotal`, partition swaps package (B1 resolve + B2/B3 price build) ✓; static-image fallback when disabled/null (guards in B2/B3, image untouched) ✓; compute via existing util, not reimplemented (B1 imports) ✓.
- **Type consistency:** `RoiCalcPackage = {id,name,price}` defined in B1, consumed identically in B2/B3; `RoiScenario`/util fn names match `roiCalculator.ts` exports from SP-A; `roi_calculator` accessed as `RoiCalculator | null` per the SP-A type; `getQuotationTotal(p.order as Order | undefined)` matches the existing idiom.
- **Placeholder scan:** no TBD/TODO; complete code in every step.
- **No test runner:** verification is build + lint + the documented Astrum-A spot-check.
