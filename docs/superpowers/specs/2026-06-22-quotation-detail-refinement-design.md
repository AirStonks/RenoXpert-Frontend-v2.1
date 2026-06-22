# Quotation Detail Refinement (Sub-project A) — Design Spec

- **Date:** 2026-06-22
- **Status:** Proposed — awaiting user review before implementation planning
- **Owner:** Frontend (RenoXpert-Frontend-v2.1), branch base `production`
- **Part of:** "RenoXpert Campaign Refindment" (Phase 2). This is sub-project **A** of three (A = Quotation Detail, B = Layout Type system, C = Inline video). A is **frontend-only**.

---

## 1. Context & Goal

The public, **view-only** quotation page (`src/pages/CampaignPages/CampaignPackageDetailPage.tsx`, 985 lines) renders a campaign package's quotation. It was reskinned in Phase 1 (Premium Minimal, crimson) and reuses the `CampaignPages/components/` primitives (`Card`, `Tabs`, `AccordionItem`, `Pill`).

Its "quotation" is **not** the `quotations` table — it is an **`Order` template** reached via `selectedCampaignPackage.order` (`templateOrder`), whose `latest_quotation.packages` array drives all pricing. The three programs are derived from the order flags: **Reno Subscription** (`is_be_powered`), **RenoNow PayLater** (`is_rnpl`), and **Full Payment** (normal). All pricing is computed **client-side** via `useMemo` — there is no stored "Initial Down Payment" column.

**Goal:** Add four owner-facing refinements to this page, without changing the existing pricing math or the booking/payment flow (which lives on the *landing* page, not here):

- **Q1** — Booking-fee breakdown in the pricing summary.
- **Q2** — Toggle-able add-on packages (client-side price preview).
- **Q3** — A mobile sticky payment-summary bar.
- **Q4** — A Terms & Conditions clause stating payment = acknowledgement.

## 2. Scope

**In scope — exactly one file:** `src/pages/CampaignPages/CampaignPackageDetailPage.tsx`.

**Out of scope:** any backend change; the `quotations` table; routing/services (`getCampaign`); the landing page (`CampaignDetailPage.tsx`); the Owner pages; sub-projects B and C. No new files (reuse existing primitives). No new dependencies.

## 3. Constraints — behavior preservation

These must remain functionally unchanged:

- All existing pricing `useMemo`s and their formulas: `bonus`, `selectedProgram`, `upfrontAmount`, `totalExcludedAddonAmount`, `totalRenoNowPrice`, `bonusValue`, `overrideTotalQuotationAmount` (via `getRenoSubscriptionFixedOverrideNettAmount`), `displayTotalQuotationAmount`.
- The **`f_1` fixed-total short-circuit** in `totalExcludedAddonAmount` (line 146): when `templateOrder.f_1 && total_amount != null`, the total is locked.
- Program branching in the Payment Summary (lines 683–761) and Initial/Balance rows (lines 814–893).
- `selectedPlan` (`'36'`/`'60'`) tenure select, `activeTab`, `expandedPackageIds`/`togglePackage`, `document.title`, `navigate(-1)`, loading/error/empty guards.
- The T&C section content, the `#tnc-sec-N` anchors, and the desktop contents index.
- The page stays **view-only**: no booking/pay button is added.

The only logic change is making `is_addon_included` **reactive to user toggles** (Q2). Everything else is additive/presentational.

## 4. Feature designs

### 4.1 Q1 — Booking-fee pricing breakdown *(breakdown card only)*

**Decision (locked):** the booking-fee breakdown appears **only** in the Pricing-summary card's Initial Down Payment block. The Payment Summary headline (lines 683–761) and the sticky bar stay **gross** (unchanged). Rationale: the per-month "normal" headline doesn't map to a one-off fee; keeping the deduction in the breakdown matches the spec's "Pricing breakdown" wording and avoids inconsistent figures.

