# Campaign Batch 2 Implementation Plan (YouTube video, Start-from total, Layout thumbnail, TipTap description)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Five campaign enhancements — (A) optional YouTube link for the campaign video, (B) public "Start from" shows the full quotation total, (C) a new layout-type thumbnail image used on public layout cards, (D) a TipTap rich-text editor for the campaign description, (E) a bento grid for the layout-detail renderings.

**Architecture:** Backend (Laravel, `RenoXpert-Backend`) adds two additive nullable columns + a layout-thumbnail upload/delete endpoint pair; frontend (`RenoXpert-Frontend-v2.1`) adds admin inputs/uploads and public rendering. A and C span both repos; B and D are frontend-only. Reuse the existing `FileDropzone` for the new upload; YouTube via a plain `<iframe>`; rich text via TipTap with DOMPurify-sanitized public rendering.

**Tech Stack:** Laravel 11 (PHP 8.2, S3); React 18 + TS + Vite + Tailwind (crimson `campaign` token `#D71E42`); TipTap (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`) + `dompurify` (Item D only).

## Global Constraints

- **Backend schema** = authored Laravel migrations, additive nullable `ADD COLUMN` only; **NEVER run `php artisan migrate`** (the user runs it). `php` CLI unavailable → backend verified by manual review.
- Both repos **deploy from `production`**. Backend → **PR to `production`** (PR-protected). Frontend → **merge+push to `production`**.
- Backend branch: `feature/campaign-batch2` off `production` in `RenoXpert-Backend`. Frontend branch: `feature/campaign-batch2` off `production` in `RenoXpert-Frontend-v2.1` (this plan + spec already live here).
- **No new npm deps for A/B/C.** **Item D** adds exactly `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `dompurify` (+ `@types/dompurify` if needed). No `@tailwindcss/typography`.
- **No test runner** in the FE repo. Per-task verification = `npm run build` exit 0 + scoped eslint introduces no NEW errors. eslint baselines: `AddCampaign.tsx` 1, `EditCampaign.tsx` 1, `CampaignDetailPage.tsx` 0, `CampaignLayoutDetailPage.tsx` 0, `quotationPricing.ts` 0, `services/api.ts` 17, new files 0.
- **Graceful degradation:** FE must not break before migrations run — `thumbnail_video_url`/`layout_thumbnail` read as absent.
- **Commit trailers** on every commit:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS
  ```

---

### Task 1 (BE-A): Campaign `thumbnail_video_url`

**Repo/branch:** `RenoXpert-Backend`, `feature/campaign-batch2` (create off `production`).

**Files:**
- Create: `database/migrations/2026_06_23_000000_add_thumbnail_video_url_to_campaigns_table.php`
- Modify: `app/Models/Campaign.php` (fillable)
- Modify: `app/Http/Resources/CampaignResource.php`, `app/Http/Resources/Campaign/CampaignResource.php`
- Modify: `app/Http/Controllers/CampaignController.php` (store + update validation)

**Interfaces:**
- Produces: a `thumbnail_video_url` string field on the campaign API (admin + public).

- [ ] **Step 1: Create the migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->string('thumbnail_video_url')->nullable()->after('thumbnail_video');
        });
    }

    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropColumn('thumbnail_video_url');
        });
    }
};
```

- [ ] **Step 2: Add to the model `$fillable`**

In `app/Models/Campaign.php`, add `'thumbnail_video_url',` right after `'thumbnail_video',` in `$fillable`. (No `$casts` entry — it's a plain string.)

- [ ] **Step 3: Expose in both resources**

In `app/Http/Resources/CampaignResource.php` add, right after the `'thumbnail_video' => $this->thumbnail_video,` line:
```php
            'thumbnail_video_url' => $this->thumbnail_video_url,
```
Do the identical add in `app/Http/Resources/Campaign/CampaignResource.php` (after its `'thumbnail_video' => $this->thumbnail_video,`).

- [ ] **Step 4: Add validation in store + update**

In `app/Http/Controllers/CampaignController.php`, in the `store()` validator array (after `'thumbnail' => '...'`) add:
```php
                'thumbnail_video_url' => 'nullable|string|url',
```
Add the same line in the `update()` validator array (after its `'thumbnail' => '...'`). The field then flows through the existing `$validatedData` mass-assign (no further code needed).

- [ ] **Step 5: Manual review (no `php` CLI)**

Re-read the diff: migration additive+nullable; fillable updated; both resources expose the field; both validators accept `nullable|string|url`. Confirm no typos.

- [ ] **Step 6: Commit**

```bash
git add database/migrations/2026_06_23_000000_add_thumbnail_video_url_to_campaigns_table.php app/Models/Campaign.php app/Http/Resources/CampaignResource.php app/Http/Resources/Campaign/CampaignResource.php app/Http/Controllers/CampaignController.php
git commit -m "feat(campaign): add thumbnail_video_url (YouTube link) field

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 2 (BE-C): Layout `layout_thumbnail` + endpoints

**Repo/branch:** `RenoXpert-Backend`, `feature/campaign-batch2`.

**Files:**
- Create: `database/migrations/2026_06_23_000100_add_layout_thumbnail_to_campaign_layout_types_table.php`
- Modify: `app/Models/CampaignLayoutType.php` (fillable + casts)
- Modify: `app/Http/Resources/CampaignLayoutTypeResource.php`
- Modify: `app/Http/Controllers/CampaignLayoutTypeController.php` (two new methods)
- Modify: `routes/api.php` (two new routes)

**Interfaces:**
- Produces: `layout_thumbnail` (JSON `{file_url, path}` or null) on `CampaignLayoutTypeResource`; endpoints `POST/DELETE campaign-layout-types/{id}/layout-thumbnail`.

- [ ] **Step 1: Create the migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('campaign_layout_types', function (Blueprint $table) {
            $table->json('layout_thumbnail')->nullable()->after('rental_projection');
        });
    }

    public function down(): void
    {
        Schema::table('campaign_layout_types', function (Blueprint $table) {
            $table->dropColumn('layout_thumbnail');
        });
    }
};
```

- [ ] **Step 2: Model fillable + cast**

In `app/Models/CampaignLayoutType.php`: add `'layout_thumbnail',` after `'rental_projection',` in `$fillable`; add `'layout_thumbnail' => 'array',` after `'rental_projection' => 'array',` in `$casts`.

- [ ] **Step 3: Resource**

In `app/Http/Resources/CampaignLayoutTypeResource.php`, add after the `'rental_projection' => $this->rental_projection,` line:
```php
            'layout_thumbnail' => $this->layout_thumbnail,
```

- [ ] **Step 4: Controller methods**

In `app/Http/Controllers/CampaignLayoutTypeController.php`, add these two methods (mirror of `uploadRentalProjection`/`deleteRentalProjection`) before the closing class brace:

```php
    public function uploadLayoutThumbnail(Request $request, $id)
    {
        try {
            $layout = CampaignLayoutType::find($id);
            if (is_null($layout)) {
                return $this->sendError('Layout type not found.');
            }

            $validator = Validator::make($request->all(), [
                'layout_thumbnail' => 'required|image|mimes:jpeg,png,jpg,gif|max:10240',
            ]);
            if ($validator->fails()) {
                return $this->sendError('Validation Error.', $validator->errors(), 422);
            }

            if ($layout->layout_thumbnail && isset($layout->layout_thumbnail['path'])) {
                Storage::disk('s3')->delete($layout->layout_thumbnail['path']);
            }

            $file = $request->file('layout_thumbnail');
            $directory = 'campaigns/layout-types/' . $layout->id;
            $filename = 'thumbnail_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = Storage::disk('s3')->putFileAs($directory, $file, $filename, 'public');

            $layout->layout_thumbnail = [
                'file_url' => config('filesystems.disks.s3.url') . '/' . $path,
                'path' => $path,
            ];
            $layout->save();

            return $this->sendResponse(new CampaignLayoutTypeResource($layout), 'Layout thumbnail uploaded successfully.');
        } catch (\Exception $e) {
            Log::error('Layout thumbnail upload failed', ['layout_type_id' => $id, 'error_message' => $e->getMessage(), 'error_line' => $e->getLine()]);
            return $this->sendError('Failed to upload layout thumbnail.', [], 500);
        }
    }

    public function deleteLayoutThumbnail($id)
    {
        try {
            $layout = CampaignLayoutType::find($id);
            if (is_null($layout)) {
                return $this->sendError('Layout type not found.');
            }
            if ($layout->layout_thumbnail && isset($layout->layout_thumbnail['path'])) {
                Storage::disk('s3')->delete($layout->layout_thumbnail['path']);
            }
            $layout->layout_thumbnail = null;
            $layout->save();

            return $this->sendResponse(new CampaignLayoutTypeResource($layout), 'Layout thumbnail removed.');
        } catch (\Exception $e) {
            Log::error('Layout thumbnail delete failed', ['layout_type_id' => $id, 'error_message' => $e->getMessage(), 'error_line' => $e->getLine()]);
            return $this->sendError('Failed to remove layout thumbnail.', [], 500);
        }
    }
```

- [ ] **Step 5: Routes**

In `routes/api.php`, directly after the two rental-projection routes (lines ~323-324, same authenticated group), add:
```php
    Route::post('campaign-layout-types/{id}/layout-thumbnail', [CampaignLayoutTypeController::class, 'uploadLayoutThumbnail']);
    Route::delete('campaign-layout-types/{id}/layout-thumbnail', [CampaignLayoutTypeController::class, 'deleteLayoutThumbnail']);
```

- [ ] **Step 6: Manual review + commit**

Confirm the new methods mirror the rental-projection ones with `layout_thumbnail` throughout; routes in the same auth group; resource/model updated. Commit:
```bash
git add -A
git commit -m "feat(campaign): add layout_thumbnail image + upload/delete endpoints

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 3 (FE-B): Start-from = full quotation total

**Repo/branch:** `RenoXpert-Frontend-v2.1`, `feature/campaign-batch2` (create off `production`).

**Files:**
- Modify: `src/utils/quotationPricing.ts` (add `getQuotationTotal`)
- Modify: `src/pages/CampaignPages/CampaignLayoutDetailPage.tsx` (package cards)
- Modify: `src/pages/CampaignPages/CampaignDetailPage.tsx` (landing teaser)

**Interfaces:**
- Produces: `getQuotationTotal(order?: OrderWithQuotation | null): number`.

- [ ] **Step 1: Add `getQuotationTotal`**

In `src/utils/quotationPricing.ts`, after `getInitialDownPayment`, add:
```ts
/**
 * Full quotation total: sum of all INCLUDED package prices (program-agnostic),
 * or order.total_amount when f_1. This is the "Start from" figure (replaces the
 * per-program Initial Down Payment on the public cards).
 */
export function getQuotationTotal(order?: OrderWithQuotation | null): number {
    if (!order) return 0;
    if (order.f_1 && order.total_amount != null) {
        return Number(order.total_amount) || 0;
    }
    const packages: Package[] = order.latest_quotation?.packages ?? [];
    return packages.reduce((sum, pkg) => {
        if (pkg.is_addon === true && pkg.is_addon_included === false) return sum;
        return sum + getQuotationPackagePrice(pkg, order);
    }, 0);
}
```

- [ ] **Step 2: Switch the layout-detail package cards**

In `src/pages/CampaignPages/CampaignLayoutDetailPage.tsx`:
- Change the import to also bring in `getQuotationTotal` (line ~21: `import { getInitialDownPayment, getQuotationTotal } from '../../utils/quotationPricing';` — keep `getInitialDownPayment` only if still used elsewhere in the file; if not, replace it).
- At the per-package computation (~line 376): change `const startFrom = getInitialDownPayment(pkg.order as Order | undefined);` to `const startFrom = getQuotationTotal(pkg.order as Order | undefined);`.
- Remove the " initial down" suffix span (~line 446): delete `<span className="text-xs sm:text-sm font-medium text-slate-400"> initial down</span>`. Keep the "Start from" label (~line 443) and the `RM` amount.

- [ ] **Step 3: Switch the landing layout-card teaser**

In `src/pages/CampaignPages/CampaignDetailPage.tsx`:
- Import `getQuotationTotal` (line ~23: `import { getInitialDownPayment, getQuotationTotal } from '../../utils/quotationPricing';` — drop `getInitialDownPayment` if it becomes unused after Task 5/this change; verify before removing to avoid an unused-import error).
- In the per-layout teaser reduce (~line 372): change `const v = getInitialDownPayment(p.order as Order | undefined);` to `const v = getQuotationTotal(p.order as Order | undefined);`. Keep the "Start from RM…" label at ~line 394 unchanged.

- [ ] **Step 4: Build + lint**

Run: `npm run build` → exit 0.
Run: `npx eslint src/utils/quotationPricing.ts src/pages/CampaignPages/CampaignLayoutDetailPage.tsx src/pages/CampaignPages/CampaignDetailPage.tsx --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'` → `0` (all three at baseline 0). If non-zero, fix new issues (commonly an unused `getInitialDownPayment` import — remove it only if truly unreferenced).

- [ ] **Step 5: Commit**

```bash
git add src/utils/quotationPricing.ts src/pages/CampaignPages/CampaignLayoutDetailPage.tsx src/pages/CampaignPages/CampaignDetailPage.tsx
git commit -m "feat(campaign): Start-from shows full quotation total (drop initial-down)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 4 (FE-A): YouTube admin input + public embed

**Repo/branch:** `RenoXpert-Frontend-v2.1`, `feature/campaign-batch2`.

**Files:**
- Create: `src/utils/youtube.ts`
- Modify: `src/pages/Campaign/AddCampaign.tsx`, `src/pages/Campaign/EditCampaign.tsx` (formData + URL input)
- Modify: `src/pages/CampaignPages/CampaignDetailPage.tsx` (button + modal)

**Interfaces:**
- Consumes: `campaign.thumbnail_video_url` (Task 1).
- Produces: `getYouTubeEmbedUrl(url?: string | null): string | null`.

- [ ] **Step 1: Create the embed helper**

Create `src/utils/youtube.ts`:
```ts
/**
 * Return a YouTube embed URL for the common link forms (watch, youtu.be,
 * shorts, embed), or null if the input is empty / not a recognised YouTube URL.
 */
export function getYouTubeEmbedUrl(url?: string | null): string | null {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    const patterns = [
        /youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/,
        /youtu\.be\/([\w-]{11})/,
        /youtube\.com\/shorts\/([\w-]{11})/,
        /youtube\.com\/embed\/([\w-]{11})/,
    ];
    for (const re of patterns) {
        const m = trimmed.match(re);
        if (m && m[1]) return `https://www.youtube.com/embed/${m[1]}`;
    }
    return null;
}
```

- [ ] **Step 2: AddCampaign — state + input**

In `src/pages/Campaign/AddCampaign.tsx`:
- Add `thumbnail_video_url: ''` to the `formData` initial state object (next to `description`/`internal_description`).
- In the existing video section (near the video upload `id="thumbnail-video-upload"`, ~line 1367), add below the upload control:
```tsx
<div className="mt-3">
    <label className="block text-sm font-medium text-gray-700 mb-1">YouTube link (optional)</label>
    <input
        type="url"
        name="thumbnail_video_url"
        value={formData.thumbnail_video_url}
        onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_video_url: e.target.value }))}
        placeholder="https://www.youtube.com/watch?v=..."
        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
    />
    <p className="text-xs text-gray-400 mt-1">If set, the public page embeds this YouTube video (takes precedence over an uploaded file).</p>
