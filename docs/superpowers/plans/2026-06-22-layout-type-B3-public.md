# Layout Type System — Phase B3 (Public, multi-page) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use `- [ ]`. **Task 3 (new page) is a guided build — dispatch on a capable model; the implementer must READ `CampaignDetailPage.tsx` (booking flow) and the mockup before writing.**

**Goal:** Replace the inline two-level layout UI with a multi-page flow: the campaign landing shows only Layout Types (select → navigate) and a new Campaign Layout Detail page shows the layout's photos + packages + booking. Flat campaigns are unchanged.

**Architecture:** Frontend only. Add a route + a new page `CampaignLayoutDetailPage`. The landing gates its package/booking section behind `isLayered` and renders layout-type cards (links) when the campaign has layout types. A shared `getInitialDownPayment(order)` util (reusing `getQuotationPackagePrice`) powers the "Start from" figure. The new page reuses `getCampaign`/`bookingPaymentIntent` and the Phase-1 primitives; booking moves onto it.

**Tech Stack:** React 18 + TS, Vite, Tailwind, react-router-dom, react-toastify. Repo: `/home/ubuntu/projects/old/RenoXpert-Frontend-v2.1`.

**Spec:** `docs/superpowers/specs/2026-06-22-layout-type-B3-public-design.md` (supersedes the old inline §7).
**Mockup:** `docs/superpowers/mockups/2026-06-22-layout-multipage-flow.html`.

## Global Constraints

- **Flat campaigns unchanged:** gate ALL new behavior on `const isLayered = (campaign.layout_types?.length ?? 0) > 0`. When false, the landing renders + books exactly as today.
- **Booking moves to the Layout Detail page** for layered campaigns; the landing only selects a layout. The existing per-package **Quotation Detail page is unchanged** and still reached via "View Quotation".
- **Route:** `/campaigns/:campaignSlug/layouts/:layoutTypeId` plus the `/campaign/campaigns/...` mirror (both groups in `App.tsx`).
- **No new backend call:** the new page calls `getCampaign(campaignSlug)`, resolves the layout by `layoutTypeId`, filters `campaign.packages` to `String(p.layout_type_id) === layoutTypeId`.
- **"Start from"** uses `getInitialDownPayment(pkg.order)`; **Booking Fee** = `pkg.booking_amount` with a small red **"Non-refundable"** beneath it. Photos (rental projection + every rendering) are **tap-to-enlarge** (shared lightbox).
- **No new dependencies.** **Verification gate:** `npm run build` exit 0 + scoped eslint introduces no new errors. Baselines: `CampaignDetailPage.tsx` CLEAN(0); `quotationPricing.ts` CLEAN(0); new `CampaignLayoutDetailPage.tsx` must be CLEAN; `App.tsx` — keep its count unchanged (check baseline). No test runner — don't scaffold one.
- **Co-author trailers** on every commit.

---

### Task 0: Branch + commit docs

- [ ] **Step 1:** `git checkout production && git pull --ff-only && git checkout -b feature/layout-type-public`
- [ ] **Step 2:** commit the B3 spec, this plan, and the multipage mockup:
```bash
git add docs/superpowers/specs/2026-06-22-layout-type-B3-public-design.md docs/superpowers/plans/2026-06-22-layout-type-B3-public.md docs/superpowers/mockups/2026-06-22-layout-multipage-flow.html
git commit -m "docs(campaign): revised B3 public (multi-page layout flow) spec + plan + mockup"
```
(Append trailers.)

---

### Task 1: Routing + `getInitialDownPayment` util

**Files:**
- Modify: `src/App.tsx` (import ~line 128; routes after lines 299 and 450)
- Modify: `src/utils/quotationPricing.ts` (add `getInitialDownPayment`)

**Interfaces produced:** the route `/campaigns/:campaignSlug/layouts/:layoutTypeId` (+ mirror) rendering `<CampaignLayoutDetailPage/>`; `getInitialDownPayment(order): number`.

- [ ] **Step 1: Add `getInitialDownPayment` to `quotationPricing.ts`**