**Source values:**
- `bookingFee = Number(selectedCampaignPackage?.booking_amount || 0)` (already available on the page).
- `originalInitialDownPayment` = the value the Initial Down Payment row shows **today**, per program:
  - `bePowered`: `upfrontAmount - bonusValue`
  - `rnpl`: `totalRenoNowPrice`
  - normal / progressive: `totalExcludedAddonAmount / 2`
- `netInitialDownPayment = originalInitialDownPayment - bookingFee`.

**Render** — replace the single Initial Down Payment row (lines 814–842). Keep the existing outer visibility condition `(!is_progressive_payment && !is_be_powered && !is_rnpl) ? null : (...)`. Inside, when `bookingFee > 0` render three lines (order matches the spec):

```
Booking Fee                          − RM 500     ·  Non-refundable
Initial Down Payment                   RM 4,500
   Original Initial Down Payment        RM 5,000          (muted sub-item)
```

- **Booking Fee** row: value rendered as a negative (`− RM {bookingFee}`) in a distinct tone (red/`text-red-600`), with a small "Non-refundable" tag (`text-xs text-slate-400` or a `Pill tone="red"`).
- **Initial Down Payment** row: the headline value = `netInitialDownPayment` (replaces what the row shows today).
- **Original Initial Down Payment**: muted sub-row (`text-xs text-slate-400`, indented) showing `originalInitialDownPayment`.

When `bookingFee <= 0`: render exactly the current single Initial Down Payment row (no booking-fee/original lines) — no visual change for campaigns without a booking fee.

All three values use the existing `toLocaleString` formatting. The **Balance Payment** row (844–893) is unchanged.

### 4.2 Q2 — Toggle-able add-on packages *(client-side, preview-only)*

**Decision (locked):** purely a client-side price preview. Nothing persists to the backend; the booking flow is unaffected.

**State & derivation:**
- New state: `const [addonOverrides, setAddonOverrides] = useState<Record<string, boolean>>({})` keyed by `String(pkg.id ?? pkg.name)`.
- New memo `effectivePackages` derived from `templateQuotation?.packages`: for each package, the effective inclusion is `id in addonOverrides ? addonOverrides[id] : (pkg.is_addon_included !== false)`. Non-add-on packages pass through unchanged; add-on packages get `{ ...pkg, is_addon_included: effectiveIncluded }`.
- **Repoint the two pricing memos** `upfrontAmount` and `totalExcludedAddonAmount` to read `effectivePackages` instead of `templateQuotation?.packages` (and add `effectivePackages` to their dep arrays). Their internal formulas are otherwise **unchanged** — they already exclude `is_addon && is_addon_included === false`. This makes totals, Payment Summary, Initial/Balance rows, and the Q1 breakdown all recompute on toggle.
- The render IIFE (line 898) reads `effectivePackages` so the add-on list and dimming reflect state.

**Toggle handler:**
```
const toggleAddon = (pkg) => {
  const id = String(pkg.id ?? pkg.name);
  const current = id in addonOverrides ? addonOverrides[id] : (pkg.is_addon_included !== false);
  setAddonOverrides(prev => ({ ...prev, [id]: !current }));
};
```

**UI:** on each add-on's `AccordionItem` header (the `isAddon` branch, lines 916–920), add an Included/Excluded toggle switch (port the visual pattern from `src/pages/Order/components/SortablePackageItem.tsx:371–387`). Clicking it calls `toggleAddon` and must **not** toggle the accordion (`stopPropagation`). When excluded, dim the row (`opacity-60`) and show an "Excluded" label; when included, "Included".

**Edge case — `f_1` locked total:** when `templateOrder?.f_1` is set, `totalExcludedAddonAmount` returns the fixed `total_amount` regardless of add-ons, so a toggle would do nothing. Therefore **hide the toggle when `templateOrder?.f_1` is truthy** — add-ons remain listed read-only (current behavior preserved). This is the only program-conditional in Q2.

### 4.3 Q3 — Mobile sticky payment bar *(appear after scroll)*

**Decision (locked):** hidden until the Payment Summary card scrolls out of view, then it slides up.

