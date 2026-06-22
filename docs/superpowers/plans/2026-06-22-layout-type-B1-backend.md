# Layout Type System — Phase B1 (Backend / API) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the backend data model + API for an optional Layout Type layer above campaign packages — a `campaign_layout_types` table, `layout_type_id` on `campaign_packages`, nested layout-type create/sync in `CampaignController`, image upload endpoints, and resource serialization — so the admin (B2) and public (B3) phases have an API to build against.

**Architecture:** Two authored-but-unrun Laravel migrations (new table + additive nullable column). A `CampaignLayoutType` model (campaign hasMany; layout hasMany packages). `CampaignController` store()/update() accept a nested `layout_types` array (create/sync mirroring the existing package flow) and thread `layout_type_id` onto packages via an index map. A new `CampaignLayoutTypeController` handles JSON-column image uploads (rental projection single + renderings many) mirroring the thumbnail/products S3 pattern. Resources expose `layout_types` (with images) and `layout_type_id`; packages stay a flat array (frontend groups them). All backward-compatible: flat campaigns send no `layout_types` and null `layout_type_id`.

**Tech Stack:** Laravel 11 / PHP 8.2 / S3 (flysystem). Repo: `/home/ubuntu/projects/old/RenoXpert-Backend`.

## Global Constraints

- **Migrations are AUTHORED but NOT run by us.** The user runs `php artisan migrate`. New table = `Schema::create`; the FK column = additive `Schema::table` ALTER. The base campaign tables are not in migrations → never `migrate:fresh`. See [[renoxpert-backend-schema-unmanaged]].
- **`layout_type_id` is a plain nullable `unsignedBigInteger` column with an index — NO database-level foreign-key constraint** (consistent with how the out-of-band campaign tables are managed).
- **Backward-compatible:** flat campaigns (no `layout_types`, null `layout_type_id`) must behave exactly as today. The layout path is additive.
- **Mirror existing patterns:** layout create/sync mirrors the current package create/sync in `CampaignController`; image storage mirrors the thumbnail/`products.attachments` pattern — `Storage::disk('s3')->putFileAs($dir, $file, $name, 'public')`, store `['file_url' => config('filesystems.disks.s3.url').'/'.$path, 'path' => $path]`, delete old `path` on replace. Image validation: `image|mimes:jpeg,png,jpg,gif|max:10240`. Renderings dir: `campaigns/layout-types/{id}`.
- **Linking contract:** the frontend sends `layout_types: [{id?, name, description, sort}]` and each package carries `layout_type_index` (0-based position into the submitted `layout_types` array) and/or an existing `layout_type_id`. The controller resolves `layout_type_index` → the created/updated layout's DB id and sets `layout_type_id`. Index-based resolution works for both create and update.
- **Verification gate:** `php -l <file>` clean on every changed PHP file. **NOTE: `php` is currently NOT installed in this environment** → do a careful manual syntax review and say so; `php artisan route:list | grep layout` is best-effort. **NEVER run `php artisan migrate`.** No test runner — do not scaffold one.
- **Response style:** controllers use `$this->sendResponse($data, $msg)` / `$this->sendError($msg, $errors, $code)` (base `Controller`).
- **Co-author trailers:** end every commit message with the standard `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` and `Claude-Session:` lines.

---

### Task 0: Branches + commit design docs

**Files:** adds the B spec, this plan, and the mockup to git.

- [ ] **Step 1: Backend branch off production**
```bash
cd /home/ubuntu/projects/old/RenoXpert-Backend
git checkout production
git pull --ff-only 2>/dev/null || true
git checkout -b feature/layout-type-backend
```

- [ ] **Step 2: Commit the design docs in the frontend repo (on a branch)**
```bash
cd /home/ubuntu/projects/old/RenoXpert-Frontend-v2.1
git checkout production
git pull --ff-only
git checkout -b feature/layout-type-system
git add docs/superpowers/specs/2026-06-22-layout-type-system-design.md \
        docs/superpowers/plans/2026-06-22-layout-type-B1-backend.md \
        docs/superpowers/mockups/2026-06-22-layout-type-public.html
git commit -m "docs(campaign): layout type system spec, B1 plan, public mockup"
```
(Append the standard trailers.)

