# Layout Type System — Phase B2 (Admin) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. **Tasks 2 & 3 are guided refactors of large files — dispatch them on a capable model and have the implementer READ the cited line ranges before editing.**

**Goal:** Let admins manage Layout Types (name/description + 1 rental-projection + many renderings) and assign sub-packages to them in the Add/Edit Campaign forms, consuming the B1 API — gated behind a "Use layout types" toggle so the existing flat flow is untouched.

**Architecture:** Frontend-only. Add FE types; extend `createCampaign`/`updateCampaign` FormData to send a nested `layout_types` array + layout image-upload helpers (B1 endpoints). In both forms add a `useLayoutTypes` toggle and, when on, a nested UI: collapsible Layout Type sections each with name/desc, rental-projection + renderings uploaders, and their sub-packages (the existing package cards, grouped by a `packageLayoutIndex` map) + "Add sub-package". On submit, thread `layout_type_index` (and `layout_type_id` on edit) per package and send `layout_types`. Images: immediate upload on Edit (layout id exists), two-step after create on Add.

**Tech Stack:** React 18 + TS, Vite, Tailwind, axios. Repo: `/home/ubuntu/projects/old/RenoXpert-Frontend-v2.1`.

**Spec:** `docs/superpowers/specs/2026-06-22-layout-type-B2-admin-design.md`
**B1 API (done, PR #3):** `layout_types` in the campaign resource; routes `POST/DELETE campaign-layout-types/{id}/rental-projection`, `POST/DELETE campaign-layout-types/{id}/renderings`; linking contract `layout_types: [{id?,name,description,sort}]` + package `layout_type_index`/`layout_type_id`.

## Global Constraints

- **Backward-compatible:** toggle OFF (default) ⇒ both forms behave exactly as today (flat `packages`, no layout UI, no `layout_types` sent, null `layout_type_id`). Existing flat campaigns load with the toggle off; campaigns with `layout_types` load with it on.
- **Preserve the existing per-index package maps** (`packageValueSources`, `selectedPackageOrderTemplates`, `packageErrors`, `collapsedPackages`). Achieve the nested UI by GROUPING the flat `packages` array via a `packageLayoutIndex` map (packageIndex → layout array index) — do NOT restructure `packages` into nested arrays.
- **api.ts:** `createCampaign`/`updateCampaign` must gain a `layout_types` FormData branch (`layout_types[${i}][${key}]`); `layout_type_index`/`layout_type_id` ride along inside each package object automatically.
- **Layout images live on the layout type** (`campaign.layout_types[].rental_projection` / `.rendering_images`), not on packages.
- **Image timing:** Edit = immediate upload via B1 endpoints; Add = two-step after `createCampaign` returns `data.layout_types[]` (match by index/`sort`); partial failure ⇒ campaign saved + a clear message.
- **Verification gate:** `npm run build` exit 0; scoped eslint on each changed file introduces **no new errors** vs its baseline (AddCampaign/EditCampaign = 2 pre-existing each; api.ts has pre-existing errors; types/index.ts must stay at its baseline). No test runner — don't scaffold one. `php`/migrate are backend (B1) — not relevant here.
- **Co-author trailers** on every commit.

---

### Task 0: Branch + commit the B2 spec

- [ ] **Step 1: Branch off production**
```bash
cd /home/ubuntu/projects/old/RenoXpert-Frontend-v2.1
git checkout production && git pull --ff-only
git checkout -b feature/layout-type-admin
```
- [ ] **Step 2: Commit the spec + this plan**
```bash
git add docs/superpowers/specs/2026-06-22-layout-type-B2-admin-design.md docs/superpowers/plans/2026-06-22-layout-type-B2-admin.md
git commit -m "docs(campaign): layout type admin (B2) spec + plan"
```
(Append trailers.)

---

### Task 1: Types + api.ts (layout_types FormData + image helpers)

**Files:**
- Modify: `src/types/index.ts` (Campaign ~1631; CampaignPackage; add CampaignLayoutType)
- Modify: `src/services/api.ts` (`createCampaign` 3004–3035; `updateCampaign` 3037–3068; add 4 helpers after them)

**Interfaces produced (consumed by Tasks 2–3):** `CampaignLayoutType` type; `Campaign.layout_types`; `CampaignPackage.layout_type_id`/`layout_type_index`; `uploadCampaignLayoutTypeRentalProjection(id,file)`, `deleteCampaignLayoutTypeRentalProjection(id)`, `uploadCampaignLayoutTypeRenderings(id,files)`, `deleteCampaignLayoutTypeRendering(id,path)`; and `createCampaign`/`updateCampaign` now send `layout_types`.

- [ ] **Step 1: Add the `CampaignLayoutType` type + extend Campaign/CampaignPackage**

In `src/types/index.ts`, add the interface (near the other campaign interfaces) and extend the two existing ones. Find `    thumbnail_video?: Attachment | File;` in `Campaign` and add after it:
```ts
    thumbnail_video?: Attachment | File;
    layout_types?: CampaignLayoutType[];
```
Find the `CampaignPackage` interface's `order_id?` line and add after it:
```ts
    layout_type_id?: number | string;
    layout_type_index?: number;
```
Add the new interface immediately before the `Campaign` interface declaration:
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

- [ ] **Step 2: Add the `layout_types` branch to `createCampaign`**

In `src/services/api.ts`, the `createCampaign` loop currently handles `packages`, `thumbnail`, then a scalar `else`. Add a `layout_types` branch. Replace:
```ts
            if (key === 'packages' && campaignData[key]) {
                // Handle packages array
                campaignData[key].forEach((pkg: any, index: number) => {
                    Object.keys(pkg).forEach(pkgKey => {
                        formData.append(`packages[${index}][${pkgKey}]`, pkg[pkgKey]);
                    });
                });
            } else if (key === 'thumbnail' && campaignData[key] instanceof File) {
```
with:
```ts
            if (key === 'packages' && campaignData[key]) {
                // Handle packages array
                campaignData[key].forEach((pkg: any, index: number) => {
                    Object.keys(pkg).forEach(pkgKey => {
                        formData.append(`packages[${index}][${pkgKey}]`, pkg[pkgKey]);
                    });
                });
            } else if (key === 'layout_types' && campaignData[key]) {
                // Handle layout_types array
                campaignData[key].forEach((lt: any, index: number) => {
                    Object.keys(lt).forEach(ltKey => {
                        if (lt[ltKey] !== null && lt[ltKey] !== undefined) {
                            formData.append(`layout_types[${index}][${ltKey}]`, lt[ltKey]);
                        }
                    });
                });
            } else if (key === 'thumbnail' && campaignData[key] instanceof File) {
```

- [ ] **Step 3: Add the same `layout_types` branch to `updateCampaign`**

Apply the identical replacement (Step 2) inside `updateCampaign`'s `forEach` loop (same original code block exists there).

- [ ] **Step 4: Add the 4 layout-image helpers**

Add immediately after the `updateCampaign` function (mirrors `uploadProductPhotos`'s inline-Bearer multipart pattern; endpoints are the B1 routes):
```ts
export const uploadCampaignLayoutTypeRentalProjection = async (layoutTypeId: number | string, file: File) => {
    const formData = new FormData();
    formData.append('rental_projection', file);
    const response = await axios.post(`${API_URL}campaign-layout-types/${layoutTypeId}/rental-projection`, formData, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const deleteCampaignLayoutTypeRentalProjection = async (layoutTypeId: number | string) => {
    const response = await axios.delete(`${API_URL}campaign-layout-types/${layoutTypeId}/rental-projection`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    });
    return response.data;
};

export const uploadCampaignLayoutTypeRenderings = async (layoutTypeId: number | string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('rendering_images[]', file));
    const response = await axios.post(`${API_URL}campaign-layout-types/${layoutTypeId}/renderings`, formData, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const deleteCampaignLayoutTypeRendering = async (layoutTypeId: number | string, path: string) => {
    const response = await axios.delete(`${API_URL}campaign-layout-types/${layoutTypeId}/renderings`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        data: { path },
    });
    return response.data;
};
```

- [ ] **Step 5: Verify**
```bash
cd /home/ubuntu/projects/old/RenoXpert-Frontend-v2.1
npm run build
npx eslint src/types/index.ts --ext ts,tsx --max-warnings 0   # must be clean (types file is clean at baseline)
echo "api.ts count: $(npx eslint src/services/api.ts --ext ts,tsx --format unix 2>/dev/null | grep -c 'api\.ts:')  (baseline 17)"
```
Expected: build exit 0; types/index.ts clean; api.ts count unchanged (17).

- [ ] **Step 6: Commit**
```bash
git add src/types/index.ts src/services/api.ts
git commit -m "feat(campaign): layout_types in campaign payload + layout image api helpers (B2)"
```
(Append trailers.)

---

### Task 2: AddCampaign — nested Layout Type UI + two-step image upload

**Files:** Modify `src/pages/Campaign/AddCampaign.tsx`.
**This is a guided refactor — READ these regions first (from the B2 mapping):** state 29–59; addPackage 191–221; removePackage 223–243; updatePackage 245–260; handleModeChange 262–270; packages section JSX 839–1242 (package map; per-package fields; template-order search 878–945); handleSubmit 404–465 (campaignData 436–442; create+post-create 444–458); campaign-mode UI 1251–1316.

**Interfaces consumed:** Task 1's types + api helpers (`uploadCampaignLayoutTypeRentalProjection`, `uploadCampaignLayoutTypeRenderings`).

- [ ] **Step 1: Imports + state**

Import the api helpers and the `CampaignLayoutType` type. Add state after the existing package-related `useState`s (after line ~59):
```tsx
    const [useLayoutTypes, setUseLayoutTypes] = useState<boolean>(false);
    const [layoutTypes, setLayoutTypes] = useState<{ id?: number | string; name: string; description?: string }[]>([]);
    const [packageLayoutIndex, setPackageLayoutIndex] = useState<Record<number, number>>({});
    const [layoutProjectionFile, setLayoutProjectionFile] = useState<Record<number, File>>({});
    const [layoutRenderingFiles, setLayoutRenderingFiles] = useState<Record<number, File[]>>({});
    const [layoutError, setLayoutError] = useState<string | null>(null);
```

- [ ] **Step 2: Layout helpers**

Add near the package helpers:
```tsx
    const addLayoutType = () => {
        setLayoutTypes(prev => [...prev, { name: '', description: '' }]);
    };

    const updateLayoutType = (idx: number, field: 'name' | 'description', value: string) => {
        setLayoutTypes(prev => prev.map((lt, i) => (i === idx ? { ...lt, [field]: value } : lt)));
    };

    const removeLayoutType = (idx: number) => {
        // remove the layout's sub-packages, then the layout; reindex packageLayoutIndex
        const pkgIdxToRemove = Object.entries(packageLayoutIndex)
            .filter(([, lIdx]) => lIdx === idx)
            .map(([pIdx]) => Number(pIdx))
            .sort((a, b) => b - a);
        pkgIdxToRemove.forEach(p => removePackage(p));
        setLayoutTypes(prev => prev.filter((_, i) => i !== idx));
        setPackageLayoutIndex(prev => {
            const next: Record<number, number> = {};
            Object.entries(prev).forEach(([pIdx, lIdx]) => {
                if (lIdx === idx) return;
                next[Number(pIdx)] = lIdx > idx ? lIdx - 1 : lIdx;
            });
            return next;
        });
        setLayoutProjectionFile(prev => { const n = { ...prev }; delete n[idx]; return n; });
        setLayoutRenderingFiles(prev => { const n = { ...prev }; delete n[idx]; return n; });
    };

    const addSubPackage = (layoutIdx: number) => {
        const newPkgIndex = packages.length;
        addPackage();
        setPackageLayoutIndex(prev => ({ ...prev, [newPkgIndex]: layoutIdx }));
    };

    const handleLayoutProjectionChange = (layoutIdx: number, file: File | null) => {
        setLayoutError(null);
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { setLayoutError('Image must be 10MB or smaller.'); return; }
        setLayoutProjectionFile(prev => ({ ...prev, [layoutIdx]: file }));
    };

    const handleLayoutRenderingsChange = (layoutIdx: number, files: FileList | null) => {
        setLayoutError(null);
        if (!files || !files.length) return;
        const arr = Array.from(files);
        if (arr.some(f => f.size > 10 * 1024 * 1024)) { setLayoutError('Each image must be 10MB or smaller.'); return; }
        setLayoutRenderingFiles(prev => ({ ...prev, [layoutIdx]: [...(prev[layoutIdx] || []), ...arr] }));
    };
```

- [ ] **Step 3: The "Use layout types" toggle**

Inside the packages area (rendered when `campaignMode === 'packages'`), add a toggle bound to `useLayoutTypes`/`setUseLayoutTypes`, labeled "Use layout types", with a one-line helper ("Group packages under layout types, each with its own renderings & rental projection."). Place it above the package list.

- [ ] **Step 4: Render the nested layout UI when `useLayoutTypes`**

When `useLayoutTypes` is true, replace the flat package list render with: an **"Add Layout Type"** button + `layoutTypes.map((lt, layoutIdx) => ...)`. Each layout section renders:
- Name + Description inputs (bound via `updateLayoutType`), and a Remove-layout button (`removeLayoutType(layoutIdx)`, with a window.confirm).
- Rental Projection uploader: `<input type="file" accept="image/*" onChange={e => handleLayoutProjectionChange(layoutIdx, e.target.files?.[0] ?? null)} />` + the selected filename (from `layoutProjectionFile[layoutIdx]`) with a clear button.
- Renderings uploader: `<input type="file" accept="image/*" multiple onChange={e => handleLayoutRenderingsChange(layoutIdx, e.target.files)} />` + the selected files list (from `layoutRenderingFiles[layoutIdx]`) each removable.
- This layout's sub-packages: render the EXISTING per-package card JSX for each `pkg`/`index` where `packageLayoutIndex[index] === layoutIdx` (reuse the current package card markup verbatim, including the template-order search and fixed/custom toggles), plus an **"Add sub-package"** button → `addSubPackage(layoutIdx)`.
- A small note "MP4/PNG/JPG up to 10MB · images upload after the campaign is created" and `{layoutError && <p className="text-sm text-red-600">{layoutError}</p>}`.

When `useLayoutTypes` is false, render the existing flat package list unchanged.

(Implementer: extract the current per-package card JSX into a small local render — e.g. `const renderPackageCard = (pkg, index) => (...)` — reusing the exact existing markup, then call it both in the flat list and inside each layout section. This avoids duplicating the ~350-line card block.)

- [ ] **Step 5: Thread layout data into handleSubmit + two-step image upload**

In `handleSubmit`, after `processedPackages` is built and before `createCampaign`, when `useLayoutTypes`:
- set each processed package's `layout_type_index = packageLayoutIndex[originalIndex]` (map by the package's index in `packages`).
- add `campaignData.layout_types = layoutTypes.map((lt, i) => ({ name: lt.name, description: lt.description ?? '', sort: i }))`.
Then after `const created = await createCampaign(campaignData);` and the existing video upload, add:
```tsx
            if (useLayoutTypes && created?.data?.layout_types?.length) {
                try {
                    for (let i = 0; i < created.data.layout_types.length; i++) {
                        const layoutId = created.data.layout_types[i]?.id;
                        if (!layoutId) continue;
                        if (layoutProjectionFile[i]) {
                            await uploadCampaignLayoutTypeRentalProjection(layoutId, layoutProjectionFile[i]);
                        }
                        if (layoutRenderingFiles[i]?.length) {
                            await uploadCampaignLayoutTypeRenderings(layoutId, layoutRenderingFiles[i]);
                        }
                    }
                } catch (imgErr) {
                    console.error('Layout image upload failed:', imgErr);
                    setError('Campaign created, but some layout images failed to upload — add them from Edit.');
                }
            }
```
(Keep the existing navigate after.)

- [ ] **Step 6: Verify**
```bash
npm run build
echo "AddCampaign count: $(npx eslint src/pages/Campaign/AddCampaign.tsx --ext ts,tsx --format unix 2>/dev/null | grep -c AddCampaign)  (baseline 2)"
```
Expected: build exit 0; AddCampaign eslint count = 2 (no new errors). Then manual: toggle on → add 2 layouts with images + sub-packages → create → (with API) layouts + images persist; toggle off → unchanged flat create.

- [ ] **Step 7: Commit**
```bash
git add src/pages/Campaign/AddCampaign.tsx
git commit -m "feat(campaign): manage layout types + sub-packages in AddCampaign (B2)"
```
(Append trailers.)

---

### Task 3: EditCampaign — nested Layout Type UI + immediate image upload + load existing

**Files:** Modify `src/pages/Campaign/EditCampaign.tsx`.
**Guided refactor — READ first:** state 26–64; load effect 82–124 (packages load 100–122); packages section JSX 882–1332 (template search 966–1032; insert layout selector context after 1032); handleSubmit 458–511 (processedPackages 470–491; campaignData 493–499; updateCampaign 501).

**Interfaces consumed:** Task 1's types + ALL 4 api helpers (Edit can upload/replace/remove immediately).

- [ ] **Step 1: Imports + state**

Import the 4 api helpers + `CampaignLayoutType`. Add state after the existing package-related `useState`s (after line ~63):
```tsx
    const [useLayoutTypes, setUseLayoutTypes] = useState<boolean>(false);
    const [layoutTypes, setLayoutTypes] = useState<{ id?: number | string; name: string; description?: string }[]>([]);
    const [packageLayoutIndex, setPackageLayoutIndex] = useState<Record<number, number>>({});
    const [layoutProjectionUrl, setLayoutProjectionUrl] = useState<Record<number, string | null>>({});
    const [layoutRenderingImgs, setLayoutRenderingImgs] = useState<Record<number, { file_url?: string; path?: string }[]>>({});
    const [layoutUploading, setLayoutUploading] = useState<Record<number, boolean>>({});
    const [layoutError, setLayoutError] = useState<string | null>(null);
```

- [ ] **Step 2: Load existing layout types in the campaign-load effect**

In the `if (campaign) { ... }` block, after the existing package-load (`setPackageValueSources(...)`, ~line 122), add (NOTE: images come from `campaign.layout_types`, NOT packages):
```tsx
            if (campaign.layout_types && campaign.layout_types.length > 0) {
                setUseLayoutTypes(true);
                setLayoutTypes(campaign.layout_types.map(lt => ({ id: lt.id, name: lt.name || '', description: lt.description || '' })));
                const projUrls: Record<number, string | null> = {};
                const renderImgs: Record<number, { file_url?: string; path?: string }[]> = {};
                campaign.layout_types.forEach((lt, i) => {
                    projUrls[i] = (lt.rental_projection as Attachment | null)?.file_url ?? null;
                    renderImgs[i] = (lt.rendering_images as Attachment[] | null)?.map(r => ({ file_url: r.file_url, path: (r as any).path })) ?? [];
                });
                setLayoutProjectionUrl(projUrls);
                setLayoutRenderingImgs(renderImgs);
                // map each loaded package to its layout index by matching layout_type_id
                const idToIndex: Record<string, number> = {};
                campaign.layout_types.forEach((lt, i) => { if (lt.id != null) idToIndex[String(lt.id)] = i; });
                const pkgLayout: Record<number, number> = {};
                (campaign.packages || []).forEach((pkg, pIdx) => {
                    if (pkg.layout_type_id != null && idToIndex[String(pkg.layout_type_id)] !== undefined) {
                        pkgLayout[pIdx] = idToIndex[String(pkg.layout_type_id)];
                    }
                });
                setPackageLayoutIndex(pkgLayout);
            }
```
(Ensure `Attachment` is imported.)

- [ ] **Step 3: Layout helpers (with immediate upload/remove)**

Add `addLayoutType`, `updateLayoutType`, `addSubPackage` (same as Task 2 Step 2). `removeLayoutType` mirrors Task 2 but also reindexes `layoutProjectionUrl`/`layoutRenderingImgs`. Add immediate image handlers that call the API when the layout has an id (existing), else hold for the post-save two-step (new layouts in edit):
```tsx
    const handleEditLayoutProjection = async (layoutIdx: number, file: File | null) => {
        setLayoutError(null);
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { setLayoutError('Image must be 10MB or smaller.'); return; }
        const layoutId = layoutTypes[layoutIdx]?.id;
        if (!layoutId) { setLayoutError('Save the campaign first, then upload images for newly added layouts.'); return; }
        setLayoutUploading(prev => ({ ...prev, [layoutIdx]: true }));
        try {
            const res = await uploadCampaignLayoutTypeRentalProjection(layoutId, file);
            setLayoutProjectionUrl(prev => ({ ...prev, [layoutIdx]: res?.data?.rental_projection?.file_url ?? null }));
        } catch (e) { console.error(e); setLayoutError('Upload failed.'); }
        finally { setLayoutUploading(prev => ({ ...prev, [layoutIdx]: false })); }
    };

    const handleEditLayoutRenderings = async (layoutIdx: number, files: FileList | null) => {
        setLayoutError(null);
        if (!files || !files.length) return;
        const arr = Array.from(files);
        if (arr.some(f => f.size > 10 * 1024 * 1024)) { setLayoutError('Each image must be 10MB or smaller.'); return; }
        const layoutId = layoutTypes[layoutIdx]?.id;
        if (!layoutId) { setLayoutError('Save the campaign first, then upload images for newly added layouts.'); return; }
        setLayoutUploading(prev => ({ ...prev, [layoutIdx]: true }));
        try {
            const res = await uploadCampaignLayoutTypeRenderings(layoutId, arr);
            setLayoutRenderingImgs(prev => ({ ...prev, [layoutIdx]: (res?.data?.rendering_images ?? []).map((r: any) => ({ file_url: r.file_url, path: r.path })) }));
        } catch (e) { console.error(e); setLayoutError('Upload failed.'); }
        finally { setLayoutUploading(prev => ({ ...prev, [layoutIdx]: false })); }
    };

    const handleEditRemoveProjection = async (layoutIdx: number) => {
        const layoutId = layoutTypes[layoutIdx]?.id;
        if (!layoutId) return;
        setLayoutUploading(prev => ({ ...prev, [layoutIdx]: true }));
        try { await deleteCampaignLayoutTypeRentalProjection(layoutId); setLayoutProjectionUrl(prev => ({ ...prev, [layoutIdx]: null })); }
        catch (e) { console.error(e); setLayoutError('Remove failed.'); }
        finally { setLayoutUploading(prev => ({ ...prev, [layoutIdx]: false })); }
    };

    const handleEditRemoveRendering = async (layoutIdx: number, path: string) => {
        const layoutId = layoutTypes[layoutIdx]?.id;
        if (!layoutId || !path) return;
        setLayoutUploading(prev => ({ ...prev, [layoutIdx]: true }));
        try { const res = await deleteCampaignLayoutTypeRendering(layoutId, path); setLayoutRenderingImgs(prev => ({ ...prev, [layoutIdx]: (res?.data?.rendering_images ?? []).map((r: any) => ({ file_url: r.file_url, path: r.path })) })); }
        catch (e) { console.error(e); setLayoutError('Remove failed.'); }
        finally { setLayoutUploading(prev => ({ ...prev, [layoutIdx]: false })); }
    };
```

- [ ] **Step 4: Toggle + nested UI**

Same as Task 2 Steps 3–4 (toggle + "Add Layout Type" + per-layout sections + grouped sub-packages via `packageLayoutIndex` + "Add sub-package"), but the image controls use the Edit handlers and display existing images from `layoutProjectionUrl`/`layoutRenderingImgs` (with remove buttons + an uploading spinner from `layoutUploading[idx]`). Use the same `renderPackageCard(pkg, index)` extraction approach to avoid duplicating the package-card block.

- [ ] **Step 5: Thread layout data into handleSubmit**

In `handleSubmit`, when `useLayoutTypes`: set each processed package's `layout_type_index = packageLayoutIndex[origIndex]` and `layout_type_id` if its layout has an existing id (`layoutTypes[packageLayoutIndex[origIndex]]?.id`); add `campaignData.layout_types = layoutTypes.map((lt, i) => ({ id: lt.id, name: lt.name, description: lt.description ?? '', sort: i }))`. After `updateCampaign` returns, for any NEW layout (no prior id) that has pending images, mirror the Add two-step using the returned `data.layout_types[]` ids. (If you chose to block image upload on new edit-layouts until save — per Step 3's guard — do the post-save upload here.)

