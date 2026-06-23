# Public Quotation Detail — Show Package Quantity Design Spec

- **Date:** 2026-06-23
- **Status:** Approved — implement inline
- **Owner:** Frontend (`RenoXpert-Frontend-v2.1`), base branch `production`
- **Scope:** Display-only, single file.

---

## 1. Context & Goal

The public campaign **quotation detail** page (`src/pages/CampaignPages/CampaignPackageDetailPage.tsx`) lists each quotation package as an `AccordionItem`. The header shows the package name and a "`{N} item(s)`" subtitle; the expanded body shows a per-**product** Qty table. The **package-level quantity** (`pkg.quantity`) is used in the pricing math (`pkg.quantity || 1`) but is **not displayed** anywhere.

**Goal:** Show each package's quantity on its card as a small "×N" badge after the package name.

## 2. Scope

**Frontend only, one file:** `src/pages/CampaignPages/CampaignPackageDetailPage.tsx`.

- In `renderPackage` (~line 994), render the package name and a quantity badge on one row.
- Applies to **both** regular and add-on packages.
- **Out of scope:** any data/API/pricing change; the per-product Qty table inside the accordion (unchanged); the owner/admin pages; the campaign landing/layout pages.

## 3. Requirements

- **Source value:** `pkg.quantity || 1` — identical to the value used by the existing pricing logic (so the badge can never disagree with the math).
- **Placement:** immediately after the package name in the accordion header, on the same line.
- **Format:** `×{quantity}` (e.g. `×2`), in a small neutral badge (`bg-slate-100`, `text-slate-600`, `text-xs`, rounded).
- **Always shown**, including `×1`.
- **Add-on excluded state:** only the package **name** keeps its existing `line-through` when an add-on is excluded; the badge stays neutral (no strikethrough).

## 4. Implementation

Replace the name `<div>` in the header with a flex row containing the name and the badge:

```tsx
<div className="flex items-center gap-2">
    <div className={`text-sm font-semibold text-slate-900 ${isAddon && !included ? 'line-through decoration-slate-300' : ''}`}>
        {pkg.name || 'Package'}
    </div>
    <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">
        ×{pkg.quantity || 1}
    </span>
</div>
```

The existing "`{N} item(s)`" subtitle line directly below is unchanged.

## 5. Verification

- `npm run build` → exit 0.
- `npx eslint src/pages/CampaignPages/CampaignPackageDetailPage.tsx --ext ts,tsx --format unix` → no NEW errors (baseline 0 today).
- Manual: open a campaign quotation detail with packages whose quantity differs (e.g. ×1 and ×2) → each header shows the correct "×N" badge next to the name; add-on packages show it too; excluded add-on dims only the name.

## 6. Non-goals

No backend/API/pricing change; no per-product table change; no admin-side change; no new dependency.