---

### Task 1: Migrations (authored, NOT run)

**Files:**
- Create: `RenoXpert-Backend/database/migrations/2026_06_22_010000_create_campaign_layout_types_table.php`
- Create: `RenoXpert-Backend/database/migrations/2026_06_22_010100_add_layout_type_id_to_campaign_packages_table.php`

**Interfaces:** Produces the `campaign_layout_types` table and `campaign_packages.layout_type_id` (applied by the user). Consumed by Tasks 2–5.

- [ ] **Step 1: Create the layout types table migration**
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('campaign_layout_types', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('campaign_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('sort')->default(0);
            $table->json('rental_projection')->nullable();
            $table->json('rendering_images')->nullable();
            $table->json('metadata')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->softDeletes();
            $table->timestamps();
            $table->index('campaign_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_layout_types');
    }
};
```

- [ ] **Step 2: Create the `layout_type_id` column migration**
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('campaign_packages', function (Blueprint $table) {
            $table->unsignedBigInteger('layout_type_id')->nullable()->after('campaign_id');
            $table->index('layout_type_id');
        });
    }

    public function down(): void
    {
        Schema::table('campaign_packages', function (Blueprint $table) {
            $table->dropIndex(['layout_type_id']);
            $table->dropColumn('layout_type_id');
        });
    }
};
```

- [ ] **Step 3: Verify (do NOT run migrate)**
```bash
cd /home/ubuntu/projects/old/RenoXpert-Backend
php -l database/migrations/2026_06_22_010000_create_campaign_layout_types_table.php 2>/dev/null || echo "php unavailable — manual review"
php -l database/migrations/2026_06_22_010100_add_layout_type_id_to_campaign_packages_table.php 2>/dev/null || echo "php unavailable — manual review"
```
Expected: "No syntax errors detected" each (or manual review if php absent). Do NOT run `php artisan migrate`.

- [ ] **Step 4: Commit**
```bash
git add database/migrations/2026_06_22_010000_create_campaign_layout_types_table.php database/migrations/2026_06_22_010100_add_layout_type_id_to_campaign_packages_table.php
git commit -m "feat(campaign): layout type table + layout_type_id migrations (H2)"
```
(Append trailers; note in the body the migrations must be run manually by the user.)

---

### Task 2: Models

**Files:**
- Create: `RenoXpert-Backend/app/Models/CampaignLayoutType.php`
- Modify: `RenoXpert-Backend/app/Models/Campaign.php` (add `layoutTypes()` after the `packages()` relation)
- Modify: `RenoXpert-Backend/app/Models/CampaignPackage.php` (add `layout_type_id` to `$fillable` after `'campaign_id',`; add `layoutType()` relation)

**Interfaces:** Produces `Campaign->layoutTypes()`, `CampaignLayoutType` (with `packages()`), `CampaignPackage->layoutType()` + fillable `layout_type_id`. Consumed by Tasks 3–5.

- [ ] **Step 1: Create the `CampaignLayoutType` model**
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class CampaignLayoutType extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'campaign_id',
        'name',
        'description',
        'sort',
        'rental_projection',
        'rendering_images',
        'metadata',
        'created_by',
        'updated_by',
        'deleted_at',
    ];

    protected $casts = [
        'rental_projection' => 'array',
        'rendering_images' => 'array',
        'metadata' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            $model->created_by = auth()->id();
        });
    }

    public function campaign()
    {
        return $this->belongsTo(Campaign::class, 'campaign_id', 'id');
    }

    public function packages()
    {
        return $this->hasMany(CampaignPackage::class, 'layout_type_id', 'id');
    }
}
```

- [ ] **Step 2: Add `layoutTypes()` to the Campaign model**

In `app/Models/Campaign.php`, find the `packages()` relation:
```php
    public function packages()
    {
        return $this->hasMany(CampaignPackage::class, 'campaign_id', 'id');
    }
