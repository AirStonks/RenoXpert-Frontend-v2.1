# Inline Thumbnail Video (Sub-project C / H1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional campaign hero video — admin uploads it to S3 (dedicated endpoint), it's exposed on the public campaign API, and a play button on the landing hero opens a modal/lightbox player.

**Architecture:** New nullable `thumbnail_video` JSON column on `campaigns` (Laravel migration, **run manually by the user**). `CampaignController` gains `uploadThumbnailVideo`/`deleteThumbnailVideo` mirroring the existing thumbnail S3 pattern, wired to two `auth:sanctum` routes and serialized in both campaign resources. Admin manages the video via a control in `EditCampaign` (immediate upload) and `AddCampaign` (two-step: create → upload to the new id). The public landing (`CampaignDetailPage`) shows a crimson play button when a video exists and plays it in a modal.

**Tech Stack:** Backend: Laravel 11 / PHP 8.2 / S3 (flysystem). Frontend: React 18 + TS, Vite, Tailwind (crimson `campaign` token), lucide-react, axios.

**Design spec:** `docs/superpowers/specs/2026-06-22-inline-thumbnail-video-design.md`

## Global Constraints

- **Schema via a Laravel migration that we AUTHOR but do NOT run.** The user runs `php artisan migrate` manually. The migration is an additive `Schema::table('campaigns', ...)` ALTER (the base `campaigns` table exists but is not itself in migrations, so never use `migrate:fresh`). See [[renoxpert-backend-schema-unmanaged]].
- **Mirror the existing thumbnail S3 pattern exactly:** `Storage::disk('s3')->putFileAs('campaigns', $file, $name, 'public')`; store `['file_url' => config('filesystems.disks.s3.url').'/'.$path, 'path' => $path]`; delete the old `path` on replace/remove. Filename prefix `thumbnail_video_`.
- **Video validation:** `required|file|mimetypes:video/mp4,video/webm,video/quicktime|max:51200` (50 MB). Client-side: reject > 50 MB before upload.
- **Do not change** the existing thumbnail (image) behavior, the booking flow, or any unrelated field. Campaign-level, single video only (no per-package video).
- **Playback:** modal/lightbox (`fixed inset-0`), closeable via X button, backdrop click, and Esc. Play button only renders when `campaign.thumbnail_video` exists.
- **Response shape:** the controller uses `$this->sendResponse($data, $msg)` → JSON `{ success, data, message }`. `createCampaign`/`updateCampaign`/the new api funcs return `response.data` (that object). The new campaign id after create is `created.data.id`. The upload endpoint returns `data: { thumbnail_video: {...} }`.
- **Frontend verification gate:** `npm run build` (`tsc -b && vite build`) exit 0 AND `npx eslint <changed files> --ext ts,tsx --max-warnings 0` exit 0. Project-wide `npm run lint` is pre-existingly broken (not a gate). No `any` (scoped lint is `--max-warnings 0`). No test runner — do not scaffold one.
- **Backend verification gate:** `php -l <changed file>` clean on every changed PHP file. (If `php` is not installed in this environment, say so and do a careful manual syntax review instead.) `php artisan route:list | grep thumbnail-video` is best-effort (needs app boot). **Never run `php artisan migrate`.**
- **Repo paths:** backend = `/home/ubuntu/projects/old/RenoXpert-Backend`; frontend = `/home/ubuntu/projects/old/RenoXpert-Frontend-v2.1`.

---

### Task 0: Branch and commit the spec

**Files:** adds the already-written C spec to git.

- [ ] **Step 1: Branch off production**
```bash
cd /home/ubuntu/projects/old/RenoXpert-Frontend-v2.1
git checkout production
git pull --ff-only
git checkout -b feature/inline-thumbnail-video
```

- [ ] **Step 2: Commit the spec + this plan**
```bash
git add docs/superpowers/specs/2026-06-22-inline-thumbnail-video-design.md \
        docs/superpowers/plans/2026-06-22-inline-thumbnail-video.md
git commit -m "docs(campaign): inline thumbnail video spec + plan"
```
(Append the standard Co-Authored-By / Claude-Session trailer lines to the commit message.)

---

### Task 1: Backend — migration + Campaign model

