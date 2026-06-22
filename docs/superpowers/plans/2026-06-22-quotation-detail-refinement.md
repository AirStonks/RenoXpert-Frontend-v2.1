# Quotation Detail Refinement (Sub-project A) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four owner-facing refinements to the public, view-only quotation page — a non-refundable booking-fee breakdown (Q1), client-side toggle-able add-ons (Q2), a mobile sticky payment bar (Q3), and a T&C "payment = acknowledgement" clause (Q4) — without changing the existing pricing math or the booking flow.

**Architecture:** All changes live in one file, `src/pages/CampaignPages/CampaignPackageDetailPage.tsx`, and reuse the existing Phase-1 primitives (`Card`, `Tabs`, `AccordionItem`, `Pill`). Q2 introduces an `effectivePackages` memo so the existing pricing `useMemo`s become reactive to user toggles; the two pricing reducers are otherwise unchanged. Q1/Q3 are presentational derivations over existing computed values; Q4 is static JSX in the `tnc` block.

**Tech Stack:** React 18 + TypeScript, Vite, Tailwind CSS 3 (Metronic theme, crimson `campaign` token), lucide-react + @heroicons icons. No test runner in this repo.

**Design spec:** `docs/superpowers/specs/2026-06-22-quotation-detail-refinement-design.md`
**Visual reference (mockup):** `docs/superpowers/mockups/2026-06-22-quotation-detail-refinement.html`

## Global Constraints

- **Single file:** only `src/pages/CampaignPages/CampaignPackageDetailPage.tsx` changes. No new files, no new dependencies, no backend/API/service/routing changes. The page stays **view-only — do NOT add any booking/pay button.**
- **Behavior preserved verbatim:** the pricing reducers inside `bonus`, `selectedProgram`, `upfrontAmount`, `totalExcludedAddonAmount`, `totalRenoNowPrice`, `bonusValue`, `overrideTotalQuotationAmount`, `displayTotalQuotationAmount`; the **`f_1` fixed-total short-circuit** (`if (templateOrder?.f_1 && templateOrder?.total_amount != null) return Number(templateOrder.total_amount);`); program branching in the Payment Summary and Balance Payment rows; `selectedPlan`, `activeTab`, `expandedPackageIds`/`togglePackage`, `document.title`, `navigate(-1)`, the loading/error/empty guards; the T&C section bodies and the `#tnc-sec-N` anchors.
- **Booking-fee deduction is breakdown-card only.** The Payment Summary headline AND the Q3 sticky bar stay **gross** (no fee subtraction). (Locked decision.)
- **Q2 is client-side preview only** — nothing persists to the backend; the booking flow is unaffected. **Hide the add-on toggle when `templateOrder?.f_1` is truthy** (the total is locked, so a toggle would do nothing).
- **Q3 sticky bar** appears only after the Payment Summary card scrolls out of view (IntersectionObserver), `lg:hidden`, mirrors the Payment Summary **primary** figure (gross).
- **Q4 is informational only** — no checkbox, no gating, no backend field.
- **Verification gate (per the Phase-1 plan, repo-specific):** project-wide `npm run lint` is **pre-existingly broken** (Metronic codebase) — NOT a gate. The per-task gate is: (1) `npm run build` (`tsc -b && vite build`) **exits 0**, and (2) scoped lint of the one file is clean: `npx eslint src/pages/CampaignPages/CampaignPackageDetailPage.tsx --ext ts,tsx --max-warnings 0` exits 0. Then a manual visual/behavior check vs the mockup. Do NOT scaffold a test runner (YAGNI).
- **Currency formatting:** match existing usage — `RM {value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`.

---

### Task 0: Branch and commit design artifacts

**Files:** none modified (adds the already-written spec + mockup to git).

- [ ] **Step 1: Create the feature branch off `production`**

```bash
git checkout production
git pull --ff-only
git checkout -b feature/quotation-detail-refinement
```

- [ ] **Step 2: Commit the spec, plan, and mockup**

```bash
git add docs/superpowers/specs/2026-06-22-quotation-detail-refinement-design.md \
        docs/superpowers/plans/2026-06-22-quotation-detail-refinement.md \
        docs/superpowers/mockups/2026-06-22-quotation-detail-refinement.html
git commit -m "docs(campaign): quotation detail refinement spec, plan, and mockup"
```