Append (reuses the existing `getQuotationPackagePrice`; mirrors `CampaignPackageDetailPage`'s `originalInitialDownPayment` at default add-on inclusion):
```ts
type OrderWithQuotation = Order & {
    latest_quotation?: { packages?: Package[]; bonus?: unknown } | null;
};

function parseBonusValue(bonus: unknown): number {
    if (!bonus) return 0;
    try {
        const obj = typeof bonus === 'string' ? JSON.parse(bonus) : bonus;
        return Number((obj as { value?: unknown })?.value) || 0;
    } catch {
        return 0;
    }
}

/**
 * Per-program "Initial Down Payment" (the "Start from RMxxx" figure), computed
 * from a template order at DEFAULT add-on inclusion. Mirrors CampaignPackageDetailPage's
 * originalInitialDownPayment so the landing/layout "Start from" matches the
 * Quotation Detail page's Original Initial Down Payment.
 */
export function getInitialDownPayment(order?: OrderWithQuotation | null): number {
    if (!order) return 0;
    const packages: Package[] = order.latest_quotation?.packages ?? [];
    const bonusValue = parseBonusValue(order.latest_quotation?.bonus ?? (order as { bonus?: unknown }).bonus);

    // Reno Subscription (bePowered): upfront (be_powered_base_price + one-off packages) − bonus.
    if (order.is_be_powered) {
        const upfront = packages.reduce((acc, pkg) => {
            const counts = pkg.payment_method === 'one-off' && (pkg.is_addon ? pkg.is_addon_included === true : true);
            const unit = Number(pkg.markup_amount) || Number(pkg.total_price) || 0;
            return acc + (counts ? unit * (pkg.quantity || 1) : 0);
        }, Number(order.be_powered_base_price) || 0);
        return upfront - bonusValue;
    }

    // RenoNow PayLater (rnpl): the RenoNow base price.
    if (order.is_rnpl) {
        return Number(order.rnpl_base_price) || 0;
    }

    // Full Payment / progressive: half of the total (recomputed from products, matching owner).
    if (order.f_1 && order.total_amount != null) {
        return Number(order.total_amount) / 2;
    }
    const total = packages.reduce((sum, pkg) => {
        if (pkg.is_addon === true && pkg.is_addon_included === false) return sum;
        return sum + getQuotationPackagePrice(pkg, order);
    }, 0);
    return total / 2;
}
```
(Ensure `Order` and `Package` are already imported at the top of the file — they are, from Task-fix `import type { Order, Package, Product } from '../types';`.)

- [ ] **Step 2: Import + route the new page in `App.tsx`**

Add the import near the other campaign-page imports (after line 129):
```tsx
import CampaignLayoutDetailPage from './pages/CampaignPages/CampaignLayoutDetailPage';
```
Add the route in BOTH groups. After line 299 (`.../packages/:campaignPackageId` in the first group):
```tsx
        { path: '/campaigns/:campaignSlug/layouts/:layoutTypeId', element: <CampaignLayoutDetailPage />, layout: null },
```
After line 450 (the `/campaign/campaigns/.../packages/:campaignPackageId` mirror):
```tsx
        { path: '/campaign/campaigns/:campaignSlug/layouts/:layoutTypeId', element: <CampaignLayoutDetailPage />, layout: null },
```

- [ ] **Step 3: Verify** — `npm run build` exits 0 (the new page import resolves once Task 3 creates the file; if doing tasks strictly in order, create a minimal placeholder `CampaignLayoutDetailPage` default export first OR run Task 3 before building). Scoped lint `src/utils/quotationPricing.ts` clean; `src/App.tsx` count unchanged.

- [ ] **Step 4: Commit** `git add src/App.tsx src/utils/quotationPricing.ts && git commit -m "feat(campaign): layout detail route + getInitialDownPayment util (B3)"` (+ trailers).

*Note:* to keep the build green at this task boundary, also create the new file's stub in this task (a minimal `export default function CampaignLayoutDetailPage(){ return null }`) and flesh it out in Task 3; or sequence Task 3 immediately and build once.

---

### Task 2: Landing — layout cards (gated); flat path unchanged

**Files:** Modify `src/pages/CampaignPages/CampaignDetailPage.tsx`.
**READ first:** the fetch + default-selection (72–115), `handlePackageChange` (136–146), the "Available Campaign Layout" render — packages-section + booking column + mobile sticky bar (≈ 358–633), and the hero (≈ 294–332).

- [ ] **Step 1: Derive `isLayered`** near the top of the component body (after `campaign` is available in render, or as a memo): `const isLayered = (campaign?.layout_types?.length ?? 0) > 0;` Also import `getInitialDownPayment` from `'../../utils/quotationPricing'` and `Link` is already imported.

- [ ] **Step 2: Render layout cards when `isLayered`**

In the "Available Campaign Layout" branch (the `else` of `isFullyBooked`, ~line 358), when `isLayered`, render a **"Choose your layout"** section INSTEAD of the package-selection grid + the booking column + the mobile sticky bar. Each card links to the layout detail route and shows the layout's rental-projection image, name, description, and a "Start from RM{min}" teaser:
```tsx
{isLayered ? (
    <div className="lg:col-span-3 space-y-4 sm:space-y-6">
        <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Choose your layout</h2>
            <p className="text-base text-slate-500">Pick a layout to see its photos, packages and pricing.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {(campaign.layout_types ?? []).map((lt) => {
                const ltPackages = (campaign.packages ?? []).filter((p) => String(p.layout_type_id) === String(lt.id));
                const startFrom = ltPackages.reduce((min, p) => {
                    const v = getInitialDownPayment(p.order as Order | undefined);
                    return v > 0 && (min === 0 || v < min) ? v : min;
                }, 0);
                const proj = lt.rental_projection as Attachment | undefined;
                return (
                    <Link
                        key={String(lt.id)}
                        to={`layouts/${lt.id}`}
                        className="group block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_28px_rgba(16,24,40,0.06)] hover:shadow-lg transition"
                    >
                        <div className="h-36 w-full bg-slate-100">
                            {proj?.file_url ? (
                                <img src={proj.file_url} alt={lt.name} className="h-36 w-full object-cover" />
                            ) : (
                                <div className="h-36 w-full grid place-items-center text-slate-400"><Package className="h-10 w-10" /></div>
                            )}
                        </div>
                        <div className="p-5">
                            <h3 className="text-lg font-bold text-slate-900">{lt.name}</h3>
                            {lt.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{lt.description}</p>}
                            <div className="mt-4 flex items-center justify-between">
                                {startFrom > 0 && (
                                    <span className="text-sm text-slate-400">Start from <span className="font-bold text-campaign">RM {startFrom.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span></span>
                                )}
                                <span className="text-sm font-semibold text-campaign inline-flex items-center gap-1">View layout <ArrowRight className="h-4 w-4" /></span>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    </div>
) : (
    /* existing package-selection left column + booking right column + (later) mobile sticky bar — UNCHANGED */
    ...existing JSX...
)}
```
Wrap the existing left-column (packages) + right-column (booking) in the `: ( ... )` flat branch. Also gate the **mobile sticky bottom bar** (the `{!isFullyBooked && (<div className="lg:hidden sticky bottom-0 ...">...)}` near line 617) to additionally require `!isLayered` (so it doesn't show on layered campaigns). `Attachment` and `Order` types: import if not already (`Attachment` likely already imported; add `Order` to the type import if needed).

- [ ] **Step 3: Verify** — `npm run build` exit 0; scoped eslint `CampaignDetailPage.tsx` CLEAN (no new errors). Manual: a flat campaign renders + books exactly as before; a layered campaign shows only layout cards (no package grid/booking form/sticky bar) and each card links to `/campaigns/:slug/layouts/:id`.

- [ ] **Step 4: Commit** `git add src/pages/CampaignPages/CampaignDetailPage.tsx && git commit -m "feat(campaign): landing shows layout-type cards for layered campaigns (B3)"` (+ trailers).

---

### Task 3: New page `CampaignLayoutDetailPage.tsx` (photos + packages + booking)

**Files:** Create `src/pages/CampaignPages/CampaignLayoutDetailPage.tsx`.
**Guided build — READ first:** `CampaignDetailPage.tsx` in full (reuse: fetch via `getCampaign`, `formData`/`handleInputChange` with the phone numeric filter, `handleSubmit` = `bookingPaymentIntent(campaignSlug, name, phone, email, selectedPackage.id)` → `window.location.href = response.result[0].url` + the `fully_redeemed` 400 handling + `toast`/`ToastContainer`, the `Field` booking form, the package card markup, loading/error states); the mockup `2026-06-22-layout-multipage-flow.html` (Page 2 layout); and `CampaignPackageDetailPage.tsx` for the C-style photo lightbox pattern (`Play`/`X`, modal).

**Interfaces consumed:** `getCampaign`, `bookingPaymentIntent` (publicApi); `getInitialDownPayment` (Task 1); primitives `Card`, `Pill`, `Button`, `Field`, `CampaignHeader`, `buttonClasses`.

- [ ] **Step 1: Create the page**

Build `CampaignLayoutDetailPage` with this structure (reuse the landing's exact booking logic/markup — do NOT reinvent the booking flow):
- `const { campaignSlug, layoutTypeId } = useParams<{ campaignSlug: string; layoutTypeId: string }>();`
- Fetch the campaign via `getCampaign(campaignSlug)` (mirror the landing's `useEffect` + loading/error). Then:
  - `const layout = campaign.layout_types?.find((lt) => String(lt.id) === String(layoutTypeId)) ?? null;`
  - `const layoutPackages = (campaign.packages ?? []).filter((p) => String(p.layout_type_id) === String(layoutTypeId));`
  - Guards: loading skeleton; error card; "Layout not found" (no `layout`); "No packages yet" (empty `layoutPackages`).
  - Default `selectedPackage` = first `layoutPackages` with `slot_remaining > 0` (fallback first); `isFullyBooked` = all sold out.
- **State/handlers ported from the landing:** `formData {name,phone,email}`, `handleInputChange` (verbatim incl. phone numeric filter), `isSubmitting`, `handleSubmit` (verbatim `bookingPaymentIntent(...selectedPackage?.id)` flow incl. `fully_redeemed` handling + toasts), `<ToastContainer/>`. Plus a photo lightbox: `const [photo, setPhoto] = useState<string | null>(null)` + a fixed modal (`bg-black/80`, `<img src={photo}>`, close via X / backdrop / Esc — reuse the C pattern).
- **Render:**
  - Top bar: `CampaignHeader` or a back button → `/campaigns/${campaignSlug}`; eyebrow = campaign title; title = `layout.name`.
  - **Rental Projection:** if `layout.rental_projection?.file_url`, a large image button → `setPhoto(file_url)` (tap-to-enlarge).
  - **Renderings:** grid of `layout.rendering_images?.map(img => <button onClick={() => setPhoto(img.file_url)}><img .../></button>)` (tap-to-enlarge); hide section if empty.
  - **Packages:** for each `layoutPackages` pkg, a selectable card (reuse the landing's package-card markup) showing name, slot/"Most popular" badges, **"Start from RM{getInitialDownPayment(pkg.order)}"**, **Booking Fee RM{pkg.booking_amount}** + a small red `Non-refundable` (`text-[10px] sm:text-xs font-semibold text-red-600`), a radio (select → `setSelectedPackage`), and **"View Quotation"** `<Link to={`/campaigns/${campaignSlug}/packages/${pkg.id}`}>` when `pkg.order_id`.
  - **Booking form:** the landing's booking `Card` (name/phone/email `Field`s, booking-amount block, submit `Button` with `isSubmitting` spinner) bound to `selectedPackage`; desktop sticky right column; mobile sticky bottom CTA (only when `!isFullyBooked`).
  - Loading/error/fully-booked states mirror the landing.

Keep it lint-clean (no `any`; type `layout` as `CampaignLayoutType`, images as `Attachment`, `pkg.order as Order`). Reuse `getInitialDownPayment` for "Start from".

- [ ] **Step 2: Verify** — `npm run build` exit 0; `npx eslint src/pages/CampaignPages/CampaignLayoutDetailPage.tsx --ext ts,tsx --max-warnings 0` exit 0 (clean). Manual (with API): navigate from a landing layout card → photos enlarge; packages show correct Start from + Booking Fee + Non-refundable; View Quotation opens the quotation detail; booking submits → payment redirect; fully_redeemed handled.

- [ ] **Step 3: Commit** `git add src/pages/CampaignPages/CampaignLayoutDetailPage.tsx && git commit -m "feat(campaign): Campaign Layout Detail page — photos + packages + booking (B3)"` (+ trailers).

---

### Task 4: Full verification & finalize

- [ ] **Step 1:** `npm run build` exit 0; scoped eslint on App.tsx (count unchanged), quotationPricing.ts (clean), CampaignDetailPage.tsx (clean), CampaignLayoutDetailPage.tsx (clean).
- [ ] **Step 2: Manual QA matrix** (needs B1 merged + migrated): layered campaign full journey (landing layout cards → detail photos/packages/booking → pay; View Quotation; fully-booked); flat campaign unchanged (landing + booking + sticky bar as before); "Start from" == Quotation Detail Original Initial Down Payment.
- [ ] **Step 3: Finalize** via `superpowers:finishing-a-development-branch` for `feature/layout-type-public` (FE production not protected → merge + push, or PR).

---

## Self-Review

**Spec coverage:** §4 routing → Task 1 Step 2; §7 util → Task 1 Step 1; §5 landing (gated cards, flat unchanged) → Task 2; §6 new page (photos/packages/booking, Non-refundable, View Quotation, ported booking) → Task 3; §8 verification → per-task + Task 4. All B3 spec items map to a task.

**Placeholder scan:** Task 1 (util + routes) is fully literal. Task 2 gives the layout-cards JSX literally + exact gating anchors. Task 3 is a flagged guided build: it specifies the page's structure + all NEW logic (params/fetch/resolve/util/lightbox) literally and instructs reuse of the landing's booking flow/markup verbatim (reproducing the full ~350-line page in the plan isn't practical); not a vague TODO.

**Type/shape consistency:** `getInitialDownPayment(order)` (Task 1) is used in Task 2 (landing "Start from" min) and Task 3 (per-package "Start from"); it reuses `getQuotationPackagePrice` and mirrors the detail page's per-program formula (bePowered upfront uses markup??total_price; normal uses products-recompute; rnpl base; f_1 → total/2). Route param `layoutTypeId` matches `useParams` in Task 3 and the `to={`layouts/${lt.id}`}` links in Task 2. `bookingPaymentIntent(campaignSlug, name, phone, email, selectedPackage.id)` matches the publicApi signature. `campaign.layout_types[].rental_projection/rendering_images` (Attachment) and `packages[].layout_type_id` match the B1 API + the FE types added in B2.
