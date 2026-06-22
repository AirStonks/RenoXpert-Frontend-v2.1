# Layout Type System — Phase B3 (Public) Design Spec — REVISED (multi-page)

- **Date:** 2026-06-22
- **Status:** Proposed — awaiting user review before implementation planning
- **Owner:** Frontend (RenoXpert-Frontend-v2.1), base branch `production`
- **Part of:** Sub-project B (Layout Type). **B1 backend ✅ (PR #3), B2 admin ✅ merged.** This is **B3 (public)**.
- **Supersedes** the inline two-level design in `2026-06-22-layout-type-system-design.md` §7 (layout cards → sub-packages on the *same* page). That approach is replaced by the multi-page flow below.

---

## 1. Context & Goal

B1/B2 give campaigns optional Layout Types (each with a rental projection + renderings) and sub-packages assigned to them, exposed publicly via `getCampaign(slug)` → `campaign.layout_types[]` (with images) + `campaign.packages[]` (each with `layout_type_id`, and its `order.latest_quotation` for pricing).

**New flow (user decision):**
- The **campaign landing** shows **only the Layout Types** (cards). Selecting one **navigates** to a new page.
- A new **Campaign Layout Detail** page shows that layout's **photos** (rental projection + renderings, tap-to-enlarge) + its **packages** (sub-packages) + the **booking form** (booking moves here).
- **Flat campaigns** (no layout types) keep today's single-page landing (packages + booking inline) **unchanged**.

Mockup (approved): `docs/superpowers/mockups/2026-06-22-layout-multipage-flow.html`.

## 2. Scope

**Frontend only.**
- `src/App.tsx` — add the Layout Detail route in **both** campaign route groups (`/campaigns/...` and `/campaign/campaigns/...`).
- `src/pages/CampaignPages/CampaignDetailPage.tsx` (landing) — when the campaign has layout types, render **Layout Type cards** that link to the Layout Detail page, and **suppress** the package-selection + booking form + mobile sticky CTA (those move to the detail page). When the campaign is flat, render **exactly as today**.
- **New** `src/pages/CampaignPages/CampaignLayoutDetailPage.tsx` — the new page (photos + packages + booking).
- `src/utils/quotationPricing.ts` — add `getInitialDownPayment(order)` (the per-program "Start from" figure), reusing the existing `getQuotationPackagePrice`.
- Reuse existing `getCampaign`, `bookingPaymentIntent`, and the Phase-1 primitives (`Card`, `Pill`, `Button`, `Field`, `CampaignHeader`). Reuse the C-style modal/lightbox for photos.

**Out of scope:** backend (B1 done); admin (B2 done); the existing per-package Quotation Detail page (`CampaignPackageDetailPage`) stays as-is and is still reached via "View Quotation"; flat-campaign behavior; FAQ.

## 3. Constraints

- **Flat campaigns unchanged:** if `campaign.layout_types?.length` is falsy, the landing renders today's package-selection + booking flow with zero changes. The layout flow is gated on layout types existing.
- **Booking moves to the Layout Detail page** — the landing no longer books for layered campaigns; the detail page hosts the booking form + `bookingPaymentIntent` flow.
- **Route:** `/campaigns/:campaignSlug/layouts/:layoutTypeId` (+ the `/campaign/campaigns/...` mirror), added in `App.tsx` (next to the existing `.../packages/:campaignPackageId` routes).
- **"View Quotation"** on a sub-package card still links to the existing Quotation Detail page (`/campaigns/:slug/packages/:campaignPackageId`).
- **No new backend call:** the Layout Detail page calls the SAME `getCampaign(slug)`, resolves the layout by `layoutTypeId`, and filters `campaign.packages` to those with that `layout_type_id`.
- **"Start from"** = the package's Initial Down Payment, via the shared `getInitialDownPayment(order)` util (consistent with the Quotation Detail page's Original Initial Down Payment at default add-on inclusion; reuses `getQuotationPackagePrice`).
- **Photos tap-to-enlarge** for BOTH the rental projection and every rendering (shared lightbox, C modal pattern). Each package card shows the **Booking Fee** with a small red **"Non-refundable"** beneath it (per the mock).
- **No new dependencies.** **Verification gate:** `npm run build` exit 0 + scoped eslint introduces no new errors (the new files + `quotationPricing.ts` must be clean; `CampaignDetailPage` is clean at baseline → must stay clean). No test runner.

## 4. Routing (`App.tsx`)
Add, in both groups (after the `packages/:campaignPackageId` line at ~299 and ~450):
```tsx
{ path: '/campaigns/:campaignSlug/layouts/:layoutTypeId', element: <CampaignLayoutDetailPage />, layout: null },
// and the /campaign/campaigns/... mirror
```
Import the new page alongside the other campaign-page imports (~line 128).