---

### Task 1: Q4 — T&C "payment = acknowledgement" clause

**Files:**
- Modify: `src/pages/CampaignPages/CampaignPackageDetailPage.tsx` (the `tnc` JSX, intro block ~line 200 and §3 heading ~line 267)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing consumed by later tasks. Fully independent.

- [ ] **Step 1: Add the highlighted callout after the intro paragraphs**

Find the end of the third intro paragraph and the start of §1 (currently lines 200–202):

```tsx
            </p>

            <h2 id="tnc-sec-1" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">1. Engagement and Quotation Validity</h2>
```

Insert the callout between the `</p>` and the `<h2>`:

```tsx
            </p>

            <div className="rounded-xl bg-campaign-50 border border-campaign-100 p-4">
                <p className="text-sm text-slate-700 leading-relaxed">
                    <strong>Payment constitutes acknowledgement.</strong> By making any payment toward this quotation, the Owner acknowledges having read, understood, and agreed to this quotation and these Terms &amp; Conditions.
                </p>
            </div>

            <h2 id="tnc-sec-1" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">1. Engagement and Quotation Validity</h2>
```

- [ ] **Step 2: Add the §3 clause directly under the Payment Terms heading**

Find the §3 heading (currently line 267):

```tsx
            <h2 id="tnc-sec-3" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">3. Payment Terms</h2>
```

Insert this paragraph immediately after it (before the `{selectedProgram === "normal" && (` block), so it shows for all programs:

```tsx
            <h2 id="tnc-sec-3" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">3. Payment Terms</h2>
            <p className="text-justify leading-relaxed mb-3">
                <strong>3.0 Acknowledgement by Payment.</strong> The Owner's payment of the booking fee or any sum stated in this quotation shall be deemed conclusive acknowledgement and acceptance of this quotation and these Terms &amp; Conditions, irrespective of whether this quotation has been separately signed.
            </p>
```

- [ ] **Step 3: Verify build + scoped lint**

Run:
```bash
npm run build
npx eslint src/pages/CampaignPages/CampaignPackageDetailPage.tsx --ext ts,tsx --max-warnings 0
```
Expected: both exit 0.

- [ ] **Step 4: Manual check**

`npm run dev`, open a campaign package quotation, click the **Terms & Conditions** tab. Confirm: the crimson callout renders after the intro, the "3.0 Acknowledgement by Payment" clause appears under §3, and the desktop "3. Payment Terms" contents link (`#tnc-sec-3`) still scrolls to the heading.

- [ ] **Step 5: Commit**

```bash
git add src/pages/CampaignPages/CampaignPackageDetailPage.tsx
git commit -m "feat(campaign): add payment-acknowledgement clause to quotation T&C (Q4)"
```

---

### Task 2: Q1 — Non-refundable booking-fee breakdown

**Files:**
- Modify: `src/pages/CampaignPages/CampaignPackageDetailPage.tsx` (add two derivations after `displayTotalQuotationAmount` ~line 183; replace the Initial Down Payment row ~lines 813–842)