</div>
```
(`createCampaign` already serializes non-null top-level `formData` keys into FormData, so the field is sent automatically.)

- [ ] **Step 3: EditCampaign — state + load + input**

In `src/pages/Campaign/EditCampaign.tsx`:
- Add `thumbnail_video_url: ''` to the `formData` initial state.
- Where the fetched campaign populates `formData` (the `setFormData({...})` after load, near `internal_description: campaign.internal_description || ''`), add `thumbnail_video_url: campaign.thumbnail_video_url || ''`.
- Add the **same** YouTube `<input>` block as Add Step 2 (use `setFormData(prev => ({ ...prev, thumbnail_video_url: e.target.value }))`).

- [ ] **Step 4: Public — button + modal embed**

In `src/pages/CampaignPages/CampaignDetailPage.tsx`:
- Import the helper: `import { getYouTubeEmbedUrl } from '../../utils/youtube';`.
- Compute once in the component body (after `campaign` is available): `const youtubeEmbed = getYouTubeEmbedUrl(campaign?.thumbnail_video_url);` and `const hasVideo = !!youtubeEmbed || !!campaign?.thumbnail_video;`.
- "Watch video" button (~line 321): change the render guard from `campaign.thumbnail_video &&` to `hasVideo &&`.
- Modal (~lines 707-723): change the open guard to `{videoOpen && hasVideo && (` and replace the `<video>` element with a conditional:
```tsx
{youtubeEmbed ? (
    <iframe
        src={youtubeEmbed}
        title="Campaign video"
        className="w-full aspect-video rounded-lg"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
    />
) : (
    <video
        src={(campaign.thumbnail_video as Attachment).file_url}
        controls
        autoPlay
        className="w-full rounded-lg"
    />
)}
```
Keep the existing modal container, close button, and body-scroll-lock behavior. (If the existing `<video>` has other props/classes, preserve them on the `<video>` branch.)

- [ ] **Step 5: Build + lint**

Run: `npm run build` → exit 0.
Run: `npx eslint src/utils/youtube.ts src/pages/Campaign/AddCampaign.tsx src/pages/Campaign/EditCampaign.tsx src/pages/CampaignPages/CampaignDetailPage.tsx --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'` → `youtube.ts` 0; Add ≤1; Edit ≤1; CampaignDetailPage 0 (combined count should be ≤ 2). Fix any NEW errors.

- [ ] **Step 6: Commit**

```bash
git add src/utils/youtube.ts src/pages/Campaign/AddCampaign.tsx src/pages/Campaign/EditCampaign.tsx src/pages/CampaignPages/CampaignDetailPage.tsx
git commit -m "feat(campaign): YouTube link for campaign video (admin input + public embed)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 5 (FE-C): Layout thumbnail (admin upload + public card)

**Repo/branch:** `RenoXpert-Frontend-v2.1`, `feature/campaign-batch2`. **HIGH RISK** — touches the per-layout index maps + drag-reorder bundle (the historical reindex bug class). Reindex and bundle the new map(s) exactly like `rental_projection`.

**Files:**
- Modify: `src/services/api.ts` (two new functions)
- Modify: `src/pages/Campaign/AddCampaign.tsx`, `src/pages/Campaign/EditCampaign.tsx` (state map(s), upload control, reindex, reorder bundle, submit upload)
- Modify: `src/pages/CampaignPages/CampaignDetailPage.tsx` (layout card image source)

**Interfaces:**
- Consumes: endpoints from Task 2; `lt.layout_thumbnail` on the public resource.
- Produces: `uploadCampaignLayoutTypeThumbnail(layoutTypeId, file)`, `deleteCampaignLayoutTypeThumbnail(layoutTypeId)`.

- [ ] **Step 1: API functions**

In `src/services/api.ts`, directly after `deleteCampaignLayoutTypeRentalProjection`, add:
```ts
export const uploadCampaignLayoutTypeThumbnail = async (layoutTypeId: number | string, file: File) => {
    const formData = new FormData();
    formData.append('layout_thumbnail', file);
    const response = await axios.post(`${API_URL}campaign-layout-types/${layoutTypeId}/layout-thumbnail`, formData, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const deleteCampaignLayoutTypeThumbnail = async (layoutTypeId: number | string) => {
    const response = await axios.delete(`${API_URL}campaign-layout-types/${layoutTypeId}/layout-thumbnail`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    });
    return response.data;
};
```

- [ ] **Step 2: AddCampaign — mirror `layoutProjectionFile` for the thumbnail**

In `src/pages/Campaign/AddCampaign.tsx`, do for `layout_thumbnail` everything that is done for `layoutProjectionFile`:
- Import `uploadCampaignLayoutTypeThumbnail` alongside `uploadCampaignLayoutTypeRentalProjection`.
- Add state: `const [layoutThumbnailFile, setLayoutThumbnailFile] = useState<Record<number, File>>({});`.
- Add a handler mirroring `handleLayoutProjectionChange`:
```tsx
const handleLayoutThumbnailChange = (layoutIdx: number, file: File | null) => {
    setLayoutError(null);
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setLayoutError('Image must be 10MB or smaller.'); return; }
    setLayoutThumbnailFile(prev => ({ ...prev, [layoutIdx]: file }));
};
```
- In `removeLayoutType`, add `setLayoutThumbnailFile(prev => shiftNumericIndexMap(prev, idx));` next to the existing `layoutProjectionFile` reindex.
- In `reorderLayouts` (the drag-reorder bundle), add `layoutThumbnailFile[i]` to the bundled descriptor (e.g. `thumb: layoutThumbnailFile[i]`) and rebuild `setLayoutThumbnailFile(Object.fromEntries(...))` from the moved descriptors — exactly like `proj`/`layoutProjectionFile` is bundled and rebuilt. **The new map MUST be in the bundle or reordering mis-associates thumbnails.**
- In the layout-type render block, add an upload control next to the Rental Projection one (label "Layout Thumbnail (single image)") wrapped in `FileDropzone`:
```tsx
<FileDropzone accept="image" onFiles={(f) => handleLayoutThumbnailChange(layoutIdx, f[0] ?? null)}>
    <label className="block text-sm font-medium text-gray-700 mb-2">Layout Thumbnail (single image)</label>
    <input type="file" accept="image/*" onChange={(e) => handleLayoutThumbnailChange(layoutIdx, e.target.files?.[0] ?? null)} />
    {layoutThumbnailFile[layoutIdx] && (
        <div className="mt-2 flex items-center gap-2 text-sm">
            <span>{layoutThumbnailFile[layoutIdx].name}</span>
            <button type="button" onClick={() => setLayoutThumbnailFile(prev => { const n = { ...prev }; delete n[layoutIdx]; return n; })}>Remove</button>
        </div>
    )}
</FileDropzone>
```
- In the submit flow, after each layout type is created (where `layoutProjectionFile[i]` is uploaded via `uploadCampaignLayoutTypeRentalProjection`), add:
```tsx
if (layoutThumbnailFile[i]) {
    await uploadCampaignLayoutTypeThumbnail(layoutId, layoutThumbnailFile[i]);
}
```

- [ ] **Step 3: EditCampaign — mirror `layoutProjectionUrl`/`pendingLayoutProjectionFile`**

In `src/pages/Campaign/EditCampaign.tsx`, do for `layout_thumbnail` everything done for the rental projection (existing-image url map + pending-file map + immediate async upload):
- Import `uploadCampaignLayoutTypeThumbnail`, `deleteCampaignLayoutTypeThumbnail`.
- Add state: `const [layoutThumbnailUrl, setLayoutThumbnailUrl] = useState<Record<number, string | null>>({});` and `const [pendingLayoutThumbnailFile, setPendingLayoutThumbnailFile] = useState<Record<number, File>>({});`.
- On campaign load, populate `layoutThumbnailUrl[i]` from `(lt.layout_thumbnail as Attachment | null)?.file_url ?? null` (mirror how `layoutProjectionUrl` is populated from `lt.rental_projection`).
- Add `handleEditLayoutThumbnail(layoutIdx, file)` mirroring `handleEditLayoutProjection`: 10MB check; if the layout has an id → `await uploadCampaignLayoutTypeThumbnail(layoutId, file)` (with `layoutUploading`), set `layoutThumbnailUrl` from `res?.data?.layout_thumbnail?.file_url ?? null`; else hold in `pendingLayoutThumbnailFile`. Add a remove handler that calls `deleteCampaignLayoutTypeThumbnail(layoutId)` and clears the url (mirror `handleEditRemoveProjection`).
- In `removeLayout`: add `shiftNumericIndexMap` reindex for **both** `layoutThumbnailUrl` and `pendingLayoutThumbnailFile` (next to the projection reindexes).
- In `reorderLayouts`: add **both** new maps to the bundled descriptor and rebuild them from the moved descriptors (next to `projUrl`/`pendProj`). **Required for correct reordering.**
- After a new layout is created in submit (where `pendingLayoutProjectionFile[i]` is uploaded), upload `pendingLayoutThumbnailFile[i]` the same way.
- Render an upload control (label "Layout Thumbnail (single image)") wrapped in `FileDropzone accept="image"` → `handleEditLayoutThumbnail(layoutIdx, f[0] ?? null)`, showing the existing image (`layoutThumbnailUrl[layoutIdx]`) with a Remove button, or the pending file name — mirroring the projection control.

- [ ] **Step 4: Public — layout card image source**

In `src/pages/CampaignPages/CampaignDetailPage.tsx`, the landing layout cards (~line 375): change `const proj = lt.rental_projection as Attachment | undefined;` to `const thumb = lt.layout_thumbnail as Attachment | undefined;` and use `thumb?.file_url` in the `<img>` guard (~line 384). When absent, render the **existing placeholder** (`Package` icon block) — do **not** fall back to `rental_projection`. Update the variable name consistently within that card block.

- [ ] **Step 5: Build + lint**

Run: `npm run build` → exit 0.
Run: `npx eslint src/services/api.ts src/pages/Campaign/AddCampaign.tsx src/pages/Campaign/EditCampaign.tsx src/pages/CampaignPages/CampaignDetailPage.tsx --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'` → expect `19` total (api.ts 17 + Add 1 + Edit 1 + CampaignDetailPage 0). Fix any count above that (new errors only).

- [ ] **Step 6: Commit**

```bash
git add src/services/api.ts src/pages/Campaign/AddCampaign.tsx src/pages/Campaign/EditCampaign.tsx src/pages/CampaignPages/CampaignDetailPage.tsx
git commit -m "feat(campaign): layout thumbnail upload (admin) + public layout card image

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 6 (FE-D): TipTap rich-text campaign description

**Repo/branch:** `RenoXpert-Frontend-v2.1`, `feature/campaign-batch2`.

**Files:**
- Modify: `package.json` / `package-lock.json` (new deps)
- Create: `src/pages/Campaign/components/RichTextEditor.tsx`
- Create: `src/pages/CampaignPages/components/RichTextContent.tsx`
- Modify: `src/index.css` (`.rich-content` styles)
- Modify: `src/pages/Campaign/AddCampaign.tsx`, `src/pages/Campaign/EditCampaign.tsx` (description editor)
- Modify: `src/pages/CampaignPages/CampaignDetailPage.tsx` (description render)

**Interfaces:**
- Produces: `RichTextEditor` (default export, props `{ value: string; onChange: (html: string) => void; placeholder?: string }`); `RichTextContent` (default export, props `{ html?: string | null; className?: string }`).

- [ ] **Step 1: Install deps**

Run: `npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link dompurify`
Then: `npm install -D @types/dompurify` (skip if `npm` reports types are bundled). Verify `package.json` lists them.

- [ ] **Step 2: `.rich-content` styles**

Append to `src/index.css`:
```css
.rich-content h1 { font-size: 1.5rem; font-weight: 700; margin: 0.75rem 0 0.5rem; }
.rich-content h2 { font-size: 1.25rem; font-weight: 700; margin: 0.75rem 0 0.5rem; }
.rich-content h3 { font-size: 1.1rem; font-weight: 600; margin: 0.5rem 0; }
.rich-content p { margin: 0.5rem 0; }
.rich-content ul { list-style: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
.rich-content ol { list-style: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
.rich-content li { margin: 0.25rem 0; }
.rich-content blockquote { border-left: 3px solid #e2e8f0; padding-left: 1rem; color: #475569; margin: 0.5rem 0; }
.rich-content a { color: #D71E42; text-decoration: underline; }
.rich-content code { background: #f1f5f9; padding: 0.1rem 0.3rem; border-radius: 0.25rem; font-size: 0.875em; }
.rich-content strong { font-weight: 700; }
.rich-content em { font-style: italic; }
```

- [ ] **Step 3: `RichTextEditor` component**

Create `src/pages/Campaign/components/RichTextEditor.tsx`:
```tsx
import { useEffect } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

const Btn = ({ active, onClick, label }: { active?: boolean; onClick: () => void; label: string }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-2 py-1 text-sm rounded ${active ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`}
    >
        {label}
    </button>
);

const Toolbar = ({ editor }: { editor: Editor }) => {
    const setLink = () => {
        const prev = editor.getAttributes('link').href as string | undefined;
        const url = window.prompt('Link URL', prev ?? '');
        if (url === null) return;
        if (url === '') { editor.chain().focus().unsetLink().run(); return; }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };
    return (
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 px-2 py-1">
            <Btn label="B" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
            <Btn label="I" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
            <Btn label="S" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} />
            <Btn label="H1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
            <Btn label="H2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
            <Btn label="H3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
            <Btn label="• List" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
            <Btn label="1. List" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
            <Btn label="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
            <Btn label="Code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} />
            <Btn label="Link" active={editor.isActive('link')} onClick={setLink} />
            <Btn label="Undo" onClick={() => editor.chain().focus().undo().run()} />
            <Btn label="Redo" onClick={() => editor.chain().focus().redo().run()} />
        </div>
    );
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
    const editor = useEditor({
        extensions: [StarterKit, Link.configure({ openOnClick: false, autolink: true })],
        content: value || '',
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
        editorProps: {
            attributes: { class: 'rich-content min-h-[160px] px-3 py-2 focus:outline-none', ...(placeholder ? { 'data-placeholder': placeholder } : {}) },
        },
    });

    // Sync external resets (e.g. Edit form load) without clobbering the cursor mid-typing.
    useEffect(() => {
        if (!editor) return;
        if ((value || '') !== editor.getHTML()) {
            editor.commands.setContent(value || '', false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, editor]);

    if (!editor) return null;

    return (
        <div className="rounded-xl border border-slate-300 bg-white">
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
};

export default RichTextEditor;
```

- [ ] **Step 4: `RichTextContent` public renderer**

Create `src/pages/CampaignPages/components/RichTextContent.tsx`:
```tsx
import DOMPurify from 'dompurify';

interface RichTextContentProps {
    html?: string | null;
    className?: string;
}

// Legacy campaign descriptions are plain text; new ones are HTML from the editor.
const looksLikeHtml = (s: string) => /<[a-z][\s\S]*>/i.test(s);

const RichTextContent: React.FC<RichTextContentProps> = ({ html, className = '' }) => {
    if (!html) return null;
    if (!looksLikeHtml(html)) {
        return <div className={`whitespace-pre-line ${className}`.trim()}>{html}</div>;
    }
    const clean = DOMPurify.sanitize(html);
    return <div className={`rich-content ${className}`.trim()} dangerouslySetInnerHTML={{ __html: clean }} />;
};

export default RichTextContent;
```

- [ ] **Step 5: Admin — swap the description textarea**

In `src/pages/Campaign/AddCampaign.tsx`: `import RichTextEditor from './components/RichTextEditor';`. Replace the campaign description `<textarea name="description" value={formData.description} ...>` (~line 1272) with:
```tsx
<RichTextEditor value={formData.description} onChange={(html) => setFormData(prev => ({ ...prev, description: html }))} />
```
Do the identical swap in `src/pages/Campaign/EditCampaign.tsx` (its campaign description textarea). **Leave `internal_description` and package/layout description textareas unchanged.**

- [ ] **Step 6: Public — render formatted description**

In `src/pages/CampaignPages/CampaignDetailPage.tsx`: `import RichTextContent from './components/RichTextContent';`. Replace **both** campaign-description render blocks:
- ~line 268-271 (the `{campaign.description && (...split('\n')...)}` block): `{campaign.description && <RichTextContent html={campaign.description} className="text-slate-500 leading-relaxed" />}`.
- ~line 547-548 (the `<p className="text-slate-500 leading-relaxed">{campaign.description}</p>` block): `{campaign.description && <RichTextContent html={campaign.description} className="text-slate-500 leading-relaxed" />}`.
Leave layout/package description spots unchanged.

- [ ] **Step 7: Build + lint**

Run: `npm run build` → exit 0.
Run: `npx eslint src/pages/Campaign/components/RichTextEditor.tsx src/pages/CampaignPages/components/RichTextContent.tsx --ext ts,tsx --format unix` → no output (0). Then `npx eslint src/pages/Campaign/AddCampaign.tsx src/pages/Campaign/EditCampaign.tsx src/pages/CampaignPages/CampaignDetailPage.tsx --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'` → ≤ 2 (Add 1 + Edit 1, CampaignDetailPage 0). Fix new errors.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/index.css src/pages/Campaign/components/RichTextEditor.tsx src/pages/CampaignPages/components/RichTextContent.tsx src/pages/Campaign/AddCampaign.tsx src/pages/Campaign/EditCampaign.tsx src/pages/CampaignPages/CampaignDetailPage.tsx
git commit -m "feat(campaign): TipTap rich-text campaign description + sanitized public render

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 7 (FE-E): Bento renderings layout

**Repo/branch:** `RenoXpert-Frontend-v2.1`, `feature/campaign-batch2`.

**Files:**
- Modify: `src/pages/CampaignPages/CampaignLayoutDetailPage.tsx` (Renderings section ~lines 330-352)

**Interfaces:** none exported. Self-contained presentational change. (Classic boxy bento with `object-cover` per the E decision — may crop in-image labels on off-ratio renderings; accepted.)

- [ ] **Step 1: Add the span helper**

In `src/pages/CampaignPages/CampaignLayoutDetailPage.tsx`, inside the component (near the other derived values, before the return), add:
```tsx
// Bento tile sizing: repeating 6-cycle — large feature, wide, then small tiles.
const bentoSpan = (i: number): string => {
    const m = i % 6;
    if (m === 0) return 'col-span-2 row-span-2';
    if (m === 3) return 'col-span-2 row-span-1';
    return 'col-span-1 row-span-1';
};
```

- [ ] **Step 2: Convert the renderings grid to bento**

Replace the renderings grid container (currently `<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">` at ~line 330) with:
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-[140px] sm:auto-rows-[170px] gap-3 grid-flow-dense">
```
On the per-image `<button>` (~line 332-337), replace its `className` — remove `block aspect-[4/3]` and add the bento span — so it reads:
```tsx
className={`${bentoSpan(index)} overflow-hidden rounded-xl ring-1 ring-slate-200 bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-campaign/40`}
```
Leave the inner `<img>` (with `w-full h-full object-cover hover:scale-[1.05] ...`), the `onClick={() => setPhoto(img.file_url ?? null)}`, the `key`, the aria-label, and the no-`file_url` placeholder block unchanged (the placeholder div already uses `w-full h-full`, which now fills the bento tile).

- [ ] **Step 3: Build + lint**

Run: `npm run build` → exit 0.
Run: `npx eslint src/pages/CampaignPages/CampaignLayoutDetailPage.tsx --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'` → `0` (baseline). Fix any new error.

- [ ] **Step 4: Commit**

```bash
git add src/pages/CampaignPages/CampaignLayoutDetailPage.tsx
git commit -m "feat(campaign): bento grid for layout-detail renderings

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 8: Verify + finalize

**Files:** none (verification + integration).

- [ ] **Step 1: FE full build + scoped lint sweep**

```bash
cd RenoXpert-Frontend-v2.1
npm run build   # exit 0
for f in src/utils/quotationPricing.ts src/utils/youtube.ts src/pages/Campaign/components/RichTextEditor.tsx src/pages/CampaignPages/components/RichTextContent.tsx src/pages/Campaign/AddCampaign.tsx src/pages/Campaign/EditCampaign.tsx src/pages/CampaignPages/CampaignDetailPage.tsx src/pages/CampaignPages/CampaignLayoutDetailPage.tsx src/services/api.ts; do
  echo "$f: $(npx eslint "$f" --ext ts,tsx --format unix 2>/dev/null | grep -c ':[0-9]*:[0-9]*:')"
done
```
Expected: new files 0; AddCampaign 1; EditCampaign 1; CampaignDetailPage 0; CampaignLayoutDetailPage 0; quotationPricing 0; api.ts 17.

- [ ] **Step 2: Backend manual review**

Re-read the BE diff: both migrations additive+nullable; model fillable/casts; resources (admin + public + shared layout resource) expose the new fields; layout-thumbnail endpoints mirror rental-projection; routes registered. Confirm no `php artisan migrate` was run.

- [ ] **Step 3: Finalize backend (PR to production)**

```bash
cd RenoXpert-Backend
git push -u origin feature/campaign-batch2
gh pr create --base production --head feature/campaign-batch2 --title "feat(campaign): batch 2 backend (thumbnail_video_url + layout_thumbnail)" --body "<summary + 'run php artisan migrate after merge' note + 🤖 Generated with [Claude Code](https://claude.com/claude-code)>"
```

- [ ] **Step 4: Finalize frontend (merge+push to production)**

```bash
cd RenoXpert-Frontend-v2.1
git checkout production && git pull --ff-only
git merge --ff-only feature/campaign-batch2
npm run build   # exit 0 gate
git branch -d feature/campaign-batch2
git push origin production
```

- [ ] **Step 5: Hand off manual QA**

Report the QA checklist to the user (after they merge the BE PR + run `php artisan migrate`): YouTube embed vs uploaded video vs none; Start-from shows full totals (no "initial down"); layout cards use the new thumbnail with placeholder fallback; rich-text description formats on public + legacy plain text still renders + HTML sanitized.

---

## Self-Review

**Spec coverage:**
- A (BE field + resources + validation) → Task 1; A (admin input + public embed) → Task 4. ✅
- B (`getQuotationTotal` + both card sites, drop "initial down") → Task 3. ✅
- C (BE migration/model/resource/endpoints/routes) → Task 2; C (admin upload + maps + reorder bundle + reindex; public card) → Task 5. ✅
- D (deps + RichTextEditor + RichTextContent + styles + admin swap + public render + back-compat + sanitize) → Task 6. ✅
- E (bento renderings grid + dense flow, lightbox/placeholder preserved) → Task 7. ✅
- Constraints (migrations authored/user-runs; BE PR + FE merge+push; deps only for D; eslint baselines) → Global Constraints + Task 7. ✅

**Placeholder scan:** No TBD/TODO. BE PR body has a `<...>` description placeholder — that is an instruction to compose the summary at finalize time, not code. FE big-file edits give exact snippets + anchors; the implementer reads the file for surrounding markup.

**Type consistency:** `getQuotationTotal(order?: OrderWithQuotation | null): number`; `getYouTubeEmbedUrl(url?: string | null): string | null`; `RichTextEditor {value:string; onChange:(html:string)=>void; placeholder?}`; `RichTextContent {html?: string|null; className?}`; `uploadCampaignLayoutTypeThumbnail(layoutTypeId, file)` / `deleteCampaignLayoutTypeThumbnail(layoutTypeId)` match the api.ts pattern and the routes from Task 2. Field names `thumbnail_video_url` and `layout_thumbnail` are identical across BE (migration/model/resource/validation/controller) and FE (state, API, render). ✅
