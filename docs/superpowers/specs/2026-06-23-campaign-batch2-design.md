# Campaign Batch 2 — YouTube Video, Start-from Total, Layout Thumbnail (Design Spec)

- **Date:** 2026-06-23
- **Status:** Proposed — awaiting user review before implementation planning
- **Repos:** Backend `RenoXpert-Backend` (deploys from `production`, PR-protected) + Frontend `RenoXpert-Frontend-v2.1` (deploys from `production`, merge+push)
- **Combined spec** for three independent items (A, B, C). B is frontend-only; A and C span backend + admin + public.

---

## 1. Context & Goal

Three campaign enhancements:
- **A — YouTube video:** a campaign may have a YouTube link in addition to (or instead of) the uploaded thumbnail video. On the public campaign page, "Watch video" shows an embedded YouTube player when a link is set.
- **B — Start-from total:** the public "Start from RMxxx" figure (currently the per-program **Initial Down Payment**) becomes the **full quotation total**, and the "initial down" wording is removed.
- **C — Layout thumbnail:** layout types gain a new `layout_thumbnail` image; public layout cards display it (placeholder when unset).

## 2. Decisions (locked with user)

- **B amount** = full quotation total: the sum of all **included** package prices in the quote (program-agnostic), or `order.total_amount` when `f_1`. **Applies to both** the layout-detail package cards and the landing layout-card teaser. Keep the "Start from" label; remove "initial down".
- **A precedence**: both an uploaded file and a YouTube URL may be stored; on public, **the YouTube URL wins if set** (iframe embed), otherwise the uploaded `<video>`. "Watch video" shows if either exists.
- **C fallback**: public layout cards show `layout_thumbnail` only; when unset, show the existing **placeholder** icon (do NOT fall back to `rental_projection`).

## 3. Item A — YouTube video

### Backend (`RenoXpert-Backend`)
- **Migration (authored; user runs):** add nullable string column `thumbnail_video_url` to `campaigns` (`$table->string('thumbnail_video_url')->nullable();`). Additive only — no index/FK concerns.
- `app/Models/Campaign.php`: add `'thumbnail_video_url'` to `$fillable` (it is a plain string — no cast needed).
- Add `'thumbnail_video_url' => $this->thumbnail_video_url` to **both** campaign resources: `app/Http/Resources/CampaignResource.php` (used by admin `show`/`store`/`update`) **and** `app/Http/Resources/Campaign/CampaignResource.php` (this is `PublicCampaignResource` — aliased via `use App\Http\Resources\Campaign\CampaignResource as PublicCampaignResource;` — used by the public `showPublic`). The public page reads the field, so the `Campaign/CampaignResource.php` one is required.
- `CampaignController@store` and `@update`: add validation `'thumbnail_video_url' => 'nullable|string|url'`. The field is set via the normal `$validatedData` mass-assign (already how other campaign fields flow). Empty string should be treated as null (the existing `ConvertEmptyStringsToNull` middleware handles `""`).

### Admin frontend (`AddCampaign.tsx`, `EditCampaign.tsx`)
- Add `thumbnail_video_url: ''` to the `formData` state; in Edit, load it from the fetched campaign (`campaign.thumbnail_video_url ?? ''`).
- Add a labelled text `<input type="url">` ("YouTube link (optional)") in the existing video section, bound to `formData.thumbnail_video_url` via the existing field-change pattern.
- No API-layer change needed: `createCampaign`/`updateCampaign` already serialize top-level `formData` keys into FormData (non-null only), so the new field is sent automatically.

### Public frontend (`CampaignDetailPage.tsx`)
- Add a helper `getYouTubeEmbedUrl(url?: string | null): string | null` (new util, e.g. in `src/utils/`), returning an embed URL `https://www.youtube.com/embed/{id}` for the common forms — `youtube.com/watch?v=ID`, `youtu.be/ID`, `youtube.com/shorts/ID`, `youtube.com/embed/ID` — and `null` if not parseable.
- "Watch video" button (CampaignDetailPage:321): show it when `getYouTubeEmbedUrl(campaign.thumbnail_video_url)` is non-null **OR** `campaign.thumbnail_video` (file) exists.
- Modal (CampaignDetailPage:707-723): if the embed URL is non-null, render an `<iframe>` (16:9, `allow="...; encrypted-media; picture-in-picture"`, `allowFullScreen`) with the embed `src`; else render the existing `<video src=file_url>`. Keep the existing open/close + body-scroll-lock behavior.

