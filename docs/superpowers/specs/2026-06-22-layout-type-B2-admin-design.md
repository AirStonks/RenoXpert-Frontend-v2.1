# Layout Type System — Phase B2 (Admin) Design Spec

- **Date:** 2026-06-22
- **Status:** Proposed — awaiting user review before implementation planning
- **Owner:** Frontend (RenoXpert-Frontend-v2.1), base branch `production`
- **Part of:** "RenoXpert Campaign Refindment" → Sub-project B (Layout Type). **B1 backend/API is done (PR #3).** This is **B2 (admin)**; B3 (public) is separate.

---

## 1. Context & Goal

B1 added the API: a campaign can have `layout_types[]` (each with `name, description, sort, rental_projection (1 img), rendering_images (many)`) and packages carry `layout_type_id`. The linking contract: the client sends `layout_types: [{id?, name, description, sort}]` and each package carries `layout_type_index` (0-based position into the submitted `layout_types`) and/or an existing `layout_type_id`; the backend resolves index→id. Layout images upload via dedicated endpoints (`POST/DELETE campaign-layout-types/{id}/rental-projection`, `POST/DELETE campaign-layout-types/{id}/renderings`).

**Goal:** Let admins create/manage Layout Types (with their rental projection + renderings) and assign sub-packages to them, in the existing Add/Edit Campaign forms — **without breaking the existing flat-campaign flow**.

**Locked decisions (user, 2026-06-22):** **nested-under-layouts** admin UX (packages grouped under collapsible Layout Type sections; each layout has its name/description, image uploads, and an "Add sub-package" button); an **explicit "Use layout types" toggle** (off = today's flat behavior). Schema is done (B1); migrations run by the user.

## 2. Scope

**In scope (frontend only):**
- `src/types/index.ts` — add `CampaignLayoutType` interface; `Campaign.layout_types?`; `CampaignPackage.layout_type_id?` + `layout_type_index?`.
- `src/services/api.ts` — extend `createCampaign`/`updateCampaign` FormData to send a nested `layout_types` array; add 4 layout-image helpers calling the B1 endpoints.
- `src/pages/Campaign/AddCampaign.tsx` — "Use layout types" toggle; nested Layout Type sections (name/desc + rental-projection + renderings upload + "Add sub-package"); thread `layout_type_index` on submit; two-step image upload after create.
- `src/pages/Campaign/EditCampaign.tsx` — same, plus load existing `campaign.layout_types` (and their images) into state; immediate image upload (layout ids already exist); thread `layout_type_id`/`layout_type_index` on submit.

**Out of scope:** backend (B1, done); the public landing (B3); the FAQ (H4). No new dependencies. The existing flat-package UI/flow is preserved unchanged when the toggle is off.

## 3. Constraints

- **Backward-compatible:** when "Use layout types" is OFF, both forms behave exactly as today (flat `packages`, no layout UI, no `layout_types` sent, null `layout_type_id`). Existing flat campaigns load with the toggle off.
- **Preserve the existing per-index package maps** (`packageValueSources`, `selectedPackageOrderTemplates`, `packageErrors`, `collapsedPackages` — all keyed by package index). The nested UI is achieved by **grouping the existing flat `packages` array by a `packageLayoutIndex` map** (packageIndex → layout array index), NOT by restructuring `packages` into nested arrays. This keeps all existing per-package logic intact.
- **MUST reindex per-index maps on `removePackage`.** Because all these maps (including `packageLayoutIndex`) are keyed by the package's *array position*, `removePackage` must reindex them when it compacts the `packages` array (drop the removed key; shift keys > index down by 1) — otherwise removing a non-tail package/layout mis-groups or orphans other layouts' sub-packages. (Found in B2 Task-2 review; applies to both Add and Edit.)
- **Don't persist layout-less packages in layout mode:** on submit, when the toggle is on, exclude packages with no `packageLayoutIndex` entry from the payload (not from state) so a layered campaign never saves layout-less packages.
- **api.ts contract:** `createCampaign`/`updateCampaign` currently special-case `packages` (append `packages[${i}][${key}]`) and `thumbnail`; everything else is appended as a scalar. A nested `layout_types` array would be mangled → add a `layout_types` special-case (`layout_types[${i}][${key}]`). `layout_type_index`/`layout_type_id` ride along automatically because they're keys on each package object.
- **Layout images live on the layout type** (`campaign.layout_types[].rental_projection` / `.rendering_images`), NOT on packages. (The exploration's "seed from packages" note is incorrect.)
- **Image upload timing:** Edit = immediate (layout id exists) via the B1 endpoints; Add = two-step (no id until save) — hold selected files in state, then after `createCampaign` returns `created.data.layout_types[]` (with ids), upload each layout's pending projection + renderings; surface a clear message on partial failure (campaign still saved).
- **Validation:** at least a name per layout type; client-side image checks (`image/*`, ≤10 MB) matching B1.
- **Verification gate:** `npm run build` exit 0; scoped eslint on the changed files introduces **no new errors** (AddCampaign/EditCampaign carry 2 pre-existing errors each; api.ts has pre-existing errors — the gate is "count unchanged"). No test runner — don't scaffold one.
- **DRY note:** AddCampaign and EditCampaign already duplicate the package UI; B2 adds parallel layout UI to both (consistent with the codebase). A shared extraction is out of scope (too risky for B2); note it as a future refactor.

## 4. Data & state design (both forms)

Add state (mirrors the existing per-index map style):
- `const [useLayoutTypes, setUseLayoutTypes] = useState(false)` — the toggle (Edit seeds it true when `campaign.layout_types?.length`).
- `const [layoutTypes, setLayoutTypes] = useState<{ id?: number|string; name: string; description?: string }[]>([])` — ordered; array index = the `layout_type_index`/`sort`.
- `const [packageLayoutIndex, setPackageLayoutIndex] = useState<Record<number, number>>({})` — packageIndex → layout array index.
- Image state per layout index: `layoutProjectionFile: Record<number, File>` + `layoutRenderingFiles: Record<number, File[]>` (Add: pending files) and, for display, `layoutProjectionUrl: Record<number, string|null>` + `layoutRenderingUrls: Record<number, {file_url, path}[]>` (Edit: existing images from the API). `layoutUploading: Record<number, boolean>`.

Helpers: `addLayoutType()`, `removeLayoutType(layoutIdx)` (also unassigns/removes its sub-packages or moves them out — decision: removing a layout removes its sub-packages, with a confirm), `updateLayoutType(layoutIdx, field, value)`, `addSubPackage(layoutIdx)` (= existing `addPackage()` then set `packageLayoutIndex[newIdx]=layoutIdx`), and image handlers (see §6).

## 5. UX design

- A **"Use layout types"** toggle in the packages area (only meaningful in `campaignMode === 'packages'`). OFF → render the existing flat packages UI unchanged. ON → render the nested layout UI:
  - An **"Add Layout Type"** button. Each Layout Type is a collapsible section with: **Name** + **Description** inputs; a **Rental Projection** uploader (single image — preview, replace, remove); a **Renderings** uploader (multiple — thumbnail grid, add, remove each); and the layout's **sub-packages** (the existing package cards — template-order search, name, amounts, slot toggles — rendered for packages whose `packageLayoutIndex` points here) plus an **"Add sub-package"** button; and a **Remove Layout Type** button (confirm; removes its sub-packages).
- The existing per-package card UI is reused verbatim inside each layout section (the package map is filtered/grouped by `packageLayoutIndex`).
- Flat mode and the `campaignMode` single/packages toggle are unchanged.

## 6. api.ts changes

- **`createCampaign` / `updateCampaign`:** add a `layout_types` branch to the `Object.keys(campaignData).forEach` loop (before the scalar `else`): for each layout, `formData.append('layout_types[${i}][${key}]', value)` (id, name, description, sort). Packages already append all their keys, so `layout_type_index`/`layout_type_id` on a package object are sent automatically.
- **New helpers** (mirror `uploadProductPhotos`'s inline-Bearer + multipart pattern, hitting the B1 routes):
  - `uploadCampaignLayoutTypeRentalProjection(layoutTypeId, file)` → `POST campaign-layout-types/{id}/rental-projection` (field `rental_projection`).
  - `deleteCampaignLayoutTypeRentalProjection(layoutTypeId)` → `DELETE campaign-layout-types/{id}/rental-projection`.
  - `uploadCampaignLayoutTypeRenderings(layoutTypeId, files)` → `POST campaign-layout-types/{id}/renderings` (field `rendering_images[]`).
  - `deleteCampaignLayoutTypeRendering(layoutTypeId, path)` → `DELETE campaign-layout-types/{id}/renderings` (body `{ path }`).
  Each returns `response.data` (the B1 `{ success, data: <layout with images>, message }`).

## 7. Submit flow

- **Build payload:** when `useLayoutTypes`, set `campaignData.layout_types = layoutTypes.map((lt, i) => ({ id: lt.id, name: lt.name, description: lt.description, sort: i }))`; for each processed package, set `layout_type_index = packageLayoutIndex[pkgIndex]` and (Edit) `layout_type_id` if its layout has an existing id. When the toggle is off, send neither (flat path).
- **AddCampaign (two-step):** `const created = await createCampaign(campaignData)`; then if `useLayoutTypes`, for each created layout `created.data.layout_types[i]` (matched by index/sort) with pending `layoutProjectionFile[i]` / `layoutRenderingFiles[i]`, call the upload helpers with `created.data.layout_types[i].id`; wrap in try/catch → on failure `setError('Campaign created, but some layout images failed to upload — add them from Edit.')`; then navigate.
- **EditCampaign:** layout ids exist (existing) or are returned by `updateCampaign`; images are uploaded **immediately** on selection (not deferred). On submit, `updateCampaign(campaignId, campaignData)` persists layout text + package assignments. For newly-added layouts in Edit, mirror the Add two-step using `updateCampaign`'s returned `data.layout_types`.

## 8. Types
Add to `src/types/index.ts`:
```ts
export interface CampaignLayoutType {
  id?: number | string;
  campaign_id?: number | string;
  name?: string;
  description?: string;
  sort?: number;
  rental_projection?: Attachment | null;
  rendering_images?: Attachment[] | null;
}
```
Extend `Campaign` with `layout_types?: CampaignLayoutType[]`; extend `CampaignPackage` with `layout_type_id?: number | string` and `layout_type_index?: number`.

## 9. Verification plan
- `npm run build` exit 0; scoped eslint on `src/types/index.ts`, `src/services/api.ts`, `AddCampaign.tsx`, `EditCampaign.tsx` introduces no new errors (counts unchanged vs baseline). 
- Manual QA (after the user runs the B1 migration + merges PR #3, against the API): toggle ON → add 2 layouts, upload 1 projection + 2 renderings each, add sub-packages under each; save → reload Edit shows the layouts, images, and sub-packages correctly grouped; toggle OFF / flat campaign → unchanged behavior; Add two-step image upload works; Edit immediate upload/replace/remove works; removing a layout removes its sub-packages.
- Cross-check: the public landing (B3) groups packages by the `layout_type_id` the admin assigned.

## 10. Risks & mitigations
- **Large refactor of two ~1300-line forms** → keep flat path untouched (gated by the toggle); group the existing flat `packages` array via `packageLayoutIndex` rather than restructuring it (preserves all per-index maps); add layout UI as a new branch. Consider splitting the plan into: B2a (types + api.ts), B2b (AddCampaign), B2c (EditCampaign).
- **Add two-step partial image-upload failure** → same mitigation as the video/B1 add-flow: campaign saved, clear message, images addable from Edit.
- **Duplication across Add/Edit** → accepted (matches codebase); future shared-component refactor noted.
- **Matching created layouts to pending files** → match by array index/`sort` (the order is preserved in the request and the resource returns `sort`).

## 11. Non-goals
- No backend changes (B1 done). No public-landing changes (B3). No drag-reorder of layouts/renderings in B2 (order = array position; reorder is a possible enhancement). No shared Add/Edit component extraction.