- Attach a `ref` to the Payment Summary `Card` (line 660). Add `const [showStickyBar, setShowStickyBar] = useState(false)`.
- In a `useEffect`, create an `IntersectionObserver` on that ref; set `showStickyBar` to `true` when the card is **not** intersecting (scrolled past), `false` otherwise. Clean up the observer on unmount / when the ref/tab changes. Guard for `ref.current` existing (it only renders on the quotation tab with a valid `templateOrder`).
- Render a bar as a page-level child, shown only when `activeTab === 'quotation' && showStickyBar`: classes `lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3` with a subtle slide-in.
- **Content** mirrors the Payment Summary's primary figure per program (reuse the same expressions, gross — consistent with the Q1 decision):
  - normal: `RM {((totalExcludedAddonAmount - bonusValue) * (selectedPlan==='60'?1.14:1.105) / Number(selectedPlan))} /mo`
  - bePowered: `RM {upfrontAmount - bonusValue} upfront` + `RM {installment} /mo`
  - rnpl: `Kickstart RM {totalRenoNowPrice}`
  - Plus the program `Pill`. No CTA button (page is view-only).
- Because the bar is `lg:hidden`, the observer state is harmless on desktop.

### 4.4 Q4 — T&C acknowledgement clause *(informational)*

Add to the `tnc` JSX (starts line 189). Two additive edits, no removals:

1. A highlighted callout after the opening paragraphs (≈ after line 197):
   ```
   <div className="rounded-xl bg-campaign-50 border border-campaign-100 p-4">
     <p className="text-sm text-slate-700">
       <strong>Payment constitutes acknowledgement.</strong> By making any payment toward
       this quotation, the Owner acknowledges having read, understood, and agreed to this
       quotation and these Terms &amp; Conditions.
     </p>
   </div>
   ```
2. A matching numbered sub-point under **§3 Payment Terms** so it appears in context (and is reachable from the `#tnc-sec-3` anchor).

No checkbox, no gating, no backend field. Existing clauses (incl. line 196 "...acceptance, signature, or payment...") are left intact.

## 5. Data dependency check

- `selectedCampaignPackage.booking_amount` — confirmed present on the `CampaignPackage` type and returned by the public campaign endpoint (the landing page already renders it as "Booking Fee"). No API change needed for Q1.
- `templateQuotation.packages[].is_addon` / `is_addon_included` — present and already consumed by the pricing memos. No API change for Q2.

## 6. Verification plan

- **Build gate:** `npm run build` (`tsc -b && vite build`) exits 0. Scoped lint: `npx eslint src/pages/CampaignPages/CampaignPackageDetailPage.tsx --ext ts,tsx --max-warnings 0` exits 0. (Project-wide `npm run lint` is pre-existingly broken per the Phase-1 plan — not a gate.)
- **Manual QA** at 375 / 768 / 1280 against a campaign package for **each program** (bePowered, rnpl, normal, and a progressive normal):
  - Q1: booking-fee row (negative, non-refundable), Original sub-item, and net Initial Down Payment = Original − booking fee; correct for each program; and the no-booking-fee case renders the single legacy row.
  - Q2: toggling an add-on dims it and updates Total Quotation Amount, Payment Summary, Initial/Balance, and the Q1 breakdown live; `f_1` orders show no toggle.
  - Q3: on mobile the bar appears only after scrolling past the Payment Summary card and shows the correct per-program figure; absent on desktop.
  - Q4: callout + §3 clause render; `#tnc-sec-3` anchor still scrolls correctly.
- **Behavior review:** diff confirms no pricing formula changed except the `effectivePackages` indirection; no pay button added; T&C content/anchors intact.

## 7. Risks & mitigations

- **Breaking pricing while wiring `effectivePackages`** → keep the reduce bodies byte-for-byte; only swap the source array + deps. Verify totals match pre-change when no toggle is touched.
- **IntersectionObserver lifecycle** (tab switches, re-mounts) → guard `ref.current`, re-run effect on `activeTab`/`templateOrder` changes, disconnect on cleanup.
- **No automated tests** in repo → rely on build + scoped lint + the manual matrix above.
