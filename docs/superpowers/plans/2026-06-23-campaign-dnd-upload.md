# Campaign Drag-and-Drop File Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add drag-and-drop (on top of click-to-browse) to the four campaign-admin file uploads — thumbnail, thumbnail video, layout rental projection, layout renderings — in both AddCampaign and EditCampaign.

**Architecture:** A new reusable `FileDropzone` presentational component manages native HTML5 drag state + type-filtering and calls `onFiles(File[])`. Each existing upload block is wrapped with it; the existing file-input `onChange` handlers are refactored into shared file-cores so the input path and the drop path feed the exact same logic. Frontend-only — no backend, no new endpoints, no new deps.

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind (crimson `campaign` token). Native drag-and-drop events (no @dnd-kit — that is reserved for the package/layout reorder, which is unrelated).

## Global Constraints

- **Frontend only.** No backend/API/endpoint changes; DnD feeds the existing upload handlers.
- **No new npm dependencies.** Native `onDragEnter/Over/Leave/Drop`.
- **Click-to-browse stays unchanged** at every site; DnD is purely additive.
- **Type filter on drop** matches each zone's `accept`: image zones → `image/*`; video zone → `video/*`. Non-matching files are silently filtered; an all-non-matching drop is a no-op (no toast).
- **Preserve existing size/type rules exactly:** video 50MB check; layout images 10MB-per-image check; thumbnail relies on backend 10MB validation (no client size check added).
- **Multiple** only for Layout Renderings (append several at once). Thumbnail / video / rental projection take the first matching file.
- **Verification (no test runner in repo):** `npm run build` exit 0 + scoped eslint introduces no NEW errors. Baselines: `AddCampaign.tsx` = 1, `EditCampaign.tsx` = 1 (pre-existing `handleClearTemplateOrder` unused-var), `FileDropzone.tsx` must be 0.
- **Branch:** `feature/campaign-dnd-upload` (already created off `production`). FE finish = merge+push to `production`.
- **Commit trailers** on every commit:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS
  ```

---

### Task 1: `FileDropzone` component

**Files:**
- Create: `src/pages/Campaign/components/FileDropzone.tsx`

**Interfaces:**
- Consumes: nothing (leaf component).
- Produces: `export default FileDropzone` with props
  `{ accept: 'image' | 'video'; multiple?: boolean; onFiles: (files: File[]) => void; disabled?: boolean; className?: string; children: React.ReactNode }`.
  Tasks 2 and 3 import it as `import FileDropzone from './components/FileDropzone';`.

- [ ] **Step 1: Create the component file**

Create `src/pages/Campaign/components/FileDropzone.tsx` with exactly:

```tsx
import { useRef, useState } from 'react';

interface FileDropzoneProps {
    /** Which MIME family this zone accepts. Maps to `${accept}/` prefix filtering. */
    accept: 'image' | 'video';
    /** Allow multiple files in one drop. Single zones use the first matching file. */
    multiple?: boolean;
    /** Called with the matching dropped files (already type-filtered). */
    onFiles: (files: File[]) => void;
    /** When true, drag/drop is a no-op. */
    disabled?: boolean;
    /** Classes for the wrapper element (keep the existing box classes here). */
    className?: string;
    children: React.ReactNode;
}

/**
 * Adds native drag-and-drop to an existing upload area. Presentational + behavioral
 * only: it never uploads or knows about campaigns — it turns a drop into onFiles(File[]).
 * Click-to-browse inside `children` is untouched.
 */
