# Layout Type System (Sub-project B / H2 + H3 + H5 + H6) — Design Spec

- **Date:** 2026-06-22
- **Status:** Proposed — awaiting user review before implementation planning
- **Owner:** Full-stack — RenoXpert-Backend (Laravel 11) + RenoXpert-Frontend-v2.1 (React 18 + TS), base branch `production`
- **Part of:** "RenoXpert Campaign Refindment" (Phase 2). Sub-project **B** (A = Quotation Detail ✅ merged; C = Inline Video ✅ merged/PR). This is the largest sub-project.

---

## 1. Context & Goal

Today a campaign has a **flat** list of `CampaignPackage`s. On the public landing the user picks a package directly; in the admin the packages are a flat array. This sub-project adds an **optional Layout Type layer** above packages:

- **H2** — `Campaign → LayoutType → CampaignPackage (sub-package)`. The public user picks a **Layout Type** first; its sub-packages then appear. Campaigns may remain flat (no layouts) — layout is **optional and backward-compatible**.
- **H3** — each sub-package card shows **"Start from RM{Initial Down Payment}"** (the per-program initial down payment).
- **H5** — each Layout Type has **one** rental-projection image.
- **H6** — each Layout Type has **many** rendering / reno images.

**Locked decisions (user, 2026-06-22):** new optional tables (`campaign_layout_types` + `campaign_packages.layout_type_id`); schema via **Laravel migrations authored but NOT run** (user runs `php artisan migrate`; see [[renoxpert-backend-schema-unmanaged]]); **"Start from" computed on the frontend via a shared util** (the public API already nests each package's `order.latest_quotation`); layout images stored as **JSON columns** on the layout (rental projection single + renderings array) with dedicated upload endpoints; public UX = **Layout cards → sub-packages below** (rental-projection image on the card; renderings gallery on the selected layout).

## 2. Scope

**Backend (RenoXpert-Backend):**
- Migrations (authored, not run): create `campaign_layout_types`; add `layout_type_id` to `campaign_packages`.
- Models: `CampaignLayoutType` (belongsTo campaign, hasMany packages); `Campaign` hasMany `layoutTypes`; `CampaignPackage` gets `layout_type_id` (fillable) + `layoutType()` relation.
- `CampaignController` store()/update(): accept a nested `layout_types` array (create/sync like packages) and thread `layout_type_id` onto packages.
- `CampaignLayoutTypeController`: image endpoints — upload/replace rental projection (single), upload renderings (multiple), delete a rendering, delete rental projection.
- Resources: public `CampaignResource` returns a `layout_types` array (`id, name, description, sort, rental_projection, rendering_images`); `CampaignPackageResource` adds `layout_type_id`. (Packages stay a flat array with `layout_type_id`; the frontend groups them.)

**Frontend (RenoXpert-Frontend-v2.1):**
- Types: `CampaignLayoutType`; `Campaign.layout_types`; `CampaignPackage.layout_type_id`.
- `src/services/api.ts`: layout image upload/delete helpers.
- Shared util `src/utils/initialDownPayment.ts` — `getInitialDownPayment(order)` extracted from the quotation-detail formula; **refactor `CampaignPackageDetailPage` to use it** (DRY, single source of truth).
- Admin (`AddCampaign`/`EditCampaign`): a Layout Type management layer (add/remove/name/description, rental-projection + renderings upload, assign sub-packages to a layout).
- Public (`CampaignDetailPage`): when a campaign has layout types, render Layout cards (with rental-projection image) → on select, show that layout's renderings gallery + its sub-package cards (each with "Start from"); flat campaigns render exactly as today.

**Out of scope:** changing the quotation-detail pricing math (only extracting the down-payment formula into a util it then consumes); per-package video; the flat-campaign code path's behavior; Sub-project A/C; the FAQ (H4). No new frontend dependencies.

## 3. Constraints

- **Migrations authored but NOT run** by us — the user runs `php artisan migrate`. Both migrations are additive (`create` for the new table; `Schema::table` ALTER for `layout_type_id`). The base campaign tables aren't in migrations, so never `migrate:fresh`.
- **Optional & backward-compatible:** existing flat campaigns (no layout types, `layout_type_id` null) must render and be editable exactly as today. The layout layer is additive.
- **Reuse existing patterns:** package create/sync mirrors the current `packages()` flow; image storage mirrors `products.attachments` JSON + the S3 `putFileAs('...','public')` + `{file_url, path}` convention; image upload endpoints are dedicated (layout id required → two-step on create).
- **DRY the down-payment formula:** one util consumed by both the landing ("Start from") and the quotation-detail page.
- **Verification gates:** FE — `npm run build` exit 0 + scoped eslint introduces no new errors (some touched files have pre-existing errors — gate is "no new errors", `CampaignDetailPage` must stay clean). BE — `php -l` clean (NOTE: `php` is currently unavailable in this env → manual syntax review), `route:list` best-effort; **never run migrate**. No test runner — don't scaffold one.
- **S3 / ops:** image MIME `image/jpeg,image/png,image/jpg,image/gif|max:10240` (match the thumbnail rule); renderings stored under `campaigns/layout-types/{id}/`.

## 4. Data model

**New table `campaign_layout_types`:** `id`, `campaign_id` (FK), `name`, `description` (nullable), `sort` (int, default 0), `rental_projection` (json nullable — `{file_url, path}`), `rendering_images` (json nullable — array of `{file_url, path}`), `metadata` (json nullable), `created_by`, `updated_by`, `deleted_at`, timestamps, soft deletes.

**`campaign_packages`:** add `layout_type_id` (FK nullable → campaign_layout_types).

**Relations:** `Campaign hasMany CampaignLayoutType` (`layoutTypes`); `CampaignLayoutType belongsTo Campaign`, `hasMany CampaignPackage` (`packages`, via `layout_type_id`); `CampaignPackage belongsTo CampaignLayoutType` (`layoutType`).

## 5. Backend design

- **Migration 1** `create_campaign_layout_types_table` (columns above). **Migration 2** `add_layout_type_id_to_campaign_packages_table` (`$table->foreignId('layout_type_id')->nullable()->after('campaign_id')` or plain nullable unsignedBigInteger to avoid FK-constraint issues with the out-of-band base table — **use a plain nullable column, no DB-level FK**, to stay consistent with how the campaign tables are managed). Both authored, not run.
- **Models:** `CampaignLayoutType` (fillable: campaign_id, name, description, sort, rental_projection, rendering_images, metadata, created_by, updated_by; casts: rental_projection/rendering_images/metadata → array; soft deletes; created_by boot hook like Campaign). Add `layout_type_id` to `CampaignPackage.$fillable` + `layoutType()` relation. Add `layoutTypes()` to `Campaign`.
- **CampaignController store()/update():** accept optional `layout_types` (array of `{id?, name, description, sort}`). Validate `layout_types.*.name`. On store: create layout types first, build a map (input index/temp-key → new layout id), then when creating packages thread `layout_type_id`. On update: sync layout types (delete-missing / update-with-id / create-new — mirroring the existing package-sync block), then sync packages with their `layout_type_id`. Add `'packages.*.layout_type_id' => 'nullable|integer'`. Flat campaigns send no `layout_types` and null `layout_type_id` — unchanged path.
- **CampaignLayoutTypeController (new) + routes (auth:sanctum):**
  - `POST campaign-layout-types/{id}/rental-projection` (single image; replace deletes old `path`), `DELETE campaign-layout-types/{id}/rental-projection`.
  - `POST campaign-layout-types/{id}/renderings` (one or more files appended to the `rendering_images` array), `DELETE campaign-layout-types/{id}/renderings` (with a body/param identifying which to remove — by `path`), and optionally `PUT .../renderings/reorder`.
  - All mirror the thumbnail/product S3 pattern and return the updated layout type.
- **Resources:** public `CampaignResource` adds `layout_types => whenLoaded('layoutTypes', fn() => CampaignLayoutTypeResource::collection(...))`; `showPublic` loads `packages.order` (existing) + `layoutTypes`. New `CampaignLayoutTypeResource` (`id, name, description, sort, rental_projection, rendering_images`). `CampaignPackageResource` adds `layout_type_id`.

## 6. Admin design (AddCampaign + EditCampaign)

- Keep the existing `campaignMode` ('single' | 'packages'). When 'packages', introduce an optional **Layout Types** section: a `layoutTypes` state array (`{id?, name, description, sort}`) with Add/Remove. Each package gets a **Layout Type** selector (dropdown of the defined layout types, or "None"); store `layout_type_id` on the package (by temp index for new layouts, resolved on save). Visually, group package cards under their layout type.
- **Images (two-step, like the video):** rental projection + renderings upload need a layout id. On **Edit** (layout ids exist) upload immediately via the endpoints. On **Add**, the layout ids don't exist until save → after `createCampaign` returns the created campaign (with its layout types + ids), upload the selected images per new layout id; surface a clear message if an image upload fails (campaign still saved). Show current images (Edit) with remove; client-side validate image type/size.
- Submit payload: `layout_types: [{id?, name, description, sort}]` + `packages: [{..., layout_type_id}]` (layout_type_id references either an existing id or a temp key the backend resolves). Flat campaigns send neither.

## 7. Public design (CampaignDetailPage)

- Derive `layoutTypes = campaign.layout_types ?? []` and group `campaign.packages` by `layout_type_id`.
- **If layout types exist:** replace the flat package grid with a two-level UI:
  1. **Layout cards** — one card per layout type showing its **rental-projection image** (H5), name, description, and a count/teaser. New state `selectedLayoutType`. Selecting a card reveals its content.
  2. **On selected layout:** the **rental-projection image** shown large and **tap-to-enlarge** (H5 — opens in the same lightbox as renderings); a **renderings gallery** (H6 — the layout's `rendering_images`, a responsive grid, each **tap-to-enlarge**) — both reuse the Sub-project-C modal/lightbox pattern; and the layout's **sub-package cards** — the existing package-card UI (radio, `booking_amount` "Booking Fee", "View Quotation"), plus **"Start from RM{getInitialDownPayment(pkg.order)}"** (H3). `selectedPackage` + `handlePackageChange` + booking flow stay intact (scoped to the selected layout's packages).
  - **Lightbox (shared):** a single image lightbox handles BOTH the rental projection and every rendering — tap any of them to enlarge; close via X / backdrop / Esc (reuse the C modal pattern).
- **If no layout types (flat):** render exactly as today (no regression).
- Default selection: first layout type, then its first available sub-package (mirrors today's first-available default).
- Reuse the crimson primitives; renderings lightbox reuses the C modal pattern.

## 8. Shared util + DRY

- Create `src/utils/initialDownPayment.ts`: `getInitialDownPayment(order: Order): number` implementing the canonical per-program formula (bePowered `be_powered_base_price + Σ one-off pkg (markup_amount ?? total_price)×qty − bonus.value`; rnpl `rnpl_base_price`; normal `Σ pkg price ÷ 2`), reading `order.latest_quotation` (packages from its `metadata`/`packages`, bonus, etc.) and honoring the `f_1` fixed-total short-circuit — i.e. the same logic as `CampaignPackageDetailPage`'s `originalInitialDownPayment`.
- **Refactor `CampaignPackageDetailPage`** so its `originalInitialDownPayment` calls this util (keeps the detail page exact; removes duplication). The landing's "Start from" uses the same util per sub-package.

## 9. Verification plan

- **Backend:** `php -l` (or manual review — php unavailable) on the 2 migrations, the 3 models, `CampaignController`, `CampaignLayoutTypeController`, routes, the 2 resources. `route:list | grep layout` best-effort. Manual smoke (after the user migrates): create a layered campaign (2 layouts × 2 sub-packages, 1 projection + 3 renderings each); `GET /public/campaigns/{slug}` returns `layout_types` with images + `packages[].layout_type_id`; flat campaign still works.
- **Frontend:** `npm run build` exit 0; scoped eslint adds no new errors (CampaignDetailPage stays clean). Manual QA at 375/768/1280: layered campaign shows layout cards → select → renderings gallery + sub-packages with correct "Start from" per program; flat campaign unchanged; admin create/edit of layouts + image upload/replace/remove; the quotation-detail page (post-util-refactor) shows identical numbers to before.
- **Cross-check:** "Start from" equals the quotation-detail Initial Down Payment (gross, pre-booking-fee) for the same package, since both use the shared util.

## 10. Risks & mitigations
- **Large surface area** → execute in 3 phases (see §13); each independently verifiable.
- **Breaking the flat path** → guard everything on `layout_types?.length`; keep the existing flat render/edit code path intact; default-render flat when no layouts.
- **Util refactor altering detail-page numbers** → the util reproduces the existing formula exactly; verify the detail page shows identical figures before/after.
- **Add-flow image two-step partial failure** → same mitigation as the video: save succeeds, surface a "add images later from Edit" message.
- **FK to an out-of-band table** → use a plain nullable `layout_type_id` column (no DB FK constraint), consistent with how campaign tables are managed.
- **php/migrate unavailable here** → backend verified by inspection; user runs migrate.

## 11. Non-goals
- No change to the quotation pricing math (only formula extraction/reuse).
- No per-package or per-campaign video here (that's C); no captions/alt-text beyond file URLs (JSON-columns choice).
- No data migration of existing flat campaigns into layouts (they stay flat).

## 12. Open copy/UX notes
- Layout card content and the renderings gallery layout (grid vs carousel) are illustrative; final visual to be confirmed against a mockup if desired.

## 13. Suggested execution phasing (for the implementation plan)
Because B spans data + admin + public, the plan should run in **three phases**, each its own reviewable slice:
- **B1 — Backend & API:** migrations, models, controller threading, LayoutTypeController + image endpoints, resources. (Ships the data model + API.)
- **B2 — Admin:** layout management + image upload in AddCampaign/EditCampaign.
- **B3 — Public + util:** shared down-payment util (+ detail-page refactor), two-level landing UI, galleries, "Start from".
B1 is a prerequisite for B2/B3; B2 and B3 are independent of each other.