**Files:**
- Create: `RenoXpert-Backend/database/migrations/2026_06_22_000000_add_thumbnail_video_to_campaigns_table.php`
- Modify: `RenoXpert-Backend/app/Models/Campaign.php` (`$fillable` ~line 18, `$casts` ~line 36)

**Interfaces:**
- Produces: the `campaigns.thumbnail_video` column (applied by the user, not us) and the model's ability to read/write it as an array. Consumed by Task 2.

- [ ] **Step 1: Create the migration (authored, NOT run)**
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

- [ ] **Step 2: Add `thumbnail_video` to `$fillable`**

Find the line `'thumbnail',` inside the `$fillable` array and add `'thumbnail_video',` right after it:
```php
        'thumbnail',
        'thumbnail_video',
```

- [ ] **Step 3: Add `thumbnail_video` to `$casts`**

Find `'thumbnail' => 'array',` inside `$casts` and add below it:
```php
        'thumbnail' => 'array',
        'thumbnail_video' => 'array',
```

- [ ] **Step 4: Verify (do NOT run migrate)**
```bash
cd /home/ubuntu/projects/old/RenoXpert-Backend
php -l database/migrations/2026_06_22_000000_add_thumbnail_video_to_campaigns_table.php
php -l app/Models/Campaign.php
```
Expected: "No syntax errors detected" for both. (If `php` is unavailable, report it and do a manual syntax review. Do NOT run `php artisan migrate`.)

- [ ] **Step 5: Commit**
```bash
git add database/migrations/2026_06_22_000000_add_thumbnail_video_to_campaigns_table.php app/Models/Campaign.php
git commit -m "feat(campaign): thumbnail_video column migration + model casts (H1)"
```
(Append the standard trailer lines. Note in the commit body: migration must be run manually by the user.)

---

### Task 2: Backend — upload/delete endpoints, routes, resources

