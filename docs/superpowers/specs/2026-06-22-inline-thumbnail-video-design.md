# Inline Thumbnail Video (Sub-project C / H1) — Design Spec

- **Date:** 2026-06-22
- **Status:** Proposed — awaiting user review before implementation planning
- **Owner:** Full-stack — RenoXpert-Backend (Laravel 11) + RenoXpert-Frontend-v2.1 (React 18 + TS), base branch `production`
- **Part of:** "RenoXpert Campaign Refindment" (Phase 2). Sub-project **C**. (A = Quotation Detail — done/merged; B = Layout Type system — not started.)

---

## 1. Context & Goal

The public campaign landing (`src/pages/CampaignPages/CampaignDetailPage.tsx`) shows a static hero **thumbnail image** (`campaign.thumbnail`, an S3 JSON `{file_url, path}`). H1 adds an optional **thumbnail video**: a play button overlaid on the hero thumbnail that opens a **modal/lightbox** player. Admins upload the video; it is stored on **S3** (mirroring the existing thumbnail flow) under a new `thumbnail_video` column on `campaigns`.

**Goal:** Let a campaign carry one optional hero video, manage it in the admin (upload/replace/remove), expose it on the public campaign API, and play it from a play button on the landing hero — without changing any existing thumbnail behavior.

**Locked decisions (user, 2026-06-22):** (1) video is **uploaded to S3** via a **dedicated endpoint** (not bundled into the campaign multipart save — videos are large); (2) playback is a **modal/lightbox**; (3) **campaign-level, single** video.

## 2. Scope

**Backend (RenoXpert-Backend):**
- **Laravel migration** (additive `Schema::table` ALTER) adding a nullable `thumbnail_video` JSON column to `campaigns`. **The user runs `php artisan migrate` manually — we author the file but do NOT run it.** (Override of the usual raw-SQL approach for this sub-project; see [[renoxpert-backend-schema-unmanaged]].)
- `app/Models/Campaign.php` — add `thumbnail_video` to `$fillable` and `$casts`.
- `app/Http/Controllers/CampaignController.php` — two new methods: `uploadThumbnailVideo($id)` and `deleteThumbnailVideo($id)` (S3 upload/delete, mirroring the thumbnail pattern, with video validation).
- `routes/api.php` — two new authenticated routes.
- Both campaign resources (`app/Http/Resources/CampaignResource.php` admin + `app/Http/Resources/Campaign/CampaignResource.php` public) — serialize `thumbnail_video`.

**Frontend (RenoXpert-Frontend-v2.1):**
- `src/types/index.ts` — `Campaign.thumbnail_video?: Attachment | File`.
- `src/services/api.ts` — `uploadCampaignThumbnailVideo(campaignId, file)` and `deleteCampaignThumbnailVideo(campaignId)`.
- `src/pages/Campaign/AddCampaign.tsx` + `EditCampaign.tsx` — a video upload control (select/preview/replace/remove) and wiring to the dedicated endpoint.
- `src/pages/CampaignPages/CampaignDetailPage.tsx` — play button overlay on the hero + a modal video player.

**Out of scope:** the existing thumbnail image behavior (unchanged); the quotation pages; Sub-projects A and B; any video transcoding/streaming (plain S3-hosted file via `<video>`); thumbnails/poster generation; per-package video (campaign-level only).

## 3. Constraints

- **Schema via a Laravel migration** (additive `Schema::table` ALTER on the existing `campaigns` table). **The user runs `php artisan migrate` manually per environment (local → staging → prod) before deploying code that reads/writes the column — we do NOT run it.** Note: the base campaign tables are not in migrations, so `migrate:fresh` won't rebuild them; a normal `php artisan migrate` applies this additive ALTER to the existing table fine.
- **Mirror the thumbnail S3 pattern exactly** (`Storage::disk('s3')->putFileAs('campaigns', $file, $name, 'public')`; store `{file_url: config('filesystems.disks.s3.url').'/'.$path, path: $path}`; delete old `path` on replace). Directory `campaigns/`, filename prefix `thumbnail_video_`.
- **Do not alter existing thumbnail behavior** (validation, upload, serialization, render) or any unrelated campaign field.
- **Reuse the Phase-1 design primitives / crimson system** on the public side; no new frontend dependencies.
- **Frontend verification gate** (repo convention): `npm run build` (`tsc -b && vite build`) exit 0 AND scoped `npx eslint <changed files> --ext ts,tsx --max-warnings 0` exit 0. Project-wide `npm run lint` is pre-existingly broken (not a gate). No test runner — do not scaffold one.
- **Backend verification gate** (no automated tests for the campaign domain): `php -l` clean on changed PHP files; `php artisan route:list` shows the new routes; manual API smoke (upload → public response carries `thumbnail_video` → file plays).
- **Video upload limits:** the server's PHP `upload_max_filesize` and `post_max_size` (and any proxy/body limits) must be ≥ the chosen max. This is an **environment/ops prerequisite**, flagged below.