## 5. Landing changes (`CampaignDetailPage.tsx`)
- Compute `const layoutTypes = campaign.layout_types ?? []` and `const isLayered = layoutTypes.length > 0`.
- **If `isLayered`:** replace the package-selection grid + booking form + mobile sticky bar with a **"Choose your layout"** section: Layout Type cards (each showing the layout's `rental_projection` image, `name`, `description`, a "Start from RM{min over its packages}" teaser, and a "View layout ›" affordance) wrapped in a `<Link to={`layouts/${layoutType.id}`}>` (relative to the campaign route). The hero (title/benefits/video) stays.
- **If flat:** render today's tree unchanged (no behavior change). All existing booking state/handlers remain for the flat path.
- Keep the existing loading/error/fully-booked states.

## 6. New page (`CampaignLayoutDetailPage.tsx`)
- **Params:** `useParams<{ campaignSlug; layoutTypeId }>()`. **Fetch:** `getCampaign(campaignSlug)` (same as the other pages). Resolve `layout = campaign.layout_types.find(id == layoutTypeId)`; `packages = campaign.packages.filter(p => String(p.layout_type_id) === layoutTypeId)`. Loading / error / "layout not found" / "no packages" guards.
- **Top bar:** `CampaignHeader` / back button → campaign landing; eyebrow = campaign title; title = layout name.
- **Photos:** a prominent **Rental Projection** (from `layout.rental_projection`, tap-to-enlarge) + a **Renderings** grid (`layout.rendering_images[]`, each tap-to-enlarge) — shared lightbox (`videoOpen`-style state; reuse the C modal pattern). Hide a photo section if its data is absent.
- **Packages:** sub-package cards (one per filtered package): name, **"Start from RM{getInitialDownPayment(pkg.order)}"** (H3), **Booking Fee RM{pkg.booking_amount}** + small red **"Non-refundable"**, a radio to select (drives the booking form), and **"View Quotation ›"** → `/campaigns/:slug/packages/:pkg.id` (only when `pkg.order_id`). Slot/"Most popular" badges as on the current landing cards.
- **Booking form** (the flow ported from the landing): `name/phone/email` (`Field`s, phone numeric filter), the selected sub-package's Booking Fee, and a submit that calls `bookingPaymentIntent(campaignSlug, name, phone, email, selectedPackage.id)` → `window.location.href = result[0].url`, with the existing `fully_redeemed` 400 handling + toasts. Desktop: sticky right column; mobile: sticky bottom CTA. Default-select the first available sub-package (slot_remaining > 0).
- Reuse the crimson primitives and the existing booking-amount/security/trust treatment from the landing.

## 7. Shared util — `getInitialDownPayment(order)`
Add to `src/utils/quotationPricing.ts`. Computes the per-program Initial Down Payment from a template `order` (mirrors `CampaignPackageDetailPage`'s `originalInitialDownPayment` at default add-on inclusion):
- `bePowered`: `upfront − bonus` where `upfront = be_powered_base_price + Σ one-off packages (markup_amount ?? total_price)×qty`.
- `rnpl`: `rnpl_base_price`.
- normal/Full Payment: `totalExcludedAddonAmount / 2`, where `totalExcludedAddonAmount = Σ getQuotationPackagePrice(included packages)` (honoring the `f_1` fixed-total short-circuit), reusing the shared `getQuotationPackagePrice`.
- Reads `order.latest_quotation` (packages, bonus). Uses default `is_addon_included` (the card is a non-interactive teaser). Returns a number (0 if unresolved). This is the "Start from" value; it equals the Quotation Detail page's Original Initial Down Payment at default inclusion.

## 8. Verification plan
- `npm run build` exit 0; scoped eslint on `App.tsx`, `CampaignDetailPage.tsx`, `CampaignLayoutDetailPage.tsx`, `quotationPricing.ts` → no new errors (new files clean).
- Manual QA at 375/768/1280 (after B1 merged + migrated, against the API): a **layered** campaign — landing shows only layout cards → tap navigates to `/campaigns/:slug/layouts/:id` → photos enlarge, packages show correct "Start from" + Booking Fee + Non-refundable, "View Quotation" opens the quotation detail, booking submits → payment redirect, fully_redeemed handled; a **flat** campaign — landing + booking unchanged.
- Cross-check: a sub-package's "Start from" equals the Original Initial Down Payment shown on its Quotation Detail page (default inclusion).

## 9. Risks & mitigations
- **Booking-flow duplication** (landing flat path vs new page) → port the booking logic carefully; consider a small shared booking hook/component if it stays in sync easily, else duplicate with a note. Keep the flat landing path byte-identical.
- **Flat regression** → gate everything on `isLayered`; flat path untouched.
- **"Start from" vs Quotation Detail mismatch** → both go through `getInitialDownPayment`/`getQuotationPackagePrice`; verify equality at default inclusion.
- **Layout/packages resolution** when `layout_type_id` is null or the id is unknown → guard with "layout not found" / "no packages" empty states.

## 10. Non-goals
- No backend change; no change to the Quotation Detail page; no per-layout video; no drag/reorder. The inline two-level UI (old §7) is dropped in favor of this multi-page flow.

## 11. Suggested plan tasks
B3a: routing + `getInitialDownPayment` util. B3b: landing layout-cards (gated; flat unchanged). B3c: the new `CampaignLayoutDetailPage` (photos + packages + booking). (B3a is the prerequisite; B3b/B3c are independent.)