- [ ] **Step 6: Verify**
```bash
npm run build
echo "EditCampaign count: $(npx eslint src/pages/Campaign/EditCampaign.tsx --ext ts,tsx --format unix 2>/dev/null | grep -c EditCampaign)  (baseline 2)"
```
Expected: build exit 0; EditCampaign eslint count = 2. Manual: open a layered campaign → layouts/images/sub-packages load grouped; upload/replace/remove images immediately; add a layout + sub-package, save, reload → persists; a flat campaign loads with toggle off, unchanged.

- [ ] **Step 7: Commit**
```bash
git add src/pages/Campaign/EditCampaign.tsx
git commit -m "feat(campaign): manage layout types + sub-packages in EditCampaign (B2)"
```
(Append trailers.)

---

### Task 4: Full verification & finalize

- [ ] **Step 1: Build + scoped lint (no new errors)**
```bash
npm run build
npx eslint src/types/index.ts --ext ts,tsx --max-warnings 0
echo "api.ts: $(npx eslint src/services/api.ts --ext ts,tsx --format unix 2>/dev/null | grep -c 'api\.ts:') (17); Add: $(npx eslint src/pages/Campaign/AddCampaign.tsx --ext ts,tsx --format unix 2>/dev/null | grep -c AddCampaign) (2); Edit: $(npx eslint src/pages/Campaign/EditCampaign.tsx --ext ts,tsx --format unix 2>/dev/null | grep -c EditCampaign) (2)"
```
Expected: build 0; counts unchanged.