## 4. Feature design

### 4.1 Backend

**Migration** — create `database/migrations/2026_06_22_000000_add_thumbnail_video_to_campaigns_table.php` (the user runs `php artisan migrate` manually; we do NOT run it):
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->json('thumbnail_video')->nullable()->after('thumbnail');
        });
    }

    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropColumn('thumbnail_video');
        });
    }
};
```
(`->after('thumbnail')` is MySQL syntax — the project's DB. The migration only ALTERs the existing table; it does not depend on a `create_campaigns` migration existing.)

**Model** — `Campaign.php`: add `'thumbnail_video'` to `$fillable` (after `'thumbnail'`) and `'thumbnail_video' => 'array'` to `$casts`.

**Controller** — two new methods in `CampaignController.php`, mirroring the thumbnail S3 code (store lines 161–177; delete lines 246–249):

- `uploadThumbnailVideo(Request $request, $id)`:
  - Resolve the campaign by id (404 if missing).
  - Validate: `'thumbnail_video' => 'required|file|mimetypes:video/mp4,video/webm,video/quicktime|max:51200'` (50 MB).
  - If the campaign already has a `thumbnail_video.path`, `Storage::disk('s3')->delete($oldPath)`.
  - `putFileAs('campaigns', $file, 'thumbnail_video_'.time().'_'.uniqid().'.'.$ext, 'public')`.
  - Set `$campaign->thumbnail_video = ['file_url' => config('filesystems.disks.s3.url').'/'.$path, 'path' => $path]; $campaign->save();`
  - Return the updated campaign (admin `CampaignResource`).
- `deleteThumbnailVideo($id)`:
  - Resolve campaign; if `thumbnail_video.path` exists, delete from S3; set `thumbnail_video = null`; save; return the campaign.

**Routes** — inside the `auth:sanctum` group (near line 319, beside `campaigns/{campaignId}/update`):
```php
Route::post('campaigns/{id}/thumbnail-video/upload', [CampaignController::class, 'uploadThumbnailVideo']);
Route::delete('campaigns/{id}/thumbnail-video', [CampaignController::class, 'deleteThumbnailVideo']);
```

**Resources** — add `'thumbnail_video' => $this->thumbnail_video,` to BOTH `CampaignResource.php` (admin, after line 24) and `Campaign/CampaignResource.php` (public, after line 22). The `array` cast means it serializes as `{file_url, path}` (or `null`).

### 4.2 Admin UI (AddCampaign + EditCampaign)

**api.ts** — add two functions mirroring `uploadProductPhotos` (lines 409–437):
```ts
export const uploadCampaignThumbnailVideo = async (campaignId: number | string, file: File) => {
  const formData = new FormData();
  formData.append('thumbnail_video', file);
  const response = await axios.post(`${API_URL}campaigns/${campaignId}/thumbnail-video/upload`, formData, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
export const deleteCampaignThumbnailVideo = async (campaignId: number | string) => {
  const response = await axios.delete(`${API_URL}campaigns/${campaignId}/thumbnail-video`, { headers: getAuthHeaders() });
  return response.data;
};
```

**UI control** (added beneath the existing "Campaign Thumbnail" block, ~line 681 in both forms): a file input `accept="video/mp4,video/webm,video/quicktime"`, a selected-file name/preview (a small `<video controls>` of the local object URL), the **current** video (from `campaign.thumbnail_video.file_url` on Edit) with a **Remove** button, and a client-side size check (≤ 50 MB) with a friendly error.

**Flow (two-step, because the endpoint needs a campaign id):**
- **EditCampaign:** the campaign id already exists. On selecting a video → call `uploadCampaignThumbnailVideo(campaignId, file)` (immediately, or on save — *decision: immediately, with a spinner*, so it's independent of the rest of the form). **Remove** → `deleteCampaignThumbnailVideo(campaignId)`. Refresh the displayed current video from the response.
- **AddCampaign:** there is no id until the campaign is created. The submit handler `createCampaign(...)` returns the new campaign; **after** a successful create, if a video file was selected, call `uploadCampaignThumbnailVideo(newId, file)` using the id from the create response, then continue the existing post-create navigation. (The exact id field on the create response wrapper is confirmed during planning.)

The existing `thumbnail` (image) upload path is **unchanged** — the video is a separate control and a separate request.

### 4.3 Public landing (CampaignDetailPage)

Target: the hero image block (lines 294–304). Two changes:

1. Make the image container `relative` and, when `campaign.thumbnail_video` exists, overlay a **play button** anchored to the bottom of the thumbnail (e.g. a crimson circular button with a `Play` lucide icon + "Watch video" label, `absolute bottom-3 left-3`, ≥44px tap target). It sits over the existing `<img>` (image render itself unchanged; the fallback `<Package>` state shows no play button).
2. Add a small piece of state `const [videoOpen, setVideoOpen] = useState(false)`. Clicking the play button sets it true and opens a **modal/lightbox**: a fixed full-screen overlay (`fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4`), containing a `<video src={(campaign.thumbnail_video as Attachment).file_url} controls autoPlay className="max-h-[80vh] w-auto rounded-xl" />` and a close affordance (X button top-right + click-on-backdrop + Esc). Closing pauses/unmounts the video.

No change to the rest of the hero, the booking flow, or the mobile sticky CTA.

### 4.4 Types
`Campaign` interface: add `thumbnail_video?: Attachment | File;` after `thumbnail` (line 1631). Public render casts `(campaign.thumbnail_video as Attachment).file_url`, matching the existing thumbnail cast.

## 5. Verification plan

- **Backend:** `php -l` on the new migration, `Campaign.php`, `CampaignController.php`, both resources, `routes/api.php` → no syntax errors. `php artisan route:list | grep thumbnail-video` shows both routes (auth:sanctum). **The user runs `php artisan migrate` manually** (we do not). Manual smoke (after the user migrates): upload an MP4 via the admin → 200 + `thumbnail_video` set; `GET /public/campaigns/{slug}` returns `thumbnail_video.file_url`; the URL streams in a browser; replace → old S3 object deleted; delete → column null + S3 object gone.
- **Frontend:** `npm run build` exit 0; scoped eslint on the changed files exit 0. Manual QA: admin upload/replace/remove (incl. >50 MB rejected client-side); landing shows the play button only when a video exists; modal opens, plays, closes (X / backdrop / Esc); no play button on the image-fallback state; image-only campaigns unaffected; desktop + mobile (375/768/1280).
- **Ops prerequisite check:** confirm server `upload_max_filesize`/`post_max_size` ≥ 50 MB on each environment.

## 6. Risks & mitigations
- **Upload size / server limits** → 50 MB cap + client-side pre-check + the ops prerequisite note; dedicated endpoint keeps large uploads out of the campaign save.
- **AddCampaign two-step partial failure** (campaign created, video upload fails) → surface a clear toast ("Campaign saved, but the video upload failed — re-upload from Edit"); the campaign is still valid without a video.
- **S3 object orphaning on replace/delete** → mirror the existing delete-old-`path` logic exactly.
- **Autoplay policy** → the modal `<video>` uses `controls`; autoplay with sound may be blocked by browsers — acceptable (user can press play); do not rely on autoplay.
- **No automated tests** → rely on `php -l` + route:list + build/scoped-lint + the manual matrix.

## 7. Non-goals
- No transcoding, adaptive streaming, poster-frame generation, or CDN signing beyond the existing public-S3 URL.
- No per-package or per-layout video (campaign-level only; per-layout media is Sub-project B's concern).
- No change to the existing thumbnail image feature.