## 4. Item B — Start-from = full quotation total (frontend only)

- **`src/utils/quotationPricing.ts`**: add
  ```ts
  export function getQuotationTotal(order?: OrderWithQuotation | null): number
  ```
  Returns the full quotation total: `0` if no order; `Number(order.total_amount)` when `order.f_1 && order.total_amount != null`; otherwise the sum over `latest_quotation.packages` of `getQuotationPackagePrice(pkg, order)`, **excluding** packages where `is_addon === true && is_addon_included === false`. (This is the `getInitialDownPayment` "normal" branch **without** the `/2`, and program-agnostic — no bePowered/rnpl special-casing.)
- **`CampaignLayoutDetailPage.tsx`** (package cards, ~376/443-446): compute `startFrom = getQuotationTotal(pkg.order)`; remove the `initial down` `<span>` (line ~446); keep the "Start from" label and the `RM` formatting. The existing `startFrom > 0` vs `<= 0` branching (Start-from vs Booking-Fee fallback) stays.
- **`CampaignDetailPage.tsx`** (landing layout-card teaser, ~372/394): change the per-layout `startFrom` reduce to use `getQuotationTotal(p.order)` instead of `getInitialDownPayment(p.order)` (still "min over the layout's packages", still gated on `> 0`). Keep the "Start from RM…" label.
- Remove now-unused `getInitialDownPayment` imports **only if** no longer referenced in that file (check before removing to avoid an unused-import lint error).

## 5. Item C — Layout thumbnail

### Backend (`RenoXpert-Backend`)
- **Migration (authored; user runs):** add JSON/text column `layout_thumbnail` to `campaign_layout_types` (`$table->json('layout_thumbnail')->nullable();` — match the column type used by `rental_projection`). Additive only.
- `app/Models/CampaignLayoutType.php`: add `'layout_thumbnail'` to `$fillable` and `'layout_thumbnail' => 'array'` to `$casts` (mirror `rental_projection`).
- `app/Http/Resources/CampaignLayoutTypeResource.php`: add `'layout_thumbnail' => $this->layout_thumbnail`. (This is the **single** layout-type resource used by every path — admin and public both wrap `layoutTypes` with `CampaignLayoutTypeResource::collection(...)` — so this one edit covers both.)
- `CampaignLayoutTypeController`: add `uploadLayoutThumbnail($id)` and `deleteLayoutThumbnail($id)` mirroring `uploadRentalProjection`/`deleteRentalProjection` (single image, S3 put/delete, same validation `required|image|mimes:jpeg,png,jpg,gif|max:10240`, stores `['file_url' => ..., 'path' => ...]`).
- `routes/api.php`: add `POST campaign-layout-types/{id}/layout-thumbnail` and `DELETE campaign-layout-types/{id}/layout-thumbnail` next to the rental-projection routes (same auth group).

### Admin frontend (`AddCampaign.tsx`, `EditCampaign.tsx`, `services/api.ts`)
- `services/api.ts`: add `uploadCampaignLayoutTypeThumbnail(layoutTypeId, file)` and `deleteCampaignLayoutTypeThumbnail(layoutTypeId)` mirroring the rental-projection API functions.
- **AddCampaign**: add a `layoutThumbnailFile: Record<number, File>` state map; an upload control per layout type (label "Layout Thumbnail (single image)") wrapped in `FileDropzone accept="image"`; on submit, after the layout type is created, upload its thumbnail via the new endpoint (mirror how `layoutProjectionFile` is uploaded). **Reindex** this map in `removeLayoutType` (via `shiftNumericIndexMap`) and **include it in the drag-reorder bundle** (the layout-reorder bundles all per-layout image maps — the new map MUST be added there too, or reordering will mis-associate thumbnails).
- **EditCampaign**: add `layoutThumbnailUrl: Record<number, string | null>` + `pendingLayoutThumbnailFile: Record<number, File>` maps (mirror projection); load existing from `lt.layout_thumbnail`; an upload control wrapped in `FileDropzone` that uploads immediately for existing layouts (async, with `layoutUploading`) and holds pending for new layouts; remove button calls `deleteCampaignLayoutTypeThumbnail`. **Reindex** all these new maps in `removeLayout` and **add them to the layout-reorder bundle**.