**Interfaces:**
- Consumes: existing `selectedCampaignPackage`, `selectedProgram`, `upfrontAmount`, `bonusValue`, `totalRenoNowPrice`, `totalExcludedAddonAmount`.
- Produces: `bookingFee: number` and `originalInitialDownPayment: number` (also used by Task 4's sticky bar context, though the sticky bar shows gross).

- [ ] **Step 1: Add `bookingFee` and `originalInitialDownPayment` memos**

Find the end of `displayTotalQuotationAmount` and the `togglePackage` declaration (currently lines 181–187):

```tsx
    const displayTotalQuotationAmount = useMemo(() => {
        return overrideTotalQuotationAmount ?? totalExcludedAddonAmount - bonusValue;
    }, [overrideTotalQuotationAmount, totalExcludedAddonAmount, bonusValue]);

    const togglePackage = (pkgId: string) => {
```

Insert the two memos between `displayTotalQuotationAmount` and `togglePackage`:

```tsx
    const displayTotalQuotationAmount = useMemo(() => {
        return overrideTotalQuotationAmount ?? totalExcludedAddonAmount - bonusValue;
    }, [overrideTotalQuotationAmount, totalExcludedAddonAmount, bonusValue]);

    // [Q1] Non-refundable booking fee + the original (pre-fee) initial down payment per program.
    const bookingFee = useMemo(
        () => Number(selectedCampaignPackage?.booking_amount || 0),
        [selectedCampaignPackage?.booking_amount],
    );

    const originalInitialDownPayment = useMemo(() => {
        if (selectedProgram === 'bePowered') return upfrontAmount - bonusValue;
        if (selectedProgram === 'rnpl') return totalRenoNowPrice;
        return totalExcludedAddonAmount / 2;
    }, [selectedProgram, upfrontAmount, bonusValue, totalRenoNowPrice, totalExcludedAddonAmount]);

    const togglePackage = (pkgId: string) => {
```

- [ ] **Step 2: Replace the Initial Down Payment row with the breakdown**

Find the current Initial Down Payment block (currently lines 813–842):

```tsx
                                        {/* Initial/Balance payment breakdown (match owner quotation summary style) */}
                                        {!templateOrder?.is_progressive_payment && !templateOrder?.is_be_powered && !templateOrder?.is_rnpl ? null : (
                                            <div className="flex justify-between items-center py-3">
                                                <span className="text-sm text-slate-500">Initial Down Payment</span>
                                                {selectedProgram === 'bePowered' && (
                                                    <span className="text-sm text-slate-900 font-semibold whitespace-nowrap">
                                                        RM {(upfrontAmount - bonusValue).toLocaleString(undefined, {
                                                            minimumFractionDigits: 0,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </span>
                                                )}
                                                {selectedProgram === 'rnpl' && (
                                                    <span className="text-sm text-slate-900 font-semibold whitespace-nowrap">
                                                        RM {totalRenoNowPrice.toLocaleString(undefined, {
                                                            minimumFractionDigits: 0,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </span>
                                                )}
                                                {selectedProgram !== 'rnpl' && selectedProgram !== 'bePowered' && (
                                                    <span className="text-sm text-slate-900 font-semibold whitespace-nowrap">
                                                        RM {(totalExcludedAddonAmount / 2).toLocaleString(undefined, {
                                                            minimumFractionDigits: 0,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </span>
                                                )}
                                            </div>
                                        )}
```

Replace the whole block with (note: per-program value now flows through `originalInitialDownPayment`):

```tsx
                                        {/* [Q1] Initial Down Payment breakdown with non-refundable booking fee */}
                                        {!templateOrder?.is_progressive_payment && !templateOrder?.is_be_powered && !templateOrder?.is_rnpl ? null : (
                                            <div className="py-3">
                                                {bookingFee > 0 ? (
                                                    <>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-slate-500 flex items-center gap-2">
                                                                Booking Fee
                                                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">Non-refundable</span>
                                                            </span>
                                                            <span className="text-sm text-red-600 font-semibold whitespace-nowrap">
                                                                − RM {bookingFee.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center mt-2">
                                                            <span className="text-sm font-semibold text-slate-900">Initial Down Payment</span>
                                                            <span className="text-sm text-slate-900 font-bold whitespace-nowrap">
                                                                RM {(originalInitialDownPayment - bookingFee).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center mt-1 pl-4">
                                                            <span className="text-xs text-slate-400">Original Initial Down Payment</span>
                                                            <span className="text-xs text-slate-400 whitespace-nowrap">
                                                                RM {originalInitialDownPayment.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-slate-500">Initial Down Payment</span>
                                                        <span className="text-sm text-slate-900 font-semibold whitespace-nowrap">
                                                            RM {originalInitialDownPayment.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
```

- [ ] **Step 3: Verify build + scoped lint**

Run:
```bash
npm run build
npx eslint src/pages/CampaignPages/CampaignPackageDetailPage.tsx --ext ts,tsx --max-warnings 0
```
Expected: both exit 0.

- [ ] **Step 4: Manual check (all programs)**

`npm run dev`. For a package whose booking fee > 0, confirm in the Pricing summary: a red `Booking Fee  − RM X · Non-refundable` line, `Initial Down Payment = original − X` (bold), and a muted `Original Initial Down Payment` sub-line. Verify the original value matches the pre-change figure for each program (Reno Subscription `upfront − bonus`, RenoNow PayLater `RenoNow price`, Full Payment `total / 2`). For a package with booking fee 0, confirm the single legacy Initial Down Payment row renders unchanged. The Balance Payment row is unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/pages/CampaignPages/CampaignPackageDetailPage.tsx
git commit -m "feat(campaign): booking-fee breakdown on Initial Down Payment (Q1)"
```

---

### Task 3: Q2 — Client-side toggle-able add-on packages

**Files:**
- Modify: `src/pages/CampaignPages/CampaignPackageDetailPage.tsx` (state ~line 52; new `effectivePackages` memo after `selectedProgram` ~line 128; repoint `upfrontAmount` ~130 and `totalExcludedAddonAmount` ~145; add `toggleAddon` near `togglePackage` ~185; repoint render IIFE ~899 and rewrite `renderPackage` ~903–957)

**Interfaces:**
- Consumes: `templateQuotation`, `templateOrder`, the `Package` type (already imported).
- Produces: `effectivePackages: Package[]` (consumed by the two pricing memos and the render IIFE), `addonOverrides` state, `toggleAddon(pkg: Package)`.

- [ ] **Step 1: Add the override state**

Find (currently lines 50–52):

```tsx
    const [expandedPackageIds, setExpandedPackageIds] = useState<Record<string, boolean>>({});
    const [selectedPlan, setSelectedPlan] = useState<string>('60');
    const [activeTab, setActiveTab] = useState<'quotation' | 'tnc'>('quotation');
```

Add the override state after `activeTab`:

```tsx
    const [expandedPackageIds, setExpandedPackageIds] = useState<Record<string, boolean>>({});
    const [selectedPlan, setSelectedPlan] = useState<string>('60');
    const [activeTab, setActiveTab] = useState<'quotation' | 'tnc'>('quotation');
    // [Q2] client-side add-on inclusion overrides, keyed by package id. Preview only — never persisted.
    const [addonOverrides, setAddonOverrides] = useState<Record<string, boolean>>({});
```

- [ ] **Step 2: Add the `effectivePackages` memo (before the pricing memos)**

Find the `selectedProgram` memo end and `upfrontAmount` start (currently lines 124–130):

```tsx
    const selectedProgram = useMemo(() => {
        if (templateOrder?.is_be_powered) return 'bePowered';
        if (templateOrder?.is_rnpl) return 'rnpl';
        return 'normal';
    }, [templateOrder?.is_be_powered, templateOrder?.is_rnpl]);

    const upfrontAmount = useMemo(() => {
```

Insert `effectivePackages` between them:

```tsx
    const selectedProgram = useMemo(() => {
        if (templateOrder?.is_be_powered) return 'bePowered';
        if (templateOrder?.is_rnpl) return 'rnpl';
        return 'normal';
    }, [templateOrder?.is_be_powered, templateOrder?.is_rnpl]);

    // [Q2] Apply user toggles over each add-on's is_addon_included; non-add-ons pass through unchanged.
    const effectivePackages = useMemo<Package[]>(() => {
        const pkgs = templateQuotation?.packages || [];
        return pkgs.map((pkg) => {
            if (!pkg.is_addon) return pkg;
            const id = String(pkg.id ?? pkg.name ?? 'pkg');
            const included = id in addonOverrides ? addonOverrides[id] : pkg.is_addon_included !== false;
            return { ...pkg, is_addon_included: included };
        });
    }, [templateQuotation?.packages, addonOverrides]);

    const upfrontAmount = useMemo(() => {
```

- [ ] **Step 3: Repoint `upfrontAmount` to `effectivePackages`**

Replace the current `upfrontAmount` memo (currently lines 130–143):

```tsx
    const upfrontAmount = useMemo(() => {
        if (!templateOrder?.is_be_powered) return 0;
        const pkgs = templateQuotation?.packages || [];
        return pkgs.reduce(
            (acc, pkg) =>
                acc +
                (templateOrder.is_be_powered &&
                    pkg.payment_method === 'one-off' &&
                    (pkg.is_addon ? pkg.is_addon_included === true : true)
                    ? (pkg.markup_amount ? pkg.markup_amount : pkg.total_price) * (pkg.quantity || 1)
                    : 0),
            templateOrder.be_powered_base_price || 0,
        );
    }, [templateOrder?.is_be_powered, templateOrder?.be_powered_base_price, templateQuotation?.packages]);
```

with (only the source array and the dependency change; reducer body identical):

```tsx
    const upfrontAmount = useMemo(() => {
        if (!templateOrder?.is_be_powered) return 0;
        const pkgs = effectivePackages;
        return pkgs.reduce(
            (acc, pkg) =>
                acc +
                (templateOrder.is_be_powered &&
                    pkg.payment_method === 'one-off' &&
                    (pkg.is_addon ? pkg.is_addon_included === true : true)
                    ? (pkg.markup_amount ? pkg.markup_amount : pkg.total_price) * (pkg.quantity || 1)
                    : 0),
            templateOrder.be_powered_base_price || 0,
        );
    }, [templateOrder?.is_be_powered, templateOrder?.be_powered_base_price, effectivePackages]);
```

- [ ] **Step 4: Repoint `totalExcludedAddonAmount` to `effectivePackages`**

Replace the current memo (currently lines 145–153):

```tsx
    const totalExcludedAddonAmount = useMemo(() => {
        if (templateOrder?.f_1 && templateOrder?.total_amount != null) return Number(templateOrder.total_amount);
        const pkgs = templateQuotation?.packages || [];
        return pkgs.reduce((total, pkg) => {
            if (pkg.is_addon === true && pkg.is_addon_included === false) return total;
            const packagePrice = templateOrder?.is_rnpl && pkg.markup_amount ? pkg.markup_amount : pkg.total_price || 0;
            return total + Number(packagePrice) * (pkg.quantity || 1);
        }, 0);
    }, [templateOrder?.f_1, templateOrder?.total_amount, templateOrder?.is_rnpl, templateQuotation?.packages]);
```

with (f_1 short-circuit preserved; source array and dependency change only):

```tsx
    const totalExcludedAddonAmount = useMemo(() => {
        if (templateOrder?.f_1 && templateOrder?.total_amount != null) return Number(templateOrder.total_amount);
        const pkgs = effectivePackages;
        return pkgs.reduce((total, pkg) => {
            if (pkg.is_addon === true && pkg.is_addon_included === false) return total;
            const packagePrice = templateOrder?.is_rnpl && pkg.markup_amount ? pkg.markup_amount : pkg.total_price || 0;
            return total + Number(packagePrice) * (pkg.quantity || 1);
        }, 0);
    }, [templateOrder?.f_1, templateOrder?.total_amount, templateOrder?.is_rnpl, effectivePackages]);
```

- [ ] **Step 5: Add the `toggleAddon` handler**

Find `togglePackage` (currently lines 185–187):

```tsx
    const togglePackage = (pkgId: string) => {
        setExpandedPackageIds((prev) => ({ ...prev, [pkgId]: !prev[pkgId] }));
    };
```

Add `toggleAddon` immediately after it:

```tsx
    const togglePackage = (pkgId: string) => {
        setExpandedPackageIds((prev) => ({ ...prev, [pkgId]: !prev[pkgId] }));
    };

    const toggleAddon = (pkg: Package) => {
        const id = String(pkg.id ?? pkg.name ?? 'pkg');
        const current = id in addonOverrides ? addonOverrides[id] : pkg.is_addon_included !== false;
        setAddonOverrides((prev) => ({ ...prev, [id]: !current }));
    };
```

- [ ] **Step 6: Repoint the render IIFE source array**

Find (currently line 899):

```tsx
                                            const pkgs = templateQuotation.packages || [];
```

Replace with:

```tsx
                                            const pkgs = effectivePackages;
```

- [ ] **Step 7: Rewrite `renderPackage` to add the toggle + excluded styling**

Replace the entire current `renderPackage` definition (currently lines 903–957, from `const renderPackage = (pkg: Package, isAddon: boolean) => {` through its closing `};`):

```tsx
                                            const renderPackage = (pkg: Package, isAddon: boolean) => {
                                                const pkgId = String(pkg.id ?? pkg.name ?? 'pkg');
                                                const products = ((pkg.products || []) as Product[]).filter((p) => p.pivot?.visibility == true);
                                                const included = isAddon
                                                    ? (pkgId in addonOverrides ? addonOverrides[pkgId] : pkg.is_addon_included !== false)
                                                    : true;
                                                const showToggle = isAddon && !templateOrder?.f_1;

                                                const accordion = (
                                                    <AccordionItem
                                                        key={pkgId}
                                                        open={!!expandedPackageIds[pkgId]}
                                                        onToggle={() => togglePackage(pkgId)}
                                                        className={isAddon ? `border-slate-200 bg-slate-50/50 ${included ? '' : 'opacity-60'}` : ''}
                                                        headerClassName="bg-slate-50/70 hover:bg-slate-100"
                                                        header={
                                                            <div>
                                                                {isAddon && (
                                                                    <div className="mb-1.5">
                                                                        <Pill tone="brand">Add-on</Pill>
                                                                    </div>
                                                                )}
                                                                <div className={`text-sm font-semibold text-slate-900 ${isAddon && !included ? 'line-through decoration-slate-300' : ''}`}>{pkg.name || 'Package'}</div>
                                                                <div className="text-xs text-slate-400 mt-1">{products.length} item(s)</div>
                                                            </div>
                                                        }
                                                    >
                                                        {pkg.description && <p className="text-sm text-slate-500 mb-4 whitespace-pre-line">{pkg.description}</p>}

                                                        {products.length === 0 ? (
                                                            <div className="text-sm text-slate-500">No items in this package.</div>
                                                        ) : (
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-sm">
                                                                    <thead>
                                                                        <tr>
                                                                            <th className="text-slate-400 text-xs uppercase font-semibold py-2 pr-4 text-left min-w-[240px]">Item</th>
                                                                            <th className="text-slate-400 text-xs uppercase font-semibold py-2 px-3 text-center min-w-[80px]">Qty</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-50">
                                                                        {products.map((p) => (
                                                                            <tr key={String(p.id)}>
                                                                                <td className="py-3 pr-4">
                                                                                    <div className="text-sm font-medium text-slate-900">{p.name || '-'}</div>
                                                                                    {p.description && <div className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</div>}
                                                                                </td>
                                                                                <td className="text-sm text-slate-600 py-3 px-3 text-center">
                                                                                    {getProductQty(p)} {p.uom}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </AccordionItem>
                                                );

                                                if (!showToggle) return accordion;

                                                return (
                                                    <div key={pkgId}>
                                                        <div className="flex items-center justify-end mb-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleAddon(pkg)}
                                                                className="inline-flex items-center gap-2"
                                                                aria-pressed={included}
                                                                aria-label={`${included ? 'Exclude' : 'Include'} ${pkg.name || 'add-on'}`}
                                                            >
                                                                <span className={`text-xs font-semibold ${included ? 'text-campaign' : 'text-slate-400'}`}>{included ? 'Included' : 'Excluded'}</span>
                                                                <span className={`relative inline-block w-11 h-6 rounded-full transition-colors ${included ? 'bg-campaign' : 'bg-slate-200'}`}>
                                                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${included ? 'translate-x-5' : ''}`} />
                                                                </span>
                                                            </button>
                                                        </div>
                                                        {accordion}
                                                    </div>
                                                );
                                            };
```

- [ ] **Step 8: Verify build + scoped lint**

Run:
```bash
npm run build
npx eslint src/pages/CampaignPages/CampaignPackageDetailPage.tsx --ext ts,tsx --max-warnings 0
```
Expected: both exit 0.

- [ ] **Step 9: Manual check (toggle recompute + f_1)**

`npm run dev`. On a package with add-ons: toggling an add-on switch flips Included↔Excluded, dims + strikes the excluded card, and updates **Total Quotation Amount**, the **Payment Summary** figure, the **Balance Payment**, and the **Q1 Initial Down Payment** breakdown — all live. Confirm regular (non-add-on) packages have no toggle. On an `f_1` (fixed-total) order, confirm add-ons render **without** a toggle and the total does not change. Toggling nothing leaves all figures identical to before this task.

- [ ] **Step 10: Commit**

```bash
git add src/pages/CampaignPages/CampaignPackageDetailPage.tsx
git commit -m "feat(campaign): client-side toggle-able add-on packages (Q2)"
```

---

### Task 4: Q3 — Mobile sticky payment bar

**Files:**
- Modify: `src/pages/CampaignPages/CampaignPackageDetailPage.tsx` (import `useRef` line 1; state + ref ~line 53; new effect; wrap the Payment Summary `Card` ~660; render the bar before the outer closing `</div>` ~982)

**Interfaces:**
- Consumes: `selectedProgram`, `selectedPlan`, `totalExcludedAddonAmount`, `bonusValue`, `upfrontAmount`, `totalRenoNowPrice`, `activeTab`, `selectedCampaignPackage`, `templateOrder`, `templateQuotation`.
- Produces: nothing for later tasks.

- [ ] **Step 1: Import `useRef`**

Find (line 1):

```tsx
import React, { useEffect, useMemo, useState } from 'react';
```

Replace with:

```tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
```

- [ ] **Step 2: Add the sticky-bar state and ref**

Find the override state added in Task 3 (`const [addonOverrides, ...`) and add below it:

```tsx
    const [addonOverrides, setAddonOverrides] = useState<Record<string, boolean>>({});
    // [Q3] mobile sticky bar visibility, driven by an IntersectionObserver on the Payment Summary card.
    const [showStickyBar, setShowStickyBar] = useState<boolean>(false);
    const paymentSummaryRef = useRef<HTMLDivElement | null>(null);
```

- [ ] **Step 3: Add the IntersectionObserver effect**

Find the `document.title` effect (currently lines 101–105):

```tsx
    useEffect(() => {
        const title = campaign?.title || 'Campaign';
        const pkgTitle = selectedCampaignPackage?.name ? ` - ${selectedCampaignPackage.name}` : '';
        document.title = `${title}${pkgTitle} | Package Detail`;
    }, [campaign?.title, selectedCampaignPackage?.name]);
```

Add this effect immediately after it:

```tsx
    useEffect(() => {
        const el = paymentSummaryRef.current;
        if (!el) {
            setShowStickyBar(false);
            return;
        }
        const observer = new IntersectionObserver(
            ([entry]) => setShowStickyBar(!entry.isIntersecting),
            { threshold: 0 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [activeTab, selectedCampaignPackage, templateOrder, templateQuotation]);
```

- [ ] **Step 4: Wrap the Payment Summary card with the ref**

Find the Payment Summary card open/close (currently `{/* Payment Summary */}` at line 659, `<Card className="p-6">` at 660, and its matching `</Card>` at 763). Wrap that `<Card>...</Card>` in a `<div ref={paymentSummaryRef}>`:

```tsx
                                    {/* Payment Summary */}
                                    <div ref={paymentSummaryRef}>
                                    <Card className="p-6">
```

and the matching close (the `</Card>` currently at line 763):

```tsx
                                    </Card>
                                    </div>
```

(Only the wrapper `<div ref=...>`/`</div>` are added; the Card content is untouched.)

- [ ] **Step 5: Render the sticky bar**

Find the end of the main content container and the page root close (currently lines 980–983):

```tsx
                )}
            </div>
        </div>
    );
}
```

Insert the sticky bar between the `</div>` (main content) and the final `</div>` (page root):

```tsx
                )}
            </div>

            {/* [Q3] Mobile sticky payment bar — appears after the Payment Summary scrolls off; mirrors the gross primary figure. */}
            {activeTab === 'quotation' && selectedCampaignPackage && templateOrder && templateQuotation && (
                <div
                    className={`lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3 flex items-center justify-between transition-transform duration-300 shadow-[0_-8px_24px_rgba(16,24,40,0.10)] ${showStickyBar ? 'translate-y-0' : 'translate-y-full'}`}
                >
                    <div>
                        <p className="text-[10px] text-slate-400 leading-none uppercase tracking-wide">
                            {selectedProgram === 'bePowered' ? 'Reno Subscription' : selectedProgram === 'rnpl' ? 'RenoNow PayLater' : 'Full Payment'}
                        </p>
                        <p className="text-base font-extrabold text-slate-900 leading-tight mt-0.5">
                            {selectedProgram === 'normal' && (
                                <>
                                    RM {(((totalExcludedAddonAmount - bonusValue) * (selectedPlan === '60' ? 1.14 : 1.105)) / Number(selectedPlan)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    <span className="text-xs font-medium text-slate-500">/mo</span>
                                </>
                            )}
                            {selectedProgram === 'bePowered' && (
                                <>
                                    RM {(upfrontAmount - bonusValue).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    <span className="text-xs font-medium text-slate-500"> upfront</span>
                                </>
                            )}
                            {selectedProgram === 'rnpl' && (
                                <>
                                    RM {totalRenoNowPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    <span className="text-xs font-medium text-slate-500"> to start</span>
                                </>
                            )}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setActiveTab('tnc')}
                        className="text-xs font-medium text-campaign hover:text-campaign-600 transition-colors"
                    >
                        Terms &amp; Conditions
                    </button>
                </div>
            )}
        </div>
    );
}
```

- [ ] **Step 6: Verify build + scoped lint**

Run:
```bash
npm run build
npx eslint src/pages/CampaignPages/CampaignPackageDetailPage.tsx --ext ts,tsx --max-warnings 0
```
Expected: both exit 0.

- [ ] **Step 7: Manual check (mobile only, appear-after-scroll)**

`npm run dev`, open the quotation at a mobile width (375px). Confirm: no sticky bar initially; after scrolling past the Payment Summary card it slides up showing the correct per-program primary figure (gross); scrolling back up hides it; it is absent at desktop width (≥`lg`); switching to the T&C tab hides it.

- [ ] **Step 8: Commit**

```bash
git add src/pages/CampaignPages/CampaignPackageDetailPage.tsx
git commit -m "feat(campaign): mobile sticky payment-summary bar (Q3)"
```

---

### Task 5: Full verification & finalize

**Files:** none (verification only).

- [ ] **Step 1: Build + scoped lint**

```bash
npm run build
npx eslint src/pages/CampaignPages/CampaignPackageDetailPage.tsx --ext ts,tsx --max-warnings 0
```
Expected: both exit 0.

- [ ] **Step 2: Manual QA matrix**

With `npm run dev`, at viewport widths **375 / 768 / 1280**, against packages exercising each program (`bePowered`, `rnpl`, `normal`, and a progressive `normal`) plus one `f_1` order and one zero-booking-fee package:
- **Q1:** booking-fee line (negative, non-refundable), net Initial Down Payment, and muted Original sub-item; zero-fee package shows the single legacy row; figures correct per program.
- **Q2:** toggling add-ons recomputes Total / Payment Summary / Balance / Q1 live; excluded rows dimmed + struck; no toggle on `f_1`; regular packages have no toggle.
- **Q3:** sticky bar appears only after scrolling past the Payment Summary on mobile, hidden on desktop and on the T&C tab.
- **Q4:** callout + §3.0 clause present; `#tnc-sec-3` anchor scrolls correctly.
- **Behavior:** no pay button added; with no toggles touched, all figures match pre-change values; no console errors.

- [ ] **Step 3: Finalize the branch**

Use the `superpowers:finishing-a-development-branch` skill to decide merge vs PR for `feature/quotation-detail-refinement` (base `production`). If QA surfaced a fix, make it in the file, re-run Step 1, commit, then finalize.

---

## Self-Review

**Spec coverage:** §4.1 Q1 → Task 2. §4.2 Q2 (effectivePackages + repoint memos + toggle UI + f_1 guard) → Task 3. §4.3 Q3 (IntersectionObserver sticky bar, gross, appear-after-scroll) → Task 4. §4.4 Q4 (callout + §3 clause, informational) → Task 1. §5 data deps (booking_amount, is_addon_included — no API change) → honored (no service edits). §6 verification → per-task gates + Task 5. Branch/commit hygiene → Task 0. All spec sections map to a task.

**Placeholder scan:** No TBD/TODO. Every code step shows complete before/after code with exact anchors. No "similar to" references.

**Type consistency:** `effectivePackages: Package[]` is produced in Task 3 Step 2 and consumed verbatim in Steps 3, 4, 6 (and `renderPackage` reads from `pkgs = effectivePackages`). `toggleAddon(pkg: Package)` matches its call site `onClick={() => toggleAddon(pkg)}`. `bookingFee`/`originalInitialDownPayment` defined in Task 2 Step 1 are used in Task 2 Step 2. `paymentSummaryRef: useRef<HTMLDivElement | null>` matches `<div ref={paymentSummaryRef}>` and `paymentSummaryRef.current`. `addonOverrides`/`setAddonOverrides` keyed by `String(pkg.id ?? pkg.name ?? 'pkg')` consistently in `effectivePackages`, `toggleAddon`, and `renderPackage`. `Package`/`Product` types already imported (line 6); `useRef` added in Task 4 Step 1. The f_1 short-circuit and all reducer bodies are reproduced unchanged.