const FileDropzone: React.FC<FileDropzoneProps> = ({
    accept,
    multiple = false,
    onFiles,
    disabled = false,
    className = '',
    children,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    // Counter so dragging over child elements doesn't flicker the highlight.
    const dragDepth = useRef(0);

    const matches = (file: File) => file.type.startsWith(`${accept}/`);

    const handleDragEnter = (e: React.DragEvent) => {
        if (disabled) return;
        e.preventDefault();
        dragDepth.current += 1;
        setIsDragging(true);
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (disabled) return;
        e.preventDefault(); // required so the browser allows a drop
    };

    const handleDragLeave = (e: React.DragEvent) => {
        if (disabled) return;
        e.preventDefault();
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) {
            dragDepth.current = 0;
            setIsDragging(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        if (disabled) return;
        e.preventDefault();
        dragDepth.current = 0;
        setIsDragging(false);
        const dropped = Array.from(e.dataTransfer.files ?? []);
        const valid = dropped.filter(matches);
        if (valid.length === 0) return;
        onFiles(multiple ? valid : [valid[0]]);
    };

    return (
        <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`${className} ${isDragging ? 'border-2 border-dashed border-campaign bg-campaign/5' : ''}`.trim()}
        >
            {children}
        </div>
    );
};

export default FileDropzone;
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: exit 0 (`✓ built in ...`).

- [ ] **Step 3: Lint the new file (must be clean)**

Run: `npx eslint src/pages/Campaign/components/FileDropzone.tsx --ext ts,tsx --format unix`
Expected: no output (0 errors).

- [ ] **Step 4: Commit**

```bash
git add src/pages/Campaign/components/FileDropzone.tsx
git commit -m "feat(campaign): FileDropzone component for drag-and-drop uploads

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 2: Wire drag-and-drop into AddCampaign

**Files:**
- Modify: `src/pages/Campaign/AddCampaign.tsx`

**Interfaces:**
- Consumes: `FileDropzone` from Task 1 (`import FileDropzone from './components/FileDropzone';`).
- Produces: new shared cores `handleThumbnailFile(file: File)`, `handleVideoFile(file: File)`; `handleLayoutRenderingsChange` signature changed to `(layoutIdx: number, files: File[])`. (Edit, Task 3, mirrors this independently — no cross-file dependency.)

- [ ] **Step 1: Add the import**

At the top of `src/pages/Campaign/AddCampaign.tsx`, alongside the other local imports (the file already imports `SortableCampaignItems` from `./components/...` — add next to it):

```tsx
import FileDropzone from './components/FileDropzone';
```

- [ ] **Step 2: Extract the thumbnail file-core**

Replace the existing `handleFileChange` (currently at ~line 204):

```tsx
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                thumbnail: file
            }));
        }
    };
```

with:

```tsx
    const handleThumbnailFile = (file: File) => {
        setFormData(prev => ({
            ...prev,
            thumbnail: file
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleThumbnailFile(file);
    };
```

- [ ] **Step 3: Extract the video file-core**

Replace the existing `handleVideoChange` (currently at ~line 214):

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

with:

```tsx
    const handleVideoFile = (file: File) => {
        setVideoError(null);
        if (file.size > 50 * 1024 * 1024) {
            setVideoError('Video must be 50MB or smaller.');
            return;
        }
        setVideoFile(file);
    };

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleVideoFile(file);
    };
```

- [ ] **Step 4: Normalize the renderings handler to `File[]`**

Replace `handleLayoutRenderingsChange` (currently at ~line 489):

```tsx
    const handleLayoutRenderingsChange = (layoutIdx: number, files: FileList | null) => {
        setLayoutError(null);
        if (!files || !files.length) return;
        const arr = Array.from(files);
        if (arr.some(f => f.size > 10 * 1024 * 1024)) { setLayoutError('Each image must be 10MB or smaller.'); return; }
        setLayoutRenderingFiles(prev => ({ ...prev, [layoutIdx]: [...(prev[layoutIdx] || []), ...arr] }));
    };
```

with:

```tsx
    const handleLayoutRenderingsChange = (layoutIdx: number, files: File[]) => {
        setLayoutError(null);
        if (!files.length) return;
        if (files.some(f => f.size > 10 * 1024 * 1024)) { setLayoutError('Each image must be 10MB or smaller.'); return; }
        setLayoutRenderingFiles(prev => ({ ...prev, [layoutIdx]: [...(prev[layoutIdx] || []), ...files] }));
    };
```

- [ ] **Step 5: Update the renderings `onChange` call site**

The renderings `<input>`’s `onChange` currently passes a `FileList` (at ~line 1624: `onChange={(e) => handleLayoutRenderingsChange(layoutIdx, e.target.files)}`). Change it to pass an array:

```tsx
                                                        onChange={(e) => handleLayoutRenderingsChange(layoutIdx, Array.from(e.target.files ?? []))}
```

- [ ] **Step 6: Wrap the four upload blocks with `FileDropzone`**

For each upload block, wrap its existing **outer container `<div>`** (the box that visually contains the label + `<input>` + preview) by replacing that container with a `FileDropzone` carrying the container's classes. Do NOT change the inner markup or the `<input>` — only add the wrapper. Use these props per site:

1. **Thumbnail** (the `image/*` input with `id="thumbnail-upload"`, ~line 1303–1308 inside its dropzone box):
   ```tsx
   <FileDropzone accept="image" onFiles={(f) => handleThumbnailFile(f[0])} className="<existing box classes>">
       {/* existing label + input#thumbnail-upload + preview, unchanged */}
   </FileDropzone>
   ```

2. **Thumbnail video** (`video/...` input `id="thumbnail-video-upload"`, ~line 1367–1371):
   ```tsx
   <FileDropzone accept="video" onFiles={(f) => handleVideoFile(f[0])} className="<existing box classes>">
       {/* existing label + video input + preview, unchanged */}
   </FileDropzone>
   ```

3. **Layout Rental Projection** (single image, ~line 1590–1614):
   ```tsx
   <FileDropzone accept="image" onFiles={(f) => handleLayoutProjectionChange(layoutIdx, f[0] ?? null)} className="<existing box classes>">
       {/* existing 'Rental Projection (single image)' label + input + preview, unchanged */}
   </FileDropzone>
   ```

4. **Layout Renderings** (multiple images, ~line 1615–1660):
   ```tsx
   <FileDropzone accept="image" multiple onFiles={(f) => handleLayoutRenderingsChange(layoutIdx, f)} className="<existing box classes>">
       {/* existing 'Renderings (multiple images)' label + input + thumbnails, unchanged */}
   </FileDropzone>
   ```

If a block's outer container already has classes, move those classes verbatim onto `FileDropzone`'s `className`. If a block has no single wrapping `<div>`, add `FileDropzone` as a new wrapper around the label+input+preview group.

- [ ] **Step 7: Build**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 8: Lint (no new errors vs baseline 1)**

Run: `npx eslint src/pages/Campaign/AddCampaign.tsx --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'`
Expected: `1` (the pre-existing `handleClearTemplateOrder` unused-var; no new errors). If higher, fix the new issues (do not touch the pre-existing one).

- [ ] **Step 9: Commit**

```bash
git add src/pages/Campaign/AddCampaign.tsx
git commit -m "feat(campaign): drag-and-drop uploads in AddCampaign

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 3: Wire drag-and-drop into EditCampaign

**Files:**
- Modify: `src/pages/Campaign/EditCampaign.tsx`

**Interfaces:**
- Consumes: `FileDropzone` from Task 1; the existing `handleEditLayoutProjection(layoutIdx, file: File | null)` (async).
- Produces: shared cores `handleThumbnailFile(file: File)`, `handleVideoFile(file: File)` (async); `handleEditLayoutRenderings` signature changed to `(layoutIdx: number, files: File[])`.

- [ ] **Step 1: Add the import**

At the top of `src/pages/Campaign/EditCampaign.tsx`, next to the other `./components/...` imports:

```tsx
import FileDropzone from './components/FileDropzone';
```

- [ ] **Step 2: Extract the thumbnail file-core**

Replace `handleFileChange` (currently at ~line 290):

```tsx
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                thumbnail: file
            }));
        }
    };
