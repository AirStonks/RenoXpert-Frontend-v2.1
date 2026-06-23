# Campaign Admin — Drag-and-Drop File Upload Design Spec

- **Date:** 2026-06-23
- **Status:** Proposed — awaiting user review before implementation planning
- **Owner:** Frontend (`RenoXpert-Frontend-v2.1`), base branch `production`, feature branch `feature/campaign-dnd-upload`
- **Part of:** Campaign Adjustments follow-ups (after #1–#6 + flat-campaign/null-field fixes)

---

## 1. Context & Goal

The campaign admin Create/Edit forms (`src/pages/Campaign/AddCampaign.tsx`, `src/pages/Campaign/EditCampaign.tsx`) upload files via **click-to-browse only** (`<input type="file">`). The request: **allow drag-and-drop to upload** for these files. Click-to-browse stays; drag-and-drop is added on top.

There is **no generic "attachments" data model** on campaigns — `Attachment` in `src/types` is only a shared file-shape type (`file_url`, `path`). "Attachments" here means the existing campaign file uploads:

1. **Campaign thumbnail** — single image (`formData.thumbnail`)
2. **Thumbnail video** — single video (`videoFile` / H1 inline video)
3. **Layout Rental Projection** — single image, per layout type
4. **Layout Renderings** — multiple images, per layout type

All four are in scope, in **both** Add and Edit.

## 2. Scope

**Frontend only.** No backend, no API, no new endpoints — drag-and-drop feeds the **same upload handlers and endpoints already in use**. No new npm dependencies (native HTML5 drag-and-drop events).

- **New** `src/pages/Campaign/components/FileDropzone.tsx` — reusable drag-and-drop wrapper.
- `src/pages/Campaign/AddCampaign.tsx` — wrap the 4 upload areas with `FileDropzone`; extract shared file-cores for thumbnail/video.
- `src/pages/Campaign/EditCampaign.tsx` — same treatment (its layout handlers + video handler are async/upload-on-the-spot; the dropzone calls them unchanged).

**Out of scope:** backend (uploads already work); the public campaign pages; any change to which files a campaign supports; new size/type validation beyond current behavior; reordering of uploaded images (separate concern).

## 3. Constraints

- **Click-to-browse unchanged.** Each existing `<input type="file">` keeps working exactly as today; drag-and-drop is purely additive.
- **Type filtering on drop** matches each input's `accept`: image zones accept `image/*`, the video zone accepts `video/*`. Files of the wrong type in a drop are **ignored** (silently filtered); if nothing in the drop matches, nothing happens.
- **No new size/type rules** beyond what exists: the **video keeps its existing 50MB client check** (in `handleVideoChange`); the thumbnail keeps relying on the backend's 10MB validation (as today — no client size check is added).
- **Multiple** only for Layout Renderings (drop several images at once, appended to the existing list). Thumbnail, video, and rental projection are single — a multi-file drop on them uses the **first matching file**.
- **No new dependencies**; native `onDragEnter/Over/Leave/Drop`.
- **Verification gate:** `npm run build` exit 0 + scoped eslint introduces no new errors. Baselines: `AddCampaign.tsx` = 1, `EditCampaign.tsx` = 1 (pre-existing `handleClearTemplateOrder` unused-var), new `FileDropzone.tsx` must be clean (0). No test runner in the project.

## 4. Component — `FileDropzone`

`src/pages/Campaign/components/FileDropzone.tsx`

**Props:**
```ts
interface FileDropzoneProps {
  accept: 'image' | 'video';          // maps to image/* or video/* MIME filtering
  multiple?: boolean;                 // default false
  onFiles: (files: File[]) => void;   // called with the matching dropped files
  disabled?: boolean;                 // optional; when true, drop is a no-op
  className?: string;                  // wrapper classes
  children: React.ReactNode;          // the existing upload UI (input + preview)
}
```

**Behavior:**
- Renders a wrapping element around `children` and attaches `onDragEnter`, `onDragOver`, `onDragLeave`, `onDrop`.
- **Drag state via a counter** (`dragDepth` ref/state incremented on enter, decremented on leave) so moving over child elements doesn't flicker the highlight. `isDragging` is true while depth > 0.
- `onDragOver` calls `preventDefault()` (required so the browser allows a drop).
- **On drop:** `preventDefault()`, reset depth, read `e.dataTransfer.files`, convert to array, **filter by `accept`** (`file.type.startsWith('image/')` or `'video/'`). If empty → no-op. Else call `onFiles(multiple ? matches : [matches[0]])`.
- **Visual:** when `isDragging`, apply a highlight to the wrapper — dashed crimson `campaign`-token border + a light tint (e.g. `border-2 border-dashed border-campaign bg-campaign/5`), consistent with the existing styled thumbnail dropzone look. When not dragging, the wrapper is visually neutral (just passes through `className`).
- `disabled` → skip handlers / no highlight (kept for safety; not required by current call sites).

The component is **presentational + behavioral only**: it never uploads or knows about campaigns. It just turns a drop into `onFiles(File[])`.

## 5. Wiring per upload site

| Upload | accept | multiple | `onFiles` target |
|---|---|---|---|
| Campaign thumbnail | image | no | `handleThumbnailFile(files[0])` |
| Thumbnail video | video | no | `handleVideoFile(files[0])` |
| Layout Rental Projection | image | no | `handleLayoutProjectionChange(layoutIdx, files[0] ?? null)` *(Edit: `handleEditLayoutProjection`)* |
| Layout Renderings | image | yes | renderings handler with `files` (File[]) appended *(Add: `handleLayoutRenderingsChange`; Edit: `handleEditLayoutRenderings`)* |

### Refactor (no behavior change for click-to-browse)
- **AddCampaign**:
  - Extract `handleThumbnailFile(file: File)` from `handleFileChange`; `handleFileChange` becomes `e => { const f = e.target.files?.[0]; if (f) handleThumbnailFile(f); }`.
  - Extract `handleVideoFile(file: File)` from `handleVideoChange` (keep the 50MB check + `setVideoError`/`setVideoFile` inside the core); `handleVideoChange` becomes the event adapter.
  - `handleLayoutProjectionChange(layoutIdx, file)` already takes a `File | null` — call directly.
  - `handleLayoutRenderingsChange` currently takes `FileList | null`; **normalize it to accept `File[]`** (and update the existing `onChange` call site to pass `Array.from(e.target.files ?? [])`), so both the input and the dropzone feed `File[]`.
- **EditCampaign**: same thumbnail/video core extraction. `handleEditLayoutProjection(idx, file: File | null)` already takes a `File` — call directly. `handleEditLayoutRenderings(idx, files: FileList | null)` takes a **FileList** → **normalize to `File[]`** (update its `onChange` to `Array.from(e.target.files ?? [])`), so both input and dropzone feed `File[]`; its existing **10MB-per-image** check stays inside the core. Note the Edit layout handlers are **async and upload immediately** for existing layouts (vs. pending-file maps for new layouts) — the dropzone changes nothing about that; it only supplies the file(s).

Each existing upload block is wrapped:
```tsx
<FileDropzone accept="image" onFiles={(f) => handleThumbnailFile(f[0])} className="...existing box classes...">
  {/* existing label + <input type="file"> + preview, unchanged */}
</FileDropzone>
```

## 6. Data flow

Drop on a zone → `FileDropzone` filters by type → `onFiles(File[])` → the **same handler the file input already calls** → existing state update (`formData.thumbnail`, `videoFile`, `layoutProjectionFile`/`layoutRenderingFiles` in Add; pending maps or immediate upload in Edit) → existing submit/upload path. No new persistence logic.

## 7. Edge cases

- **Wrong type dropped** (e.g. PDF on an image zone): filtered out; if the whole drop is non-matching, no-op (no error toast — matches the silent nature of the file picker's `accept`). *(A toast is intentionally omitted to keep parity; can be added later if desired.)*
- **Multiple files on a single-file zone**: use the first matching file.
- **Drag of non-files** (text/elements): `dataTransfer.files` is empty → no-op.
- **Oversized video**: the shared `handleVideoFile` core still runs the 50MB check and sets `videoError` exactly as the picker path does.
- **Drag highlight flicker** over inner children: prevented by the enter/leave depth counter.
- **Reorder drag (@dnd-kit) coexistence**: the package/layout reorder uses `@dnd-kit` pointer sensors on drag *handles*; `FileDropzone` uses native file-drag events on upload areas. They don't overlap (different elements, different event systems), so no conflict.

## 8. Verification plan

- `npm run build` → exit 0.
- Scoped eslint: `AddCampaign.tsx` ≤ 1, `EditCampaign.tsx` ≤ 1 (no new errors), `FileDropzone.tsx` = 0.
- Manual QA (Add and Edit):
  - Drag an image file onto the **thumbnail** zone → highlight shows on drag-over, file is accepted, preview/name appears; click-to-browse still works.
  - Drag a video onto the **video** zone → accepted; drag an oversized video → 50MB error shows (parity with picker).
  - On a layout type: drag an image onto **Rental Projection** → set; drag several images onto **Renderings** → all appended.
  - Drop a wrong-type file (e.g. an image on the video zone) → ignored, no crash.
  - Confirm submit still uploads everything as before.

## 9. Risks & mitigations

- **Wrapping markup breaks existing layout/styling** → `FileDropzone` passes `className` through to a single wrapper `div` around the unchanged inner markup; keep the existing box classes on the wrapper.
- **Refactor regresses click-to-browse** → the event handlers become thin adapters calling the same extracted core; behavior identical. Verified by manual picker test.
- **Edit's immediate-upload layout handlers** → dropzone only supplies files; async upload path unchanged.
- **Double-handling** (input change + drop both firing) → they are distinct user actions on distinct elements; no shared event.

## 10. Non-goals

- No backend change; no new attachments model; no image reordering; no progress bars; no chunked/resumable upload; no paste-to-upload; no whole-page dropzone (per-field only, since there are 4 distinct targets + per-layout instances).

## 11. Suggested plan tasks

1. **T1:** Create `FileDropzone.tsx` (drag state + type filter + highlight) — new file, clean lint.
2. **T2:** AddCampaign — extract thumbnail/video cores, normalize renderings handler to `File[]`, wrap all 4 zones.
3. **T3:** EditCampaign — extract thumbnail/video cores, wrap all 4 zones (layout handlers used as-is).
4. **T4:** Verify (build + eslint baselines) + finalize (merge+push to `production`, per FE workflow).