- [ ] **Step 2: Manual QA matrix** (needs B1 merged + migrated + API): add/edit layered campaigns (layouts, images via two-step on add + immediate on edit, sub-packages grouped, remove layout removes its sub-packages); flat campaigns unchanged (toggle off); the public landing (after B3) groups by the assigned `layout_type_id`.

- [ ] **Step 3: Finalize** via `superpowers:finishing-a-development-branch` for `feature/layout-type-admin` (base `production`; FE production is not protected → merge + push, or PR).

---

## Self-Review

**Spec coverage:** spec §2 types+api → Task 1; §4/§5/§6/§7 AddCampaign → Task 2; same for EditCampaign + §2 load → Task 3; §9 verification → per-task gates + Task 4. The toggle (§3), nested grouping via `packageLayoutIndex` (§3), two-step Add / immediate Edit image upload (§ constraints), and images-on-layout-type (not packages) are all encoded. All B2 spec items map to a task.

**Placeholder scan:** Task 1 + all new state/helpers/api/submit code are literal. Tasks 2/3 are explicitly flagged guided refactors: the new building blocks (state, helpers, api calls, submit threading, two-step upload) are complete literal code; the per-form JSX integration (toggle placement, layout-section markup, grouping the existing package cards via `renderPackageCard`) is described with exact line-range anchors to read — appropriate for a refactor of two 1300-line files where reproducing the full existing JSX verbatim is infeasible. Not vague TODOs.

**Type/shape consistency:** `CampaignLayoutType`, `Campaign.layout_types`, `CampaignPackage.layout_type_id`/`layout_type_index` (Task 1) are used in Tasks 2–3. The 4 api helpers' signatures match their call sites. `layout_types` payload shape `{id?,name,description,sort}` + package `layout_type_index`/`layout_type_id` matches the B1 contract. Image response reads `res.data.rental_projection.file_url` / `res.data.rendering_images[]` matching B1's `CampaignLayoutTypeResource`. `packageLayoutIndex` keying (packageIndex → layoutIndex) is consistent across add/remove/submit in both forms.