```
Add immediately after it:
```php

    public function layoutTypes()
    {
        return $this->hasMany(CampaignLayoutType::class, 'campaign_id', 'id');
    }
```

- [ ] **Step 3: Add `layout_type_id` to CampaignPackage fillable + the relation**

In `app/Models/CampaignPackage.php`, find `'campaign_id',` in `$fillable` and add below it:
```php
        'campaign_id',
        'layout_type_id',
```
Then find the `order()` relation:
```php
    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id', 'id');
    }
```
Add immediately after it:
```php

    public function layoutType()
    {
        return $this->belongsTo(CampaignLayoutType::class, 'layout_type_id', 'id');
    }
```

- [ ] **Step 4: Verify**
```bash
cd /home/ubuntu/projects/old/RenoXpert-Backend
for f in app/Models/CampaignLayoutType.php app/Models/Campaign.php app/Models/CampaignPackage.php; do php -l "$f" 2>/dev/null || echo "php unavailable ($f) — manual review"; done
```
Expected: clean (or manual review). 

- [ ] **Step 5: Commit**
```bash
git add app/Models/CampaignLayoutType.php app/Models/Campaign.php app/Models/CampaignPackage.php
git commit -m "feat(campaign): CampaignLayoutType model + relations (H2)"
```

---

### Task 3: CampaignController — nested layout_types create/sync + layout_type_id threading

**Files:**
- Modify: `RenoXpert-Backend/app/Http/Controllers/CampaignController.php` (store() validation ~lines 98–118, store() package create loop ~lines 179–184; update() validation ~lines 208–230, update() package sync ~lines 276–308)

**Interfaces:** Consumes the models (Task 2). Produces: store/update accept `layout_types: [{id?, name, description, sort}]` and `packages.*.layout_type_index` / `packages.*.layout_type_id`, persisting layout types and threading `layout_type_id` onto packages.

- [ ] **Step 1: store() — add layout_types + package layout validation**

In `store()`, find the package validation lines:
```php
                'packages' => 'required|array',
                'packages.*.name' => 'required|string|max:255',
```
Insert the layout rules before `'packages' => 'required|array',`:
```php
                'layout_types' => 'nullable|array',
                'layout_types.*.name' => 'required|string|max:255',
                'layout_types.*.description' => 'nullable|string',
                'layout_types.*.sort' => 'nullable|integer',
                'packages' => 'required|array',
                'packages.*.layout_type_index' => 'nullable|integer',
                'packages.*.name' => 'required|string|max:255',
```

- [ ] **Step 2: store() — create layout types then thread onto packages**

Find the campaign + package creation block:
```php
            $campaign = Campaign::create($validatedData);

            // Create packages
            foreach ($input['packages'] as $package) {
                $campaign->packages()->create($package);
            }
```
Replace with:
```php
            $campaign = Campaign::create($validatedData);

            // Create layout types (optional) and map input index -> new id
            $layoutIdByIndex = [];
            if (!empty($input['layout_types']) && is_array($input['layout_types'])) {
                foreach ($input['layout_types'] as $idx => $layoutType) {
                    $createdLayout = $campaign->layoutTypes()->create([
                        'name' => $layoutType['name'],
                        'description' => $layoutType['description'] ?? null,
                        'sort' => $layoutType['sort'] ?? $idx,
                    ]);
                    $layoutIdByIndex[$idx] = $createdLayout->id;
                }
            }

            // Create packages, threading layout_type_id from layout_type_index
            foreach ($input['packages'] as $package) {
                if (isset($package['layout_type_index']) && isset($layoutIdByIndex[$package['layout_type_index']])) {
                    $package['layout_type_id'] = $layoutIdByIndex[$package['layout_type_index']];
                }
                unset($package['layout_type_index']);
                $campaign->packages()->create($package);
            }