### Public frontend (`CampaignDetailPage.tsx`)
- Landing layout cards (~375): replace the image source from `lt.rental_projection` to `lt.layout_thumbnail` (as `Attachment | undefined`); when `file_url` is absent, render the **existing placeholder** (the `Package` icon block) — do NOT fall back to `rental_projection`.

## 6. Constraints

- **Backend schema** = authored Laravel migrations (additive `ADD COLUMN`, nullable); **NEVER run `php artisan migrate` ourselves** — the user runs it. Both repos deploy from **`production`**; backend changes go via a **PR to `production`**, frontend via **merge+push to `production`**.
- **No new npm dependencies** (YouTube via a plain `<iframe>`; no player lib). Reuse the existing `FileDropzone` for the new upload.
- **`php` CLI is unavailable** — backend verified by manual review.
- **Frontend verification gate:** `npm run build` exit 0 + scoped eslint introduces no NEW errors. Baselines: `AddCampaign.tsx` = 1, `EditCampaign.tsx` = 1, `CampaignDetailPage.tsx` = 0, `CampaignLayoutDetailPage.tsx` = 0, `quotationPricing.ts` = 0, `services/api.ts` = 17 (pre-existing), new util file = 0. No test runner.
- **Graceful degradation:** the FE must not break before the migrations are run — `thumbnail_video_url`/`layout_thumbnail` simply read as absent (empty link / placeholder) until the columns exist and are populated.

## 7. Verification plan

- **Backend:** manual review of migration, model, resource(s), controller methods, routes. Confirm the **public** resource path exposes `thumbnail_video_url` and `layout_thumbnail`.
- **Frontend:** build exit 0; scoped eslint per the baselines above.
- **Manual QA (after migrations run + deploy):**
  - A: set a YouTube link in admin → public "Watch video" opens an embedded YouTube player; with only an uploaded file → `<video>` plays; with both → YouTube shown; with neither → no button.
  - B: package cards and landing teaser show the full quotation total (≈ 2× the old initial-down figure for full-payment), no "initial down" text; the Booking-Fee fallback still appears when total is 0.
  - C: upload a layout thumbnail (drag-and-drop works) → it appears on the layout card; a layout with no thumbnail shows the placeholder (not the rental projection).

## 8. Risks & mitigations

- **Layout-reorder map desync (known bug class):** adding `layout_thumbnail` maps without adding them to the reorder bundle + `remove*` reindex would mis-associate thumbnails after reordering. Mitigation: the plan explicitly adds the new maps to every bundle/reindex site; the review must verify this (same gate that caught it before).
- **Public resource omission:** if the public campaign API uses a different resource than the admin one, the new fields must be added there too or the public page won't see them. Mitigation: verify the `showPublic`/`PublicCampaignResource` path during backend work.
- **YouTube URL parsing:** unparseable/private URLs → `getYouTubeEmbedUrl` returns null → falls back to file (or no button). Keep the parser tolerant of `watch`, `youtu.be`, `shorts`, `embed` forms with query params.
- **Unused-import lint:** removing `getInitialDownPayment` usages may leave an unused import — remove the import only if truly unreferenced.

## 9. Non-goals

- No video player library; no YouTube thumbnail auto-fetch; no multiple videos. No change to the per-product Qty table or to owner/admin pricing pages. No change to `rental_projection`/`rendering_images` behavior (they stay; only the public **card image** switches to `layout_thumbnail`). No reordering of layout thumbnail vs other images.

## 10. Suggested plan task grouping

1. **BE-A:** campaign `thumbnail_video_url` migration + model + resource(s) + validation.
2. **BE-C:** layout `layout_thumbnail` migration + model + resource + upload/delete endpoints + routes.
3. **FE-B:** `getQuotationTotal` + switch both card/teaser sites + remove "initial down".
4. **FE-A:** admin YouTube input + public embed (`getYouTubeEmbedUrl` + iframe modal).
5. **FE-C:** admin layout-thumbnail upload (DnD + maps + reorder bundle + reindex) + public card image swap + API functions.
6. **Verify + finalize:** FE build/eslint, BE manual review; BE PR to `production`; FE merge+push.