**Files:**
- Modify: `RenoXpert-Backend/app/Http/Controllers/CampaignController.php` (add two methods after `destroy()`, before the class's final `}` at ~line 409)
- Modify: `RenoXpert-Backend/routes/api.php` (after line 319)
- Modify: `RenoXpert-Backend/app/Http/Resources/CampaignResource.php` (after `'thumbnail' => $this->thumbnail,` ~line 24)
- Modify: `RenoXpert-Backend/app/Http/Resources/Campaign/CampaignResource.php` (after `'thumbnail' => $this->thumbnail,` ~line 22)

**Interfaces:**
- Consumes: the `thumbnail_video` column/cast (Task 1).
- Produces: `POST /campaigns/{id}/thumbnail-video/upload` (returns `{success, data: {thumbnail_video: {file_url, path}}, message}`) and `DELETE /campaigns/{id}/thumbnail-video`; `thumbnail_video` in both resources. Consumed by Tasks 3–6.

- [ ] **Step 1: Add the two controller methods**

Insert after the `destroy()` method's closing brace and before the class's final `}`:
```php
    public function uploadThumbnailVideo(Request $request, $id)
    {
        try {
            $campaign = Campaign::find($id);
            if (is_null($campaign)) {
                return $this->sendError('Campaign not found.');
            }

            $validator = Validator::make($request->all(), [
                'thumbnail_video' => 'required|file|mimetypes:video/mp4,video/webm,video/quicktime|max:51200',
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation Error.', $validator->errors(), 422);
            }

            // Delete the previous video from S3 if present
            if ($campaign->thumbnail_video && isset($campaign->thumbnail_video['path'])) {
                Storage::disk('s3')->delete($campaign->thumbnail_video['path']);
            }

            $videoFile = $request->file('thumbnail_video');
            $directory = 'campaigns';
            $filename = 'thumbnail_video_' . time() . '_' . uniqid() . '.' . $videoFile->getClientOriginalExtension();

            $path = Storage::disk('s3')->putFileAs($directory, $videoFile, $filename, 'public');

            $campaign->thumbnail_video = [
                'file_url' => config('filesystems.disks.s3.url') . '/' . $path,
                'path' => $path,
            ];
            $campaign->save();

            return $this->sendResponse(['thumbnail_video' => $campaign->thumbnail_video], 'Thumbnail video uploaded successfully.');
        } catch (\Exception $e) {
            Log::error('Campaign thumbnail video upload failed', [
                'campaign_id' => $id,
                'error_message' => $e->getMessage(),
                'error_line' => $e->getLine(),
                'error_file' => $e->getFile(),
            ]);

            return $this->sendError('Failed to upload thumbnail video. Please try again.', [], 500);
        }
    }

    public function deleteThumbnailVideo($id)
    {
        try {
            $campaign = Campaign::find($id);
            if (is_null($campaign)) {
                return $this->sendError('Campaign not found.');
            }

            if ($campaign->thumbnail_video && isset($campaign->thumbnail_video['path'])) {
                Storage::disk('s3')->delete($campaign->thumbnail_video['path']);
            }

            $campaign->thumbnail_video = null;
            $campaign->save();

            return $this->sendResponse([], 'Thumbnail video removed successfully.');
        } catch (\Exception $e) {
            Log::error('Campaign thumbnail video deletion failed', [
                'campaign_id' => $id,
                'error_message' => $e->getMessage(),
                'error_line' => $e->getLine(),
                'error_file' => $e->getFile(),
            ]);

            return $this->sendError('Failed to remove thumbnail video. Please try again.', [], 500);
        }
    }
```
(`Request`, `Validator`, `Storage`, `Log`, `config`, `Campaign`, `CampaignResource` are already imported/used in this controller — confirm and do not duplicate imports.)

- [ ] **Step 2: Add the routes**

Find (line 319):
```php
    Route::post('campaigns/{campaignId}/update', [CampaignController::class, 'update']);
```
Add immediately after it (still inside the `auth:sanctum` group):
```php
    Route::post('campaigns/{id}/thumbnail-video/upload', [CampaignController::class, 'uploadThumbnailVideo']);
    Route::delete('campaigns/{id}/thumbnail-video', [CampaignController::class, 'deleteThumbnailVideo']);
```

- [ ] **Step 3: Serialize in the admin resource**

In `app/Http/Resources/CampaignResource.php`, find `'thumbnail' => $this->thumbnail,` and add below it:
```php
            'thumbnail' => $this->thumbnail,
            'thumbnail_video' => $this->thumbnail_video,
```

- [ ] **Step 4: Serialize in the public resource**

In `app/Http/Resources/Campaign/CampaignResource.php`, find `'thumbnail' => $this->thumbnail,` and add below it:
```php
            'thumbnail' => $this->thumbnail,
            'thumbnail_video' => $this->thumbnail_video,
```

- [ ] **Step 5: Verify**
```bash
cd /home/ubuntu/projects/old/RenoXpert-Backend
php -l app/Http/Controllers/CampaignController.php
php -l routes/api.php
php -l app/Http/Resources/CampaignResource.php
php -l app/Http/Resources/Campaign/CampaignResource.php
php artisan route:list 2>/dev/null | grep thumbnail-video || echo "(route:list unavailable — verify routes by inspection)"
```
Expected: "No syntax errors detected" for all four `php -l`; the two routes listed if `route:list` runs. (If `php` is unavailable, manual syntax review.)

- [ ] **Step 6: Commit**
```bash
git add app/Http/Controllers/CampaignController.php routes/api.php app/Http/Resources/CampaignResource.php app/Http/Resources/Campaign/CampaignResource.php
git commit -m "feat(campaign): thumbnail video upload/delete endpoints + resource fields (H1)"
```
(Append the standard trailer lines.)

---

### Task 3: Frontend — types + api service functions

**Files:**
- Modify: `src/types/index.ts` (`Campaign` interface, after `thumbnail?` ~line 1631)
- Modify: `src/services/api.ts` (after the `updateCampaign` function ~line 3068)

**Interfaces:**
- Produces: `Campaign.thumbnail_video?: Attachment | File`; `uploadCampaignThumbnailVideo(campaignId, file): Promise<{success, data: {thumbnail_video: {file_url, path}}, message}>` and `deleteCampaignThumbnailVideo(campaignId): Promise<any>`. Consumed by Tasks 4–6.

- [ ] **Step 1: Add `thumbnail_video` to the `Campaign` type**

Find `    thumbnail?: Attachment | File;` and add below it:
```ts
    thumbnail?: Attachment | File;
    thumbnail_video?: Attachment | File;
```

- [ ] **Step 2: Add the two api functions**

Add immediately after the `updateCampaign` function in `src/services/api.ts` (mirrors `uploadProductPhotos`'s inline-Bearer header pattern):
```ts
export const uploadCampaignThumbnailVideo = async (campaignId: number | string, file: File) => {
    const formData = new FormData();
    formData.append('thumbnail_video', file);
    const response = await axios.post(`${API_URL}campaigns/${campaignId}/thumbnail-video/upload`, formData, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const deleteCampaignThumbnailVideo = async (campaignId: number | string) => {
    const response = await axios.delete(`${API_URL}campaigns/${campaignId}/thumbnail-video`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
    });
    return response.data;
};
```

- [ ] **Step 3: Verify**
```bash
cd /home/ubuntu/projects/old/RenoXpert-Frontend-v2.1
npm run build
npx eslint src/types/index.ts src/services/api.ts --ext ts,tsx --max-warnings 0
```
Expected: both exit 0.

- [ ] **Step 4: Commit**
```bash
git add src/types/index.ts src/services/api.ts
git commit -m "feat(campaign): thumbnail_video type + upload/delete api helpers (H1)"
```
(Append the standard trailer lines.)

---

### Task 4: Frontend admin — EditCampaign video control (immediate upload)

**Files:**
- Modify: `src/pages/Campaign/EditCampaign.tsx`

**Interfaces:**
- Consumes: `uploadCampaignThumbnailVideo`, `deleteCampaignThumbnailVideo` (Task 3), `Attachment` type, `campaignId` (from `useParams`).

- [ ] **Step 1: Imports**

Add `Attachment` to the existing `import { ... } from '../../types';` and add `uploadCampaignThumbnailVideo, deleteCampaignThumbnailVideo` to the existing import from `'../../services/api'`.

- [ ] **Step 2: Add state**

Find `const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);` and add below it:
```tsx
    const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null);
    const [videoUploading, setVideoUploading] = useState<boolean>(false);
    const [videoError, setVideoError] = useState<string | null>(null);
```

- [ ] **Step 3: Seed the existing video on load**

In the `if (campaign) { setFormData({ ... }); ... }` load block, find the end of the `setFormData({...})` call:
```tsx
                thumbnail: null
            });
```
Add immediately after it:
```tsx
                thumbnail: null
            });

            setExistingVideoUrl((campaign.thumbnail_video as Attachment)?.file_url ?? null);
```

- [ ] **Step 4: Add upload + remove handlers**

Add after the existing `handleFileChange` function:
```tsx
    const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setVideoError(null);
        if (file.size > 50 * 1024 * 1024) {
            setVideoError('Video must be 50MB or smaller.');
            return;
        }
        setVideoUploading(true);
        try {
            const res = await uploadCampaignThumbnailVideo(campaignId!, file);
            setExistingVideoUrl(res?.data?.thumbnail_video?.file_url ?? null);
        } catch (err) {
            console.error('Thumbnail video upload failed:', err);
            setVideoError('Upload failed. Please try again.');
        } finally {
            setVideoUploading(false);
        }
    };

    const handleVideoRemove = async () => {
        setVideoError(null);
        setVideoUploading(true);
        try {
            await deleteCampaignThumbnailVideo(campaignId!);
            setExistingVideoUrl(null);
        } catch (err) {
            console.error('Thumbnail video removal failed:', err);
            setVideoError('Removal failed. Please try again.');
        } finally {
            setVideoUploading(false);
        }
    };
```

- [ ] **Step 5: Add the UI control**

Find the `{/* Date Range */}` block and insert this immediately before it:
```tsx
                                {/* Campaign Thumbnail Video */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Campaign Thumbnail Video (Optional)
                                    </label>
                                    {existingVideoUrl ? (
                                        <div className="mt-1">
                                            <video src={existingVideoUrl} controls className="w-full h-48 object-cover rounded-lg border border-gray-200 bg-black" />
                                            <button
                                                type="button"
                                                onClick={handleVideoRemove}
                                                disabled={videoUploading}
                                                className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                                            >
                                                {videoUploading ? 'Removing…' : 'Remove video'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-gray-400 transition-colors duration-200">
                                            <div className="space-y-1 text-center">
                                                <div className="flex text-sm text-gray-600 justify-center">
                                                    <label htmlFor="thumbnail-video-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                                                        <span>{videoUploading ? 'Uploading…' : 'Upload a video'}</span>
                                                        <input
                                                            id="thumbnail-video-upload"
                                                            name="thumbnail_video"
                                                            type="file"
                                                            accept="video/mp4,video/webm,video/quicktime"
                                                            onChange={handleVideoChange}
                                                            disabled={videoUploading}
                                                            className="sr-only"
                                                        />
                                                    </label>
                                                </div>
                                                <p className="text-xs text-gray-500">MP4, WebM, MOV up to 50MB</p>
                                            </div>
                                        </div>
                                    )}
                                    {videoError && <p className="mt-2 text-sm text-red-600">{videoError}</p>}
                                </div>

```

- [ ] **Step 6: Verify**
```bash
cd /home/ubuntu/projects/old/RenoXpert-Frontend-v2.1
npm run build
npx eslint src/pages/Campaign/EditCampaign.tsx --ext ts,tsx --max-warnings 0
```
Expected: both exit 0. Then manual: open an existing campaign in Edit → upload a small MP4 (spinner → player appears) → Remove works → no console errors.

- [ ] **Step 7: Commit**
```bash
git add src/pages/Campaign/EditCampaign.tsx
git commit -m "feat(campaign): manage thumbnail video in EditCampaign (H1)"
```
(Append the standard trailer lines.)

---

### Task 5: Frontend admin — AddCampaign video control (two-step on create)

**Files:**
- Modify: `src/pages/Campaign/AddCampaign.tsx`

**Interfaces:**
- Consumes: `uploadCampaignThumbnailVideo` (Task 3); the create response shape `created.data.id`.

- [ ] **Step 1: Import**

Add `uploadCampaignThumbnailVideo` to the existing import from `'../../services/api'` (where `createCampaign` is imported).

- [ ] **Step 2: Add state**

Find `const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);` and add below it:
```tsx
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoError, setVideoError] = useState<string | null>(null);
```

- [ ] **Step 3: Add the change handler**

Add after the existing `handleFileChange` function:
```tsx
    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setVideoError(null);
        if (file.size > 50 * 1024 * 1024) {
            setVideoError('Video must be 50MB or smaller.');
            return;
        }
        setVideoFile(file);
    };
```

- [ ] **Step 4: Two-step upload in submit**

Find:
```tsx
            await createCampaign(campaignData);

            // Navigate back to campaigns list
            navigate(`${LOCAL_PATH_PREFIX}campaigns`);
```
Replace with:
```tsx
            const created = await createCampaign(campaignData);
            const newCampaignId = created?.data?.id;
            if (videoFile && newCampaignId) {
                try {
                    await uploadCampaignThumbnailVideo(newCampaignId, videoFile);
                } catch (videoErr) {
                    console.error('Thumbnail video upload failed:', videoErr);
                    setError('Campaign created, but the video upload failed — add it later from Edit.');
                }
            }

            // Navigate back to campaigns list
            navigate(`${LOCAL_PATH_PREFIX}campaigns`);
```

- [ ] **Step 5: Add the UI control**

Find the `{/* Date Range */}` block and insert this immediately before it:
```tsx
                                {/* Campaign Thumbnail Video */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Campaign Thumbnail Video (Optional)
                                    </label>
                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-gray-400 transition-colors duration-200">
                                        <div className="space-y-1 text-center">
                                            <div className="flex text-sm text-gray-600 justify-center">
                                                <label htmlFor="thumbnail-video-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                                                    <span>Upload a video</span>
                                                    <input
                                                        id="thumbnail-video-upload"
                                                        name="thumbnail_video"
                                                        type="file"
                                                        accept="video/mp4,video/webm,video/quicktime"
                                                        onChange={handleVideoChange}
                                                        className="sr-only"
                                                    />
                                                </label>
                                            </div>
                                            <p className="text-xs text-gray-500">MP4, WebM, MOV up to 50MB · uploaded after the campaign is created</p>
                                        </div>
                                    </div>
                                    {videoFile && (
                                        <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                                            <span>{videoFile.name}</span>
                                            <button type="button" onClick={() => setVideoFile(null)} className="text-red-600 hover:text-red-800 font-medium">Remove</button>
                                        </div>
                                    )}
                                    {videoError && <p className="mt-2 text-sm text-red-600">{videoError}</p>}
                                </div>

```

- [ ] **Step 6: Verify**
```bash
cd /home/ubuntu/projects/old/RenoXpert-Frontend-v2.1
npm run build
npx eslint src/pages/Campaign/AddCampaign.tsx --ext ts,tsx --max-warnings 0
```
Expected: both exit 0. Then manual: create a campaign with a selected video → after create, the video is uploaded to the new campaign (verify it appears in Edit / public response); creating without a video still works.

- [ ] **Step 7: Commit**
```bash
git add src/pages/Campaign/AddCampaign.tsx
git commit -m "feat(campaign): attach thumbnail video on campaign create (two-step) (H1)"
```
(Append the standard trailer lines.)

---

### Task 6: Frontend public — landing play button + modal player

**Files:**
- Modify: `src/pages/CampaignPages/CampaignDetailPage.tsx` (imports ~line 3–18; state ~line 44; hero image block ~line 294–304; modal before `<ToastContainer />` ~line 635)

**Interfaces:**
- Consumes: `Campaign.thumbnail_video` (Task 3); `Attachment` (already imported in this file).

- [ ] **Step 1: Add `Play` and `X` to the lucide import**

Find:
```tsx
    ArrowDown,
    HelpCircle
} from 'lucide-react';
```
Replace with:
```tsx
    ArrowDown,
    HelpCircle,
    Play,
    X
} from 'lucide-react';
```

- [ ] **Step 2: Add modal state**

Find `const [isFullyBooked, setIsFullyBooked] = useState<boolean>(false);` and add below it:
```tsx
    const [videoOpen, setVideoOpen] = useState<boolean>(false);
```

- [ ] **Step 3: Add an Esc-to-close effect**

Add immediately after the `videoOpen` state line:
```tsx

    useEffect(() => {
        if (!videoOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setVideoOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [videoOpen]);
```

- [ ] **Step 4: Add the play button to the hero**

Find the hero image block:
```tsx
                        {/* Image */}
                        <div className="order-1 lg:order-2">
                            <div className="rounded-3xl overflow-hidden ring-1 ring-slate-200">
                                {campaign.thumbnail ? (
                                    <img
                                        src={(campaign.thumbnail as Attachment).file_url}
                                        alt={campaign.title}
                                        className="w-full h-56 sm:h-80 lg:h-[420px] object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-56 sm:h-80 lg:h-[420px] bg-slate-100 grid place-items-center text-slate-400">
                                        <Package className="h-16 w-16" />
                                    </div>
                                )}
                            </div>
                        </div>
```
Replace with (adds `relative` to the inner wrapper and a play button when a video exists):
```tsx
                        {/* Image */}
                        <div className="order-1 lg:order-2">
                            <div className="relative rounded-3xl overflow-hidden ring-1 ring-slate-200">
                                {campaign.thumbnail ? (
                                    <img
                                        src={(campaign.thumbnail as Attachment).file_url}
                                        alt={campaign.title}
                                        className="w-full h-56 sm:h-80 lg:h-[420px] object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-56 sm:h-80 lg:h-[420px] bg-slate-100 grid place-items-center text-slate-400">
                                        <Package className="h-16 w-16" />
                                    </div>
                                )}
                                {campaign.thumbnail_video && (
                                    <button
                                        type="button"
                                        onClick={() => setVideoOpen(true)}
                                        aria-label="Play campaign video"
                                        className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-campaign px-4 py-2.5 text-white shadow-lg hover:bg-campaign-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-campaign/40"
                                    >
                                        <Play className="h-5 w-5" fill="currentColor" />
                                        <span className="text-sm font-semibold">Watch video</span>
                                    </button>
                                )}
                            </div>
                        </div>
```

- [ ] **Step 5: Add the modal**

Find `            <ToastContainer />` and insert the modal immediately before it:
```tsx
            {videoOpen && campaign.thumbnail_video && (
                <div
                    className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setVideoOpen(false)}
                    role="dialog"
                    aria-modal="true"
                >
                    <button
                        type="button"
                        onClick={() => setVideoOpen(false)}
                        aria-label="Close video"
                        className="absolute top-4 right-4 inline-flex items-center justify-center h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                    <video
                        src={(campaign.thumbnail_video as Attachment).file_url}
                        controls
                        autoPlay
                        onClick={(e) => e.stopPropagation()}
                        className="max-h-[80vh] w-auto max-w-full rounded-xl bg-black"
                    />
                </div>
            )}

            <ToastContainer />
```

- [ ] **Step 6: Verify**
```bash
cd /home/ubuntu/projects/old/RenoXpert-Frontend-v2.1
npm run build
npx eslint src/pages/CampaignPages/CampaignDetailPage.tsx --ext ts,tsx --max-warnings 0
```
Expected: both exit 0. Then manual: a campaign WITH a video shows the crimson "Watch video" button on the hero; clicking opens the modal, the video plays, and X / backdrop / Esc all close it; a campaign WITHOUT a video shows no button; image-only and fallback states unaffected; check 375 / 768 / 1280.

- [ ] **Step 7: Commit**
```bash
git add src/pages/CampaignPages/CampaignDetailPage.tsx
git commit -m "feat(campaign): hero play button + modal video on public landing (H1)"
```
(Append the standard trailer lines.)

---

### Task 7: Full verification & finalize

**Files:** none (verification only).

- [ ] **Step 1: Frontend gate**
```bash
cd /home/ubuntu/projects/old/RenoXpert-Frontend-v2.1
npm run build
npx eslint src/types/index.ts src/services/api.ts src/pages/Campaign/EditCampaign.tsx src/pages/Campaign/AddCampaign.tsx src/pages/CampaignPages/CampaignDetailPage.tsx --ext ts,tsx --max-warnings 0
```
Expected: both exit 0.

- [ ] **Step 2: Backend gate**
```bash
cd /home/ubuntu/projects/old/RenoXpert-Backend
for f in database/migrations/2026_06_22_000000_add_thumbnail_video_to_campaigns_table.php app/Models/Campaign.php app/Http/Controllers/CampaignController.php routes/api.php app/Http/Resources/CampaignResource.php app/Http/Resources/Campaign/CampaignResource.php; do php -l "$f"; done
```
Expected: "No syntax errors detected" for each (or manual review if `php` is unavailable).

- [ ] **Step 3: Manual end-to-end smoke (after the user runs `php artisan migrate`)**
- Apply migration (USER action): `php artisan migrate`.
- Admin: AddCampaign with a video → created + uploaded; EditCampaign replace → old S3 object replaced; remove → column null + S3 object gone.
- Public: `GET /public/campaigns/{slug}` returns `thumbnail_video.file_url`; landing shows the play button; modal plays; closes via X / backdrop / Esc; no-video campaign shows no button.
- Confirm server `upload_max_filesize` / `post_max_size` ≥ 50 MB on the target environment.

- [ ] **Step 4: Finalize the branch**

Use the `superpowers:finishing-a-development-branch` skill for `feature/inline-thumbnail-video` (base `production`). Remember the migration is run manually by the user; flag that in the merge/PR summary.

---

## Self-Review

**Spec coverage:** spec §4.1 migration+model → Task 1; §4.1 controller/routes/resources → Task 2; §4.4 types + §4.2 api → Task 3; §4.2 EditCampaign → Task 4; §4.2 AddCampaign two-step → Task 5; §4.3 public play button + modal → Task 6; §5 verification → per-task gates + Task 7. The "migration authored but not run by us" constraint is in Global Constraints and Tasks 1 & 7. All spec sections map to a task.

**Placeholder scan:** no TBD/TODO; every code step has complete code with exact anchors. Import edits for EditCampaign/AddCampaign name exactly what to add (Attachment / the two api funcs / uploadCampaignThumbnailVideo) even where a line number isn't quoted — the named symbol is the anchor.

**Type/shape consistency:** `uploadCampaignThumbnailVideo`/`deleteCampaignThumbnailVideo` signatures match across Tasks 3→4→5; the upload response is read as `res.data.thumbnail_video.file_url` (Task 4) and the controller returns exactly `data: { thumbnail_video: {...} }` (Task 2). Create response id read as `created.data.id` (Task 5) matches `sendResponse(new CampaignResource(...))` (controller store). `Campaign.thumbnail_video?: Attachment | File` (Task 3) is cast `(... as Attachment).file_url` in Tasks 4 and 6, matching the existing `thumbnail` cast. Backend stores/reads `thumbnail_video` as an array via the cast added in Task 1. Filename prefix `thumbnail_video_`, dir `campaigns`, and delete-old-`path` mirror the thumbnail pattern.