```

- [ ] **Step 3: update() — add layout_types + package layout validation**

In `update()`, find:
```php
                'packages' => 'nullable|array',
                'packages.*.id' => 'nullable|integer|exists:campaign_packages,id',
                'packages.*.name' => 'required|string|max:255',
```
Insert the layout rules before `'packages' => 'nullable|array',`:
```php
                'layout_types' => 'nullable|array',
                'layout_types.*.id' => 'nullable|integer|exists:campaign_layout_types,id',
                'layout_types.*.name' => 'required|string|max:255',
                'layout_types.*.description' => 'nullable|string',
                'layout_types.*.sort' => 'nullable|integer',
                'packages' => 'nullable|array',
                'packages.*.id' => 'nullable|integer|exists:campaign_packages,id',
                'packages.*.layout_type_id' => 'nullable|integer',
                'packages.*.layout_type_index' => 'nullable|integer',
                'packages.*.name' => 'required|string|max:255',
```

- [ ] **Step 4: update() — sync layout types before packages, then thread onto packages**

Find the start of the package-sync block inside the transaction:
```php
                // Handle packages update
                if (isset($validatedData['packages'])) {
                    $inputPackages = $validatedData['packages'];
```
Insert the layout-sync block immediately before `// Handle packages update`:
```php
                // Sync layout types (optional); map input index -> resolved id
                $layoutIdByIndex = [];
                if ($request->has('layout_types')) {
                    $inputLayouts = $request->input('layout_types', []);
                    $existingLayoutIds = $campaign->layoutTypes()->pluck('id')->toArray();
                    $inputLayoutIds = collect($inputLayouts)->pluck('id')->filter()->toArray();

                    $layoutsToDelete = array_diff($existingLayoutIds, $inputLayoutIds);
                    if (!empty($layoutsToDelete)) {
                        $campaign->layoutTypes()->whereIn('id', $layoutsToDelete)->delete();
                    }

                    foreach ($inputLayouts as $idx => $layoutType) {
                        if (!empty($layoutType['id'])) {
                            $layout = $campaign->layoutTypes()->find($layoutType['id']);
                            if ($layout) {
                                $layout->update([
                                    'name' => $layoutType['name'],
                                    'description' => $layoutType['description'] ?? null,
                                    'sort' => $layoutType['sort'] ?? $idx,
                                ]);
                                $layoutIdByIndex[$idx] = $layout->id;
                            }
                        } else {
                            $createdLayout = $campaign->layoutTypes()->create([
                                'name' => $layoutType['name'],
                                'description' => $layoutType['description'] ?? null,
                                'sort' => $layoutType['sort'] ?? $idx,
                            ]);
                            $layoutIdByIndex[$idx] = $createdLayout->id;
                        }
                    }
                }

                // Handle packages update
```
Then, still in update(), find BOTH package branches and thread the layout id. Find the update-existing branch:
```php
                        if (isset($packageData['id']) && $packageData['id']) {
                            // Update existing package
                            $package = $campaign->packages()->find($packageData['id']);
                            if ($package) {
                                // Calculate slot_remaining for package
                                $packageData['slot_remaining'] = $packageData['slot_total'] - $package->slot_used;
                                $package->update($packageData);
                            }
                        } else {
                            // Create new package
                            $packageData['campaign_id'] = $campaign->id;
```
Replace it with (resolves layout_type_index → id before both update and create; preserves all existing logic):
```php
                        if (isset($packageData['layout_type_index']) && isset($layoutIdByIndex[$packageData['layout_type_index']])) {
                            $packageData['layout_type_id'] = $layoutIdByIndex[$packageData['layout_type_index']];
                        }
                        unset($packageData['layout_type_index']);

                        if (isset($packageData['id']) && $packageData['id']) {
                            // Update existing package
                            $package = $campaign->packages()->find($packageData['id']);
                            if ($package) {
                                // Calculate slot_remaining for package
                                $packageData['slot_remaining'] = $packageData['slot_total'] - $package->slot_used;
                                $package->update($packageData);
                            }
                        } else {
                            // Create new package
                            $packageData['campaign_id'] = $campaign->id;
```

- [ ] **Step 5: Verify**
```bash
cd /home/ubuntu/projects/old/RenoXpert-Backend
php -l app/Http/Controllers/CampaignController.php 2>/dev/null || echo "php unavailable — manual review (balanced braces, both store & update edits, transaction intact)"
```
Expected: clean (or careful manual review).

- [ ] **Step 6: Commit**
```bash
git add app/Http/Controllers/CampaignController.php
git commit -m "feat(campaign): nested layout types create/sync + layout_type_id threading (H2)"
```

---

### Task 4: CampaignLayoutTypeController + image routes

**Files:**
- Create: `RenoXpert-Backend/app/Http/Controllers/CampaignLayoutTypeController.php`
- Modify: `RenoXpert-Backend/routes/api.php` (add 4 routes inside the `auth:sanctum` group, after the existing `campaigns/{id}/thumbnail-video` routes)

**Interfaces:** Consumes `CampaignLayoutType` (Task 2) and `CampaignLayoutTypeResource` (Task 5 — import it; if Task 5 not yet done, the controller still parses, but do Task 5 before manual smoke). Produces 4 endpoints for layout images.

- [ ] **Step 1: Create the controller**
```php
<?php

namespace App\Http\Controllers;

use App\Models\CampaignLayoutType;
use App\Http\Resources\CampaignLayoutTypeResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class CampaignLayoutTypeController extends Controller
{
    public function uploadRentalProjection(Request $request, $id)
    {
        try {
            $layout = CampaignLayoutType::find($id);
            if (is_null($layout)) {
                return $this->sendError('Layout type not found.');
            }

            $validator = Validator::make($request->all(), [
                'rental_projection' => 'required|image|mimes:jpeg,png,jpg,gif|max:10240',
            ]);
            if ($validator->fails()) {
                return $this->sendError('Validation Error.', $validator->errors(), 422);
            }

            if ($layout->rental_projection && isset($layout->rental_projection['path'])) {
                Storage::disk('s3')->delete($layout->rental_projection['path']);
            }

            $file = $request->file('rental_projection');
            $directory = 'campaigns/layout-types/' . $layout->id;
            $filename = 'projection_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = Storage::disk('s3')->putFileAs($directory, $file, $filename, 'public');

            $layout->rental_projection = [
                'file_url' => config('filesystems.disks.s3.url') . '/' . $path,
                'path' => $path,
            ];
            $layout->save();

            return $this->sendResponse(new CampaignLayoutTypeResource($layout), 'Rental projection uploaded successfully.');
        } catch (\Exception $e) {
            Log::error('Rental projection upload failed', ['layout_type_id' => $id, 'error_message' => $e->getMessage(), 'error_line' => $e->getLine()]);
            return $this->sendError('Failed to upload rental projection.', [], 500);
        }
    }

    public function deleteRentalProjection($id)
    {
        try {
            $layout = CampaignLayoutType::find($id);
            if (is_null($layout)) {
                return $this->sendError('Layout type not found.');
            }
            if ($layout->rental_projection && isset($layout->rental_projection['path'])) {
                Storage::disk('s3')->delete($layout->rental_projection['path']);
            }
            $layout->rental_projection = null;
            $layout->save();

            return $this->sendResponse(new CampaignLayoutTypeResource($layout), 'Rental projection removed.');
        } catch (\Exception $e) {
            Log::error('Rental projection delete failed', ['layout_type_id' => $id, 'error_message' => $e->getMessage(), 'error_line' => $e->getLine()]);
            return $this->sendError('Failed to remove rental projection.', [], 500);
        }
    }

    public function uploadRenderings(Request $request, $id)
    {
        try {
            $layout = CampaignLayoutType::find($id);
            if (is_null($layout)) {
                return $this->sendError('Layout type not found.');
            }

            $validator = Validator::make($request->all(), [
                'rendering_images' => 'required|array',
                'rendering_images.*' => 'image|mimes:jpeg,png,jpg,gif|max:10240',
            ]);
            if ($validator->fails()) {
                return $this->sendError('Validation Error.', $validator->errors(), 422);
            }

            $existing = is_array($layout->rendering_images) ? $layout->rendering_images : [];
            $directory = 'campaigns/layout-types/' . $layout->id;
            foreach ($request->file('rendering_images') as $file) {
                $filename = 'rendering_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $path = Storage::disk('s3')->putFileAs($directory, $file, $filename, 'public');
                $existing[] = [
                    'file_url' => config('filesystems.disks.s3.url') . '/' . $path,
                    'path' => $path,
                ];
            }

            $layout->rendering_images = $existing;
            $layout->save();

            return $this->sendResponse(new CampaignLayoutTypeResource($layout), 'Renderings uploaded successfully.');
        } catch (\Exception $e) {
            Log::error('Renderings upload failed', ['layout_type_id' => $id, 'error_message' => $e->getMessage(), 'error_line' => $e->getLine()]);
            return $this->sendError('Failed to upload renderings.', [], 500);
        }
    }

    public function deleteRendering(Request $request, $id)
    {
        try {
            $layout = CampaignLayoutType::find($id);
            if (is_null($layout)) {
                return $this->sendError('Layout type not found.');
            }

            $validator = Validator::make($request->all(), [
                'path' => 'required|string',
            ]);
            if ($validator->fails()) {
                return $this->sendError('Validation Error.', $validator->errors(), 422);
            }

            $targetPath = $request->input('path');
            $existing = is_array($layout->rendering_images) ? $layout->rendering_images : [];
            $remaining = array_values(array_filter($existing, function ($img) use ($targetPath) {
                return ($img['path'] ?? null) !== $targetPath;
            }));

            Storage::disk('s3')->delete($targetPath);
            $layout->rendering_images = $remaining;
            $layout->save();

            return $this->sendResponse(new CampaignLayoutTypeResource($layout), 'Rendering removed.');
        } catch (\Exception $e) {
            Log::error('Rendering delete failed', ['layout_type_id' => $id, 'error_message' => $e->getMessage(), 'error_line' => $e->getLine()]);
            return $this->sendError('Failed to remove rendering.', [], 500);
        }
    }
}
```

- [ ] **Step 2: Add the routes**

In `routes/api.php`, find the thumbnail-video routes (added in Sub-project C, inside the `auth:sanctum` group):
```php
    Route::post('campaigns/{id}/thumbnail-video/upload', [CampaignController::class, 'uploadThumbnailVideo']);
    Route::delete('campaigns/{id}/thumbnail-video', [CampaignController::class, 'deleteThumbnailVideo']);
```
Add immediately after them:
```php
    Route::post('campaign-layout-types/{id}/rental-projection', [CampaignLayoutTypeController::class, 'uploadRentalProjection']);
    Route::delete('campaign-layout-types/{id}/rental-projection', [CampaignLayoutTypeController::class, 'deleteRentalProjection']);
    Route::post('campaign-layout-types/{id}/renderings', [CampaignLayoutTypeController::class, 'uploadRenderings']);
    Route::delete('campaign-layout-types/{id}/renderings', [CampaignLayoutTypeController::class, 'deleteRendering']);
```
Then ensure `use App\Http\Controllers\CampaignLayoutTypeController;` is present at the top of `routes/api.php` (add it near the other controller imports if the file uses explicit imports; if the file references controllers by FQN or already imports the controllers namespace, follow the file's existing convention).

- [ ] **Step 3: Verify**
```bash
cd /home/ubuntu/projects/old/RenoXpert-Backend
php -l app/Http/Controllers/CampaignLayoutTypeController.php 2>/dev/null || echo "php unavailable — manual review"
php -l routes/api.php 2>/dev/null || echo "php unavailable — manual review"
php artisan route:list 2>/dev/null | grep layout-types || echo "(route:list unavailable — verify routes by inspection: 4 routes inside auth:sanctum)"
```
Expected: clean (or manual review); 4 layout-types routes if route:list runs.

- [ ] **Step 4: Commit**
```bash
git add app/Http/Controllers/CampaignLayoutTypeController.php routes/api.php
git commit -m "feat(campaign): layout type image upload/delete endpoints (H5/H6)"
```

---

### Task 5: Resources

**Files:**
- Create: `RenoXpert-Backend/app/Http/Resources/CampaignLayoutTypeResource.php`
- Modify: `RenoXpert-Backend/app/Http/Resources/Campaign/CampaignResource.php` (add `layout_types`; load `layoutTypes` in `showPublic`)
- Modify: `RenoXpert-Backend/app/Http/Resources/CampaignPackageResource.php` (add `layout_type_id`)
- Modify: `RenoXpert-Backend/app/Http/Controllers/CampaignController.php` (`showPublic()` load)

**Interfaces:** Produces the public API shape consumed by B2/B3: `campaign.layout_types[] = {id, name, description, sort, rental_projection, rendering_images}` and `campaign.packages[].layout_type_id`.

- [ ] **Step 1: Create `CampaignLayoutTypeResource`**
```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CampaignLayoutTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'sort' => $this->sort,
            'rental_projection' => $this->rental_projection,
            'rendering_images' => $this->rendering_images,
        ];
    }
}
```

- [ ] **Step 2: Add `layout_types` to the public CampaignResource**

In `app/Http/Resources/Campaign/CampaignResource.php`, find the packages block:
```php
            'packages' => $this->whenLoaded('packages', function () {
                return CampaignPackageResource::collection($this->packages);
            }),
```
Add immediately after it:
```php
            'layout_types' => $this->whenLoaded('layoutTypes', function () {
                return CampaignLayoutTypeResource::collection($this->layoutTypes);
            }),
```
Ensure `use App\Http\Resources\CampaignLayoutTypeResource;` is imported at the top of this resource file (add it if absent).

- [ ] **Step 3: Add `layout_type_id` to CampaignPackageResource**

In `app/Http/Resources/CampaignPackageResource.php`, find:
```php
            'order_id' => $this->order_id,
```
Add immediately before it:
```php
            'layout_type_id' => $this->layout_type_id,
            'order_id' => $this->order_id,
```

- [ ] **Step 4: Load `layoutTypes` in showPublic()**

In `app/Http/Controllers/CampaignController.php`, locate the `showPublic()` method (handles `GET /public/campaigns/{id}`). It loads the campaign relations with `->load('packages.order')`. Change that call to also load layout types:
```php
$campaign->load(['packages.order', 'layoutTypes']);
```
(If `showPublic` uses a different load form such as eager `with(...)`, add `'layoutTypes'` to it consistently. Do not change the `store()`/`update()` return loads.)

- [ ] **Step 5: Verify**
```bash
cd /home/ubuntu/projects/old/RenoXpert-Backend
for f in app/Http/Resources/CampaignLayoutTypeResource.php app/Http/Resources/Campaign/CampaignResource.php app/Http/Resources/CampaignPackageResource.php app/Http/Controllers/CampaignController.php; do php -l "$f" 2>/dev/null || echo "php unavailable ($f) — manual review"; done
```
Expected: clean (or manual review).

- [ ] **Step 6: Commit**
```bash
git add app/Http/Resources/CampaignLayoutTypeResource.php app/Http/Resources/Campaign/CampaignResource.php app/Http/Resources/CampaignPackageResource.php app/Http/Controllers/CampaignController.php
git commit -m "feat(campaign): serialize layout_types + layout_type_id in public API (H2/H5/H6)"
```

---

### Task 6: Verification & finalize (PR)

**Files:** none (verification only).

- [ ] **Step 1: Syntax check all changed PHP**
```bash
cd /home/ubuntu/projects/old/RenoXpert-Backend
for f in $(git diff --name-only production...HEAD | grep '\.php$'); do php -l "$f" 2>/dev/null || echo "php unavailable ($f) — manual review"; done
```
Expected: clean for each (or manual review of each — balanced braces, valid namespaces, additive-only changes to store/update/resources).

- [ ] **Step 2: Route inspection**
```bash
php artisan route:list 2>/dev/null | grep -E 'layout-types|campaigns' || echo "(route:list unavailable — confirm by inspection that the 4 campaign-layout-types routes are inside the auth:sanctum group in routes/api.php)"
```

- [ ] **Step 3: Manual API smoke (after the USER runs `php artisan migrate`)**
- Apply both migrations (USER): `php artisan migrate`.
- Create a layered campaign via the admin API: `layout_types: [{name:'Type A',sort:0},{name:'Type B',sort:1}]`, `packages: [{...,layout_type_index:0}, {...,layout_type_index:1}]` → verify packages get the right `layout_type_id`.
- `GET /public/campaigns/{slug}` returns `layout_types[]` (with null images initially) and `packages[].layout_type_id`.
- Upload a rental projection + 2 renderings to a layout id → re-fetch shows them; delete a rendering by `path` → removed; replace projection → old S3 object deleted.
- Create a FLAT campaign (no `layout_types`, no `layout_type_index`) → behaves exactly as before; `layout_types: []`, packages `layout_type_id: null`.

- [ ] **Step 4: Finalize the branch (PR — production is protected)**

The backend `production` branch requires a PR (ruleset). Push the branch and open a PR:
```bash
git push -u origin feature/layout-type-backend
gh pr create --base production --head feature/layout-type-backend \
  --title "feat(campaign): Layout Type system — backend/API (B1)" \
  --body "Backend for the optional Layout Type layer (H2/H5/H6). New campaign_layout_types table + layout_type_id (migrations authored, RUN MANUALLY), nested layout create/sync in CampaignController, image endpoints, resource serialization. Spec: docs/superpowers/specs/2026-06-22-layout-type-system-design.md. ⚠️ Run \`php artisan migrate\` before deploy.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```
Also finalize the frontend docs branch (`feature/layout-type-system`) per `superpowers:finishing-a-development-branch` (it only holds docs — merge to production or keep for B3).

---

## Self-Review

**Spec coverage (B1 portion):** §4 data model → Task 1 (migrations) + Task 2 (models). §5 backend: migrations → Task 1; models/relations → Task 2; controller nested layout_types sync + layout_type_id threading → Task 3; CampaignLayoutTypeController image endpoints + routes → Task 4; resources (`CampaignLayoutTypeResource`, public `layout_types`, `layout_type_id`, showPublic load) → Task 5. §9 verification (backend) → per-task `php -l`/manual + Task 6. Admin (§6) and public (§7/§8) are B2/B3 — out of scope here. All B1 spec items map to a task.

**Placeholder scan:** no TBD/TODO. New files (migrations, model, controller, resource) are complete; modifications quote exact before/after anchors. The `showPublic` load and the `routes/api.php` controller import are described by locating a named method/convention (the file's exact import style isn't quoted) — these are complete, locatable instructions, not vague placeholders.

**Type/shape consistency:** `layout_type_id` is added to `CampaignPackage.$fillable` (Task 2) so the threading in Task 3 persists; the column exists via Task 1. `layoutTypes()` (Campaign) / `packages()` (CampaignLayoutType) / `layoutType()` (CampaignPackage) names are used consistently across Tasks 2–5. The linking contract (`layout_type_index` → resolved `layout_type_id` via `$layoutIdByIndex`) is identical in store() and update(). `CampaignLayoutTypeResource` (Task 5) is referenced by the controller (Task 4) and the public resource (Task 5); image JSON shape `{file_url, path}` matches between the controller writes (Task 4) and the resource reads (Task 5). Both migrations are authored, never run.