```

with:

```tsx
    const handleThumbnailFile = (file: File) => {
        setFormData(prev => ({
            ...prev,
            thumbnail: file
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleThumbnailFile(file);
    };
```

- [ ] **Step 3: Extract the video file-core (async — uploads immediately)**

Replace `handleVideoChange` (currently at ~line 300):

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
```

with:

```tsx
    const handleVideoFile = async (file: File) => {
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

    const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) await handleVideoFile(file);
    };
```

- [ ] **Step 4: Normalize the renderings handler to `File[]`**

In `handleEditLayoutRenderings` (currently at ~line 624) change the signature and the array construction. Replace:

```tsx
    const handleEditLayoutRenderings = async (layoutIdx: number, files: FileList | null) => {
```

with:

```tsx
    const handleEditLayoutRenderings = async (layoutIdx: number, files: File[]) => {
```

Then, inside that handler, replace the guard + array line (currently `if (!files || !files.length) return;` followed by `const arr = Array.from(files);`) with a single line that reuses `files` directly:

```tsx
        setLayoutError(null);
        if (!files.length) return;
        const arr = files;
```

(Keep the rest of the body — the `arr.some(f => f.size > 10MB)` check, the new-layout pending-file branch, and the `uploadCampaignLayoutTypeRenderings(layoutId, arr)` call — unchanged.)

- [ ] **Step 5: Update the renderings `onChange` call site**

The renderings `<input>`’s `onChange` (at ~line 1792: `onChange={(e) => handleEditLayoutRenderings(layoutIdx, e.target.files)}`) → pass an array:

```tsx
                                                        onChange={(e) => handleEditLayoutRenderings(layoutIdx, Array.from(e.target.files ?? []))}
```

- [ ] **Step 6: Wrap the four upload blocks with `FileDropzone`**

Same wrapping rule as Task 2 Step 6 (wrap each block's outer container, move its classes onto `FileDropzone`, leave inner markup + `<input>` unchanged). Props per site:

1. **Thumbnail** (`image/*` input, ~line 1419–1421):
   `<FileDropzone accept="image" onFiles={(f) => handleThumbnailFile(f[0])} className="<existing box classes>"> … </FileDropzone>`

2. **Thumbnail video** (`video/...` input, ~line 1483 / 1509 — wrap the upload box; if there are two inputs (initial + replace) wrap whichever box hosts the active uploader):
   `<FileDropzone accept="video" onFiles={(f) => handleVideoFile(f[0])} className="<existing box classes>"> … </FileDropzone>`

3. **Layout Rental Projection** (single image, ~line 1741):
   `<FileDropzone accept="image" onFiles={(f) => handleEditLayoutProjection(layoutIdx, f[0] ?? null)} className="<existing box classes>"> … </FileDropzone>`

4. **Layout Renderings** (multiple images, ~line 1761/1789):
   `<FileDropzone accept="image" multiple onFiles={(f) => handleEditLayoutRenderings(layoutIdx, f)} className="<existing box classes>"> … </FileDropzone>`

- [ ] **Step 7: Build**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 8: Lint (no new errors vs baseline 1)**

Run: `npx eslint src/pages/Campaign/EditCampaign.tsx --ext ts,tsx --format unix | grep -c ':[0-9]*:[0-9]*:'`
Expected: `1` (pre-existing only). Fix any new issues if higher.

- [ ] **Step 9: Commit**

```bash
git add src/pages/Campaign/EditCampaign.tsx
git commit -m "feat(campaign): drag-and-drop uploads in EditCampaign

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01J2tswg9TLbEnKfxdrZexhS"
```

---

### Task 4: Verify + finalize

**Files:** none (verification + merge).

**Interfaces:** consumes Tasks 1–3.

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 2: Scoped lint sweep**

Run:
```bash
for f in src/pages/Campaign/components/FileDropzone.tsx src/pages/Campaign/AddCampaign.tsx src/pages/Campaign/EditCampaign.tsx; do
  echo "$f: $(npx eslint "$f" --ext ts,tsx --format unix 2>/dev/null | grep -c ':[0-9]*:[0-9]*:')"
done
```
Expected: `FileDropzone.tsx: 0`, `AddCampaign.tsx: 1`, `EditCampaign.tsx: 1`.

- [ ] **Step 3: Manual QA checklist (record results in the task report)**

In a running dev build, on **both** Add and Edit:
- Drag an **image** onto the **thumbnail** zone → highlight appears on drag-over, file accepted, preview/name shows; then verify **click-to-browse** still sets the thumbnail.
- Drag a **video** onto the **video** zone → accepted (Edit uploads immediately); drag a **>50MB** video → "Video must be 50MB or smaller." shows.
- On a **layout type**: drag an image onto **Rental Projection** → set; drag **several** images onto **Renderings** → all appended; drag a **>10MB** image → "…10MB or smaller." shows.
- Drop a **wrong type** (image on the video zone, or a PDF on an image zone) → ignored, no crash.
- Submit the form → all files upload exactly as before.

- [ ] **Step 4: Finalize (FE merge+push to production)**

```bash
git checkout production
git pull --ff-only
git merge --ff-only feature/campaign-dnd-upload
npm run build          # exit 0 gate before push
git branch -d feature/campaign-dnd-upload
git push origin production
```

---

## Self-Review

**Spec coverage:**
- §4 FileDropzone (drag counter, type filter, highlight, single/multiple) → Task 1. ✅
- §5 wiring table (4 zones × 2 forms) + handler-core refactor + renderings `File[]` normalization + `onChange` call-site updates → Tasks 2 & 3. ✅
- §3 constraints (click-to-browse unchanged, type filter, size rules preserved, no deps) → Global Constraints + per-task steps. ✅
- §8 verification (build + eslint baselines + manual QA) → Tasks 1–4 verify steps. ✅
- §2 frontend-only / finalize to production → Task 4. ✅

**Placeholder scan:** No TBD/TODO. The only `<existing box classes>` markers are explicit instructions to copy the current container classes verbatim (the JSX markup is read in-file by the implementer), not unfilled blanks; the substantive logic (component + handler cores) is fully specified.

**Type consistency:** `handleThumbnailFile(file: File)`, `handleVideoFile(file: File)` (async in Edit), `handleLayoutRenderingsChange(layoutIdx, files: File[])` (Add), `handleEditLayoutRenderings(layoutIdx, files: File[])` (Edit), `handleLayoutProjectionChange`/`handleEditLayoutProjection(layoutIdx, file: File | null)`. `FileDropzone.onFiles: (files: File[]) => void` — call sites use `f[0]` (single) or `f` (multiple), consistent with each handler's parameter type. ✅
