# Poziomy scroll kolorów, domyślne opcje kroku 3, regulamin, zmiana hasła admina — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement four independent features approved in `docs/superpowers/specs/2026-08-29-scroll-defaults-regulamin-password-design.md`: (1) make the cabin/door color section in configurator step 3 scroll horizontally like the other sections; (2) add a "domyślny/standard" flag to cabin models, cabin colors (independently for cabin vs. door), and cabin accessories (per category), with the flagged option auto-selected when the client first reaches step 3; (3) replace the `/regulamin` placeholder with full legal content; (4) let a logged-in admin change their own password from a new profile page.

**Architecture:** Backend changes first (migrations + model + controller exclusivity logic for the three `cabin_*` tables, then the self-service password endpoint), then admin panel UI (default toggles in the existing Database page, new Profile page), then the public configurator (color scroll fix, step-3 auto-select, regulamin content). Each backend task is independently testable via PHPUnit feature tests (sqlite in-memory, already configured) and each frontend task via the Vite dev server in a browser — there is no frontend test runner in this repo (`wipro-react-frontend/package.json` has only `build`/`dev` scripts), so frontend verification is manual + `tsc` type-check via `npm run build`.

**Tech Stack:** Laravel 12 (PHP backend, Sanctum auth), React + TypeScript + Tailwind (admin & configurator, one Vite build), RTK Query (configurator API), Redux Toolkit + zustand (configurator form state), plain `useState` + axios (admin panel — no react-hook-form/yup there, despite the global default, because the existing admin codebase never uses them), react-i18next (pl/en, separate `i18n` folders per app).

## Global Constraints

- Admin panel forms use plain `useState` + the shared `api` axios instance (see `src/admin/app/protected/admins/index.tsx`), NOT react-hook-form/yup — follow this existing convention for the new Profile page, even though it differs from the global CLAUDE.md default (that default is for the configurator, which does use react-hook-form + yup).
- Frontend package manager is npm (`package-lock.json` present, no `yarn.lock`) — use `npm run build` / `npm run dev`, not yarn, for this project.
- Regulamin content is Polish-only (user decision) — do not add `terms.page.*` translation keys for the body; write the legal text as JSX directly in `TermsPage.tsx`.
- Every new backend validation/exclusivity rule must run inside a `DB::transaction` so "set as default" + "clear all other defaults in the group" are atomic.
- A `is_default*` flag can only be set to `true` on a row that is also `is_active = true` (and, for colors, also `visible_for_cabin`/`visible_for_door = true` for the matching flag) — reject with 422 otherwise.

---

## File Map

### Backend (`wipro-laravel-backend/`)
| File | Action |
|---|---|
| `database/migrations/2026_08_31_000001_add_is_default_to_cabin_models.php` | Create |
| `database/migrations/2026_08_31_000002_add_is_default_to_cabin_accessories.php` | Create |
| `database/migrations/2026_08_31_000003_add_is_default_cabin_and_door_to_cabin_colors.php` | Create |
| `app/Models/CabinModel.php` | Modify — add `is_default` to fillable/casts |
| `app/Models/CabinAccessory.php` | Modify — add `is_default` to fillable/casts |
| `app/Models/CabinColor.php` | Modify — add `is_default_cabin`, `is_default_door` to fillable/casts |
| `app/Http/Controllers/Api/CabinModelController.php` | Modify — validate + exclusivity logic in `store()`/`update()` |
| `app/Http/Controllers/Api/CabinAccessoryController.php` | Modify — validate + exclusivity logic (per `category`) in `store()`/`update()` |
| `app/Http/Controllers/Api/CabinColorController.php` | Modify — validate + exclusivity logic (per cabin/door group) in `store()`/`update()` |
| `tests/Feature/CabinModelDefaultTest.php` | Create |
| `tests/Feature/CabinAccessoryDefaultTest.php` | Create |
| `tests/Feature/CabinColorDefaultTest.php` | Create |
| `app/Http/Controllers/Api/AuthController.php` | Modify — add `updatePassword()` |
| `routes/api.php` | Modify — add `PATCH /auth/password` |
| `tests/Feature/UpdatePasswordTest.php` | Create |

### Admin Frontend (`wipro-react-frontend/src/admin/`)
| File | Action |
|---|---|
| `app/protected/database/index.tsx` | Modify — add `is_default`/`is_default_cabin`/`is_default_door` to local interfaces + toggle UI in `CabinModelsTab`, `AccessoriesTab`, `ExtrasTab`, `CabinColorsTab` |
| `i18n/pl.ts`, `i18n/en.ts` | Modify — add `database.cabinModels.isDefault`, `database.accessories.isDefault`, `database.colors.isDefaultCabin`/`isDefaultDoor`, new `profile.*` block |
| `components/navigation/NavigationBar.tsx` | Modify — user block becomes clickable, navigates to `/profile` |
| `constants/paths.tsx` | Modify — add `/profile` route |
| `app/protected/profile/index.tsx` | Create — self-service password change page |

### Configurator Frontend (`wipro-react-frontend/src/configurator/`)
| File | Action |
|---|---|
| `components/ColorSelector.tsx` | Modify — horizontal scroll instead of `flex-wrap` |
| `store/mainApi/response.ts` | Modify — add `is_default`/`is_default_cabin`/`is_default_door` to `CabinModel`/`CabinAccessory`/`CabinColor` interfaces |
| `components/multiStepWizard/FinishesAndAccessories.tsx` | Modify — auto-select default options on step 3 mount |
| `components/TermsPage.tsx` | Modify — replace placeholder with full regulamin content |

---

## Task 1: Configurator — horizontal scroll for the color section

**Files:**
- Modify: `wipro-react-frontend/src/configurator/components/ColorSelector.tsx`

**Interfaces:**
- Consumes: nothing new (existing `CabinColor[]` prop).
- Produces: nothing new — purely visual.

- [ ] **Step 1: Change the wrapping layout to match `AccessorySelector`'s horizontal-scroll pattern**

In `wipro-react-frontend/src/configurator/components/ColorSelector.tsx`, replace:

```tsx
    return (
        <div className='flex flex-row flex-wrap gap-3'>
            {items.map((color) => {
```

with:

```tsx
    return (
        <div className='conf-scroll overflow-x-auto pb-2'>
            <div className='flex flex-row gap-3 min-w-max'>
                {items.map((color) => {
```

And replace the closing of the map/div (currently):

```tsx
                )
            })}
        </div>
    )
}
```

with:

```tsx
                    )
                })}
            </div>
        </div>
    )
}
```

Also re-indent the `<button>...</button>` block between them by one extra level (4 spaces) since it is now nested one level deeper — this is a pure whitespace change, no logic changes.

- [ ] **Step 2: Type-check the frontend**

Run: `cd wipro-react-frontend && npm run build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 3: Manual verification**

Run: `cd wipro-react-frontend && npm run dev`, open the configurator in a browser, go to step 3 ("Wykończenia i akcesoria"), and confirm the "Kolor kabiny" and "Kolor drzwi" sections scroll horizontally (with the same scrollbar styling) instead of wrapping to a new line, matching the model/panel/signal/etc. sections.

- [ ] **Step 4: Commit**

```bash
git add wipro-react-frontend/src/configurator/components/ColorSelector.tsx
git commit -m "$(cat <<'EOF'
fix: scroll color options horizontally in configurator step 3

Matches the horizontal-scroll pattern already used by every other
step-3 section (cabin model, panel, signal, ceiling, mirror, handrail,
flooring) instead of wrapping color swatches to new lines.
EOF
)"
```

---

## Task 2: Backend — `is_default` flag on `cabin_models`

**Files:**
- Create: `wipro-laravel-backend/database/migrations/2026_08_31_000001_add_is_default_to_cabin_models.php`
- Modify: `wipro-laravel-backend/app/Models/CabinModel.php`
- Modify: `wipro-laravel-backend/app/Http/Controllers/Api/CabinModelController.php`
- Test: `wipro-laravel-backend/tests/Feature/CabinModelDefaultTest.php`

**Interfaces:**
- Produces: `CabinModel.is_default: bool` (default `false`), enforced unique-true across the whole table by the controller.

- [ ] **Step 1: Write the failing test**

Create `wipro-laravel-backend/tests/Feature/CabinModelDefaultTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\CabinModel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CabinModelDefaultTest extends TestCase
{
    use RefreshDatabase;

    public function test_setting_default_on_one_model_clears_others(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $first = CabinModel::create(['name_pl' => 'A', 'name_en' => 'A', 'is_active' => true, 'is_default' => true]);
        $second = CabinModel::create(['name_pl' => 'B', 'name_en' => 'B', 'is_active' => true]);

        $response = $this->patchJson("/api/admin/cabin-models/{$second->id}", ['is_default' => true]);

        $response->assertStatus(200);
        $this->assertFalse($first->fresh()->is_default);
        $this->assertTrue($second->fresh()->is_default);
    }

    public function test_default_cannot_be_set_on_inactive_model(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $model = CabinModel::create(['name_pl' => 'A', 'name_en' => 'A', 'is_active' => false]);

        $response = $this->patchJson("/api/admin/cabin-models/{$model->id}", ['is_default' => true]);

        $response->assertStatus(422);
        $this->assertFalse($model->fresh()->is_default);
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd wipro-laravel-backend && ddev exec php artisan test --filter=CabinModelDefaultTest`
Expected: FAIL — `is_default` column/attribute does not exist yet.

- [ ] **Step 3: Create the migration**

Create `wipro-laravel-backend/database/migrations/2026_08_31_000001_add_is_default_to_cabin_models.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cabin_models', function (Blueprint $table) {
            $table->boolean('is_default')->default(false)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('cabin_models', function (Blueprint $table) {
            $table->dropColumn('is_default');
        });
    }
};
```

- [ ] **Step 4: Update the model**

In `wipro-laravel-backend/app/Models/CabinModel.php`, replace:

```php
class CabinModel extends Model
{
    protected $fillable = [
        'name_pl', 'name_en', 'image_url', 'details', 'sort_order', 'is_active', 'price_addition',
    ];

    protected $casts = [
        'details'        => 'array',
        'is_active'      => 'boolean',
        'price_addition' => 'decimal:2',
    ];
}
```

with:

```php
class CabinModel extends Model
{
    protected $fillable = [
        'name_pl', 'name_en', 'image_url', 'details', 'sort_order', 'is_active', 'price_addition', 'is_default',
    ];

    protected $casts = [
        'details'        => 'array',
        'is_active'      => 'boolean',
        'price_addition' => 'decimal:2',
        'is_default'     => 'boolean',
    ];
}
```

- [ ] **Step 5: Add validation + exclusivity logic to the controller**

In `wipro-laravel-backend/app/Http/Controllers/Api/CabinModelController.php`, add the `DB` facade import — replace:

```php
use App\Http\Controllers\Controller;
use App\Models\CabinModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
```

with:

```php
use App\Http\Controllers\Controller;
use App\Models\CabinModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
```

Replace `store()`:

```php
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name_pl'        => 'required|string|max:200',
            'name_en'        => 'required|string|max:200',
            'sort_order'     => 'integer|min:0',
            'is_active'      => 'boolean',
            'price_addition' => 'nullable|numeric|min:0',
        ]);

        if ($request->hasFile('image')) {
            $this->validateImageFile($request);
            $path = $request->file('image')->store('cabin-images', 'public');
            $data['image_url'] = Storage::disk('public')->url($path);
        }

        $data['details'] = $this->parseDetails($request->input('details'));

        unset($data['image']);

        return response()->json(CabinModel::create($data), 201);
    }
```

with:

```php
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name_pl'        => 'required|string|max:200',
            'name_en'        => 'required|string|max:200',
            'sort_order'     => 'integer|min:0',
            'is_active'      => 'boolean',
            'price_addition' => 'nullable|numeric|min:0',
            'is_default'     => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            $this->validateImageFile($request);
            $path = $request->file('image')->store('cabin-images', 'public');
            $data['image_url'] = Storage::disk('public')->url($path);
        }

        $data['details'] = $this->parseDetails($request->input('details'));

        unset($data['image']);

        $model = new CabinModel($data);
        $this->guardDefaultRequiresActive($model);

        $model = DB::transaction(function () use ($model) {
            $model->save();
            if ($model->is_default) {
                CabinModel::where('id', '!=', $model->id)->update(['is_default' => false]);
            }
            return $model;
        });

        return response()->json($model, 201);
    }
```

Replace `update()`:

```php
    public function update(Request $request, int $id): JsonResponse
    {
        $model = CabinModel::findOrFail($id);

        $data = $request->validate([
            'name_pl'        => 'sometimes|string|max:200',
            'name_en'        => 'sometimes|string|max:200',
            'sort_order'     => 'sometimes|integer|min:0',
            'is_active'      => 'sometimes|boolean',
            'price_addition' => 'sometimes|nullable|numeric|min:0',
        ]);

        if ($request->has('details')) {
            $data['details'] = $this->parseDetails($request->input('details'));
        }

        $model->update($data);

        return response()->json($model);
    }
```

with:

```php
    public function update(Request $request, int $id): JsonResponse
    {
        $model = CabinModel::findOrFail($id);

        $data = $request->validate([
            'name_pl'        => 'sometimes|string|max:200',
            'name_en'        => 'sometimes|string|max:200',
            'sort_order'     => 'sometimes|integer|min:0',
            'is_active'      => 'sometimes|boolean',
            'price_addition' => 'sometimes|nullable|numeric|min:0',
            'is_default'     => 'sometimes|boolean',
        ]);

        if ($request->has('details')) {
            $data['details'] = $this->parseDetails($request->input('details'));
        }

        $model->fill($data);
        $this->guardDefaultRequiresActive($model);

        DB::transaction(function () use ($model) {
            $model->save();
            if ($model->is_default) {
                CabinModel::where('id', '!=', $model->id)->update(['is_default' => false]);
            }
        });

        return response()->json($model);
    }
```

Add a new private helper right after `update()` (before `uploadImage()`):

```php
    private function guardDefaultRequiresActive(CabinModel $model): void
    {
        if ($model->is_default && !$model->is_active) {
            abort(response()->json([
                'message' => 'validation.default_must_be_active',
                'errors'  => ['is_default' => ['validation.default_must_be_active']],
            ], 422));
        }
    }
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd wipro-laravel-backend && ddev exec php artisan test --filter=CabinModelDefaultTest`
Expected: PASS (2 tests).

- [ ] **Step 7: Manual sanity check**

Run: `cd wipro-laravel-backend && ddev exec php artisan tinker --execute="\$a = App\Models\CabinModel::create(['name_pl'=>'X','name_en'=>'X','is_active'=>true,'is_default'=>true]); \$b = App\Models\CabinModel::create(['name_pl'=>'Y','name_en'=>'Y','is_active'=>true]); \$b->update(['is_default'=>true]); echo (int) \$a->fresh()->is_default . ' ' . (int) \$b->fresh()->is_default;"`
Expected output: `0 1`

- [ ] **Step 8: Commit**

```bash
git add wipro-laravel-backend/database/migrations/2026_08_31_000001_add_is_default_to_cabin_models.php \
        wipro-laravel-backend/app/Models/CabinModel.php \
        wipro-laravel-backend/app/Http/Controllers/Api/CabinModelController.php \
        wipro-laravel-backend/tests/Feature/CabinModelDefaultTest.php
git commit -m "$(cat <<'EOF'
feat: add is_default flag to cabin models with mutual exclusivity

Setting is_default=true on one cabin model clears it on all others in
the same DB transaction; rejected on inactive models.
EOF
)"
```

---

## Task 3: Backend — `is_default` flag on `cabin_accessories` (per category)

**Files:**
- Create: `wipro-laravel-backend/database/migrations/2026_08_31_000002_add_is_default_to_cabin_accessories.php`
- Modify: `wipro-laravel-backend/app/Models/CabinAccessory.php`
- Modify: `wipro-laravel-backend/app/Http/Controllers/Api/CabinAccessoryController.php`
- Test: `wipro-laravel-backend/tests/Feature/CabinAccessoryDefaultTest.php`

**Interfaces:**
- Produces: `CabinAccessory.is_default: bool` (default `false`), unique-true per `category` (`PANEL`/`SIGNAL`/`CEILING`/`MIRROR`/`HANDRAIL`/`FLOORING`/`EXTRA` each have their own independent default).

- [ ] **Step 1: Write the failing test**

Create `wipro-laravel-backend/tests/Feature/CabinAccessoryDefaultTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\CabinAccessory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CabinAccessoryDefaultTest extends TestCase
{
    use RefreshDatabase;

    public function test_setting_default_clears_others_in_same_category_only(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $panelA = CabinAccessory::create(['category' => 'PANEL', 'name_pl' => 'A', 'name_en' => 'A', 'is_active' => true, 'is_default' => true]);
        $panelB = CabinAccessory::create(['category' => 'PANEL', 'name_pl' => 'B', 'name_en' => 'B', 'is_active' => true]);
        $signalA = CabinAccessory::create(['category' => 'SIGNAL', 'name_pl' => 'C', 'name_en' => 'C', 'is_active' => true, 'is_default' => true]);

        $response = $this->patchJson("/api/admin/cabin-accessories/{$panelB->id}", ['is_default' => true]);

        $response->assertStatus(200);
        $this->assertFalse($panelA->fresh()->is_default);
        $this->assertTrue($panelB->fresh()->is_default);
        $this->assertTrue($signalA->fresh()->is_default);
    }

    public function test_default_cannot_be_set_on_inactive_accessory(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $accessory = CabinAccessory::create(['category' => 'MIRROR', 'name_pl' => 'A', 'name_en' => 'A', 'is_active' => false]);

        $response = $this->patchJson("/api/admin/cabin-accessories/{$accessory->id}", ['is_default' => true]);

        $response->assertStatus(422);
        $this->assertFalse($accessory->fresh()->is_default);
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd wipro-laravel-backend && ddev exec php artisan test --filter=CabinAccessoryDefaultTest`
Expected: FAIL — `is_default` column/attribute does not exist yet.

- [ ] **Step 3: Create the migration**

Create `wipro-laravel-backend/database/migrations/2026_08_31_000002_add_is_default_to_cabin_accessories.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cabin_accessories', function (Blueprint $table) {
            $table->boolean('is_default')->default(false)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('cabin_accessories', function (Blueprint $table) {
            $table->dropColumn('is_default');
        });
    }
};
```

- [ ] **Step 4: Update the model**

In `wipro-laravel-backend/app/Models/CabinAccessory.php`, replace:

```php
class CabinAccessory extends Model
{
    protected $fillable = [
        'category', 'name_pl', 'name_en', 'image_url', 'sort_order', 'is_active',
        'price_addition', 'multiply_by_access_count',
    ];

    protected $casts = [
        'is_active'                => 'boolean',
        'price_addition'           => 'decimal:2',
        'multiply_by_access_count' => 'boolean',
    ];
}
```

with:

```php
class CabinAccessory extends Model
{
    protected $fillable = [
        'category', 'name_pl', 'name_en', 'image_url', 'sort_order', 'is_active',
        'price_addition', 'multiply_by_access_count', 'is_default',
    ];

    protected $casts = [
        'is_active'                => 'boolean',
        'price_addition'           => 'decimal:2',
        'multiply_by_access_count' => 'boolean',
        'is_default'               => 'boolean',
    ];
}
```

- [ ] **Step 5: Add validation + exclusivity logic to the controller**

In `wipro-laravel-backend/app/Http/Controllers/Api/CabinAccessoryController.php`, replace the import block:

```php
use App\Http\Controllers\Controller;
use App\Models\CabinAccessory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
```

with:

```php
use App\Http\Controllers\Controller;
use App\Models\CabinAccessory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
```

Replace `store()`:

```php
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'category'                 => 'required|string|in:PANEL,SIGNAL,CEILING,MIRROR,HANDRAIL,FLOORING,EXTRA',
            'name_pl'                  => 'required|string|max:200',
            'name_en'                  => 'required|string|max:200',
            'sort_order'               => 'integer|min:0',
            'is_active'                => 'boolean',
            'price_addition'           => 'nullable|numeric|min:0',
            'multiply_by_access_count' => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            $this->validateImageFile($request);
            $path = $request->file('image')->store('accessory-images', 'public');
            $data['image_url'] = Storage::disk('public')->url($path);
        }

        unset($data['image']);

        return response()->json(CabinAccessory::create($data), 201);
    }
```

with:

```php
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'category'                 => 'required|string|in:PANEL,SIGNAL,CEILING,MIRROR,HANDRAIL,FLOORING,EXTRA',
            'name_pl'                  => 'required|string|max:200',
            'name_en'                  => 'required|string|max:200',
            'sort_order'               => 'integer|min:0',
            'is_active'                => 'boolean',
            'price_addition'           => 'nullable|numeric|min:0',
            'multiply_by_access_count' => 'boolean',
            'is_default'               => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            $this->validateImageFile($request);
            $path = $request->file('image')->store('accessory-images', 'public');
            $data['image_url'] = Storage::disk('public')->url($path);
        }

        unset($data['image']);

        $accessory = new CabinAccessory($data);
        $this->guardDefaultRequiresActive($accessory);

        $accessory = DB::transaction(function () use ($accessory) {
            $accessory->save();
            if ($accessory->is_default) {
                CabinAccessory::where('id', '!=', $accessory->id)
                    ->where('category', $accessory->category)
                    ->update(['is_default' => false]);
            }
            return $accessory;
        });

        return response()->json($accessory, 201);
    }
```

Replace `update()`:

```php
    public function update(Request $request, int $id): JsonResponse
    {
        $accessory = CabinAccessory::findOrFail($id);

        $data = $request->validate([
            'category'                 => 'sometimes|string|in:PANEL,SIGNAL,CEILING,MIRROR,HANDRAIL,FLOORING,EXTRA',
            'name_pl'                  => 'sometimes|string|max:200',
            'name_en'                  => 'sometimes|string|max:200',
            'sort_order'               => 'sometimes|integer|min:0',
            'is_active'                => 'sometimes|boolean',
            'price_addition'           => 'sometimes|nullable|numeric|min:0',
            'multiply_by_access_count' => 'sometimes|boolean',
        ]);

        $accessory->update($data);

        return response()->json($accessory);
    }
```

with:

```php
    public function update(Request $request, int $id): JsonResponse
    {
        $accessory = CabinAccessory::findOrFail($id);

        $data = $request->validate([
            'category'                 => 'sometimes|string|in:PANEL,SIGNAL,CEILING,MIRROR,HANDRAIL,FLOORING,EXTRA',
            'name_pl'                  => 'sometimes|string|max:200',
            'name_en'                  => 'sometimes|string|max:200',
            'sort_order'               => 'sometimes|integer|min:0',
            'is_active'                => 'sometimes|boolean',
            'price_addition'           => 'sometimes|nullable|numeric|min:0',
            'multiply_by_access_count' => 'sometimes|boolean',
            'is_default'               => 'sometimes|boolean',
        ]);

        $accessory->fill($data);
        $this->guardDefaultRequiresActive($accessory);

        DB::transaction(function () use ($accessory) {
            $accessory->save();
            if ($accessory->is_default) {
                CabinAccessory::where('id', '!=', $accessory->id)
                    ->where('category', $accessory->category)
                    ->update(['is_default' => false]);
            }
        });

        return response()->json($accessory);
    }
```

Add a new private helper right after `update()` (before `uploadImage()`):

```php
    private function guardDefaultRequiresActive(CabinAccessory $accessory): void
    {
        if ($accessory->is_default && !$accessory->is_active) {
            abort(response()->json([
                'message' => 'validation.default_must_be_active',
                'errors'  => ['is_default' => ['validation.default_must_be_active']],
            ], 422));
        }
    }
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd wipro-laravel-backend && ddev exec php artisan test --filter=CabinAccessoryDefaultTest`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add wipro-laravel-backend/database/migrations/2026_08_31_000002_add_is_default_to_cabin_accessories.php \
        wipro-laravel-backend/app/Models/CabinAccessory.php \
        wipro-laravel-backend/app/Http/Controllers/Api/CabinAccessoryController.php \
        wipro-laravel-backend/tests/Feature/CabinAccessoryDefaultTest.php
git commit -m "$(cat <<'EOF'
feat: add is_default flag to cabin accessories, exclusive per category

Panel/signal/ceiling/mirror/handrail/flooring/extra each get their own
independent default; setting one clears siblings in the same category
only, in a DB transaction, rejected on inactive accessories.
EOF
)"
```

---

## Task 4: Backend — `is_default_cabin`/`is_default_door` flags on `cabin_colors`

**Files:**
- Create: `wipro-laravel-backend/database/migrations/2026_08_31_000003_add_is_default_cabin_and_door_to_cabin_colors.php`
- Modify: `wipro-laravel-backend/app/Models/CabinColor.php`
- Modify: `wipro-laravel-backend/app/Http/Controllers/Api/CabinColorController.php`
- Test: `wipro-laravel-backend/tests/Feature/CabinColorDefaultTest.php`

**Interfaces:**
- Produces: `CabinColor.is_default_cabin: bool`, `CabinColor.is_default_door: bool` (both default `false`), each unique-true independently across rows where `visible_for_cabin`/`visible_for_door` is `true` respectively.

- [ ] **Step 1: Write the failing test**

Create `wipro-laravel-backend/tests/Feature/CabinColorDefaultTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\CabinColor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CabinColorDefaultTest extends TestCase
{
    use RefreshDatabase;

    public function test_default_cabin_and_default_door_are_independent(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $red = CabinColor::create([
            'name_pl' => 'Czerwony', 'name_en' => 'Red',
            'visible_for_cabin' => true, 'visible_for_door' => true,
            'is_active' => true, 'is_default_cabin' => true, 'is_default_door' => true,
        ]);
        $blue = CabinColor::create([
            'name_pl' => 'Niebieski', 'name_en' => 'Blue',
            'visible_for_cabin' => true, 'visible_for_door' => true,
            'is_active' => true,
        ]);

        $response = $this->patchJson("/api/admin/cabin-colors/{$blue->id}", ['is_default_cabin' => true]);

        $response->assertStatus(200);
        $this->assertFalse($red->fresh()->is_default_cabin);
        $this->assertTrue($red->fresh()->is_default_door);
        $this->assertTrue($blue->fresh()->is_default_cabin);
        $this->assertFalse($blue->fresh()->is_default_door);
    }

    public function test_default_cabin_requires_visible_for_cabin(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $color = CabinColor::create([
            'name_pl' => 'Zielony', 'name_en' => 'Green',
            'visible_for_cabin' => false, 'visible_for_door' => true,
            'is_active' => true,
        ]);

        $response = $this->patchJson("/api/admin/cabin-colors/{$color->id}", ['is_default_cabin' => true]);

        $response->assertStatus(422);
        $this->assertFalse($color->fresh()->is_default_cabin);
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd wipro-laravel-backend && ddev exec php artisan test --filter=CabinColorDefaultTest`
Expected: FAIL — `is_default_cabin`/`is_default_door` columns/attributes do not exist yet.

- [ ] **Step 3: Create the migration**

Create `wipro-laravel-backend/database/migrations/2026_08_31_000003_add_is_default_cabin_and_door_to_cabin_colors.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cabin_colors', function (Blueprint $table) {
            $table->boolean('is_default_cabin')->default(false)->after('is_active');
            $table->boolean('is_default_door')->default(false)->after('is_default_cabin');
        });
    }

    public function down(): void
    {
        Schema::table('cabin_colors', function (Blueprint $table) {
            $table->dropColumn(['is_default_cabin', 'is_default_door']);
        });
    }
};
```

- [ ] **Step 4: Update the model**

In `wipro-laravel-backend/app/Models/CabinColor.php`, replace:

```php
class CabinColor extends Model
{
    protected $fillable = [
        'name_pl', 'name_en', 'image_url',
        'visible_for_cabin', 'visible_for_door',
        'price_addition_cabin', 'price_addition_door',
        'sort_order', 'is_active',
    ];

    protected $casts = [
        'is_active'            => 'boolean',
        'visible_for_cabin'    => 'boolean',
        'visible_for_door'     => 'boolean',
        'price_addition_cabin' => 'decimal:2',
        'price_addition_door'  => 'decimal:2',
        'sort_order'           => 'integer',
    ];
}
```

with:

```php
class CabinColor extends Model
{
    protected $fillable = [
        'name_pl', 'name_en', 'image_url',
        'visible_for_cabin', 'visible_for_door',
        'price_addition_cabin', 'price_addition_door',
        'sort_order', 'is_active',
        'is_default_cabin', 'is_default_door',
    ];

    protected $casts = [
        'is_active'            => 'boolean',
        'visible_for_cabin'    => 'boolean',
        'visible_for_door'     => 'boolean',
        'price_addition_cabin' => 'decimal:2',
        'price_addition_door'  => 'decimal:2',
        'sort_order'           => 'integer',
        'is_default_cabin'     => 'boolean',
        'is_default_door'      => 'boolean',
    ];
}
```

- [ ] **Step 5: Add validation + exclusivity logic to the controller**

In `wipro-laravel-backend/app/Http/Controllers/Api/CabinColorController.php`, replace the import block:

```php
use App\Http\Controllers\Controller;
use App\Models\CabinColor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
```

with:

```php
use App\Http\Controllers\Controller;
use App\Models\CabinColor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
```

Replace `store()`:

```php
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name_pl'              => 'required|string|max:200',
            'name_en'              => 'required|string|max:200',
            'visible_for_cabin'    => 'boolean',
            'visible_for_door'     => 'boolean',
            'price_addition_cabin' => 'nullable|numeric|min:0',
            'price_addition_door'  => 'nullable|numeric|min:0',
            'sort_order'           => 'integer|min:0',
            'is_active'            => 'boolean',
        ]);

        return response()->json(CabinColor::create($data), 201);
    }
```

with:

```php
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name_pl'              => 'required|string|max:200',
            'name_en'              => 'required|string|max:200',
            'visible_for_cabin'    => 'boolean',
            'visible_for_door'     => 'boolean',
            'price_addition_cabin' => 'nullable|numeric|min:0',
            'price_addition_door'  => 'nullable|numeric|min:0',
            'sort_order'           => 'integer|min:0',
            'is_active'            => 'boolean',
            'is_default_cabin'     => 'boolean',
            'is_default_door'      => 'boolean',
        ]);

        $color = new CabinColor($data);
        $this->guardDefaults($color);

        $color = DB::transaction(function () use ($color) {
            $color->save();
            $this->clearOtherDefaults($color);
            return $color;
        });

        return response()->json($color, 201);
    }
```

Replace `update()`:

```php
    public function update(Request $request, int $id): JsonResponse
    {
        $color = CabinColor::findOrFail($id);

        $data = $request->validate([
            'name_pl'              => 'sometimes|string|max:200',
            'name_en'              => 'sometimes|string|max:200',
            'visible_for_cabin'    => 'sometimes|boolean',
            'visible_for_door'     => 'sometimes|boolean',
            'price_addition_cabin' => 'sometimes|nullable|numeric|min:0',
            'price_addition_door'  => 'sometimes|nullable|numeric|min:0',
            'sort_order'           => 'sometimes|integer|min:0',
            'is_active'            => 'sometimes|boolean',
        ]);

        $color->update($data);

        return response()->json($color);
    }
```

with:

```php
    public function update(Request $request, int $id): JsonResponse
    {
        $color = CabinColor::findOrFail($id);

        $data = $request->validate([
            'name_pl'              => 'sometimes|string|max:200',
            'name_en'              => 'sometimes|string|max:200',
            'visible_for_cabin'    => 'sometimes|boolean',
            'visible_for_door'     => 'sometimes|boolean',
            'price_addition_cabin' => 'sometimes|nullable|numeric|min:0',
            'price_addition_door'  => 'sometimes|nullable|numeric|min:0',
            'sort_order'           => 'sometimes|integer|min:0',
            'is_active'            => 'sometimes|boolean',
            'is_default_cabin'     => 'sometimes|boolean',
            'is_default_door'      => 'sometimes|boolean',
        ]);

        $color->fill($data);
        $this->guardDefaults($color);

        DB::transaction(function () use ($color) {
            $color->save();
            $this->clearOtherDefaults($color);
        });

        return response()->json($color);
    }
```

Add two new private helpers right after `update()` (before `uploadImage()`):

```php
    private function guardDefaults(CabinColor $color): void
    {
        if ($color->is_default_cabin && (!$color->is_active || !$color->visible_for_cabin)) {
            abort(response()->json([
                'message' => 'validation.default_cabin_requires_active_and_visible',
                'errors'  => ['is_default_cabin' => ['validation.default_cabin_requires_active_and_visible']],
            ], 422));
        }
        if ($color->is_default_door && (!$color->is_active || !$color->visible_for_door)) {
            abort(response()->json([
                'message' => 'validation.default_door_requires_active_and_visible',
                'errors'  => ['is_default_door' => ['validation.default_door_requires_active_and_visible']],
            ], 422));
        }
    }

    private function clearOtherDefaults(CabinColor $color): void
    {
        if ($color->is_default_cabin) {
            CabinColor::where('id', '!=', $color->id)
                ->where('visible_for_cabin', true)
                ->update(['is_default_cabin' => false]);
        }
        if ($color->is_default_door) {
            CabinColor::where('id', '!=', $color->id)
                ->where('visible_for_door', true)
                ->update(['is_default_door' => false]);
        }
    }
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd wipro-laravel-backend && ddev exec php artisan test --filter=CabinColorDefaultTest`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add wipro-laravel-backend/database/migrations/2026_08_31_000003_add_is_default_cabin_and_door_to_cabin_colors.php \
        wipro-laravel-backend/app/Models/CabinColor.php \
        wipro-laravel-backend/app/Http/Controllers/Api/CabinColorController.php \
        wipro-laravel-backend/tests/Feature/CabinColorDefaultTest.php
git commit -m "$(cat <<'EOF'
feat: add independent default flags for cabin and door color

is_default_cabin and is_default_door are separate, each exclusive
within rows visible for that context, rejected when inactive or not
visible in that context.
EOF
)"
```

---

## Task 5: Admin Panel — "Domyślny" toggles for models, accessories, extras, colors

**Depends on:** Task 2, Task 3, Task 4 (backend fields must exist).

**Files:**
- Modify: `wipro-react-frontend/src/admin/app/protected/database/index.tsx`
- Modify: `wipro-react-frontend/src/admin/i18n/pl.ts`
- Modify: `wipro-react-frontend/src/admin/i18n/en.ts`

**Interfaces:**
- Consumes: `is_default` (models, accessories), `is_default_cabin`/`is_default_door` (colors) from the admin API responses (Task 2-4).
- Produces: nothing new for other tasks — self-contained UI.

- [ ] **Step 1: Add i18n keys**

In `wipro-react-frontend/src/admin/i18n/pl.ts`, inside the `cabinModels: { ... }` block, replace:

```ts
      addRow: 'Dodaj wiersz',
      priceAddition: 'Dopłata (PLN)',
    },
    accessories: {
      title: 'Akcesoria kabin',
      add: 'Dodaj',
      noAccessories: 'Brak akcesorii',
      photo: 'Foto',
      sortOrder: 'Kol.',
      confirmDelete: 'Usunąć akcesorium?',
      priceAddition: 'Dopłata (PLN)',
      multiplyByAccessCount: '× dojścia',
    },
```

with:

```ts
      addRow: 'Dodaj wiersz',
      priceAddition: 'Dopłata (PLN)',
      isDefault: 'Domyślny',
    },
    accessories: {
      title: 'Akcesoria kabin',
      add: 'Dodaj',
      noAccessories: 'Brak akcesorii',
      photo: 'Foto',
      sortOrder: 'Kol.',
      confirmDelete: 'Usunąć akcesorium?',
      priceAddition: 'Dopłata (PLN)',
      multiplyByAccessCount: '× dojścia',
      isDefault: 'Domyślny',
    },
```

In the same file, inside `colors: { ... }`, replace:

```ts
      priceAdditionCabin: 'Dopłata kabina (PLN)',
      priceAdditionDoor: 'Dopłata drzwi (PLN)',
      sortOrder: 'Kolejność',
    },
```

with:

```ts
      priceAdditionCabin: 'Dopłata kabina (PLN)',
      priceAdditionDoor: 'Dopłata drzwi (PLN)',
      sortOrder: 'Kolejność',
      isDefaultCabin: 'Domyślny (kabina)',
      isDefaultDoor: 'Domyślny (drzwi)',
    },
```

Now do the equivalent in `wipro-react-frontend/src/admin/i18n/en.ts` (find the matching `cabinModels`/`accessories`/`colors` blocks — same key names, English values):

`cabinModels` block — add `isDefault: 'Default',` after its `priceAddition` line.
`accessories` block — add `isDefault: 'Default',` after its `multiplyByAccessCount` line.
`colors` block — add `isDefaultCabin: 'Default (cabin)',` and `isDefaultDoor: 'Default (door)',` after its `sortOrder` line.

- [ ] **Step 2: Add `is_default` to the local `CabinModel`/`CabinAccessory` interfaces and `is_default_cabin`/`is_default_door` to `CabinColor`**

In `wipro-react-frontend/src/admin/app/protected/database/index.tsx`, replace:

```ts
interface CabinModel {
  id: number; name_pl: string; name_en: string; image_url: string | null; details: DetailRow[] | null; sort_order: number; is_active: boolean; price_addition: number
}
interface CabinAccessory {
  id: number; category: string; name_pl: string; name_en: string; image_url: string | null; sort_order: number; is_active: boolean; price_addition: number; multiply_by_access_count: boolean
}
interface CabinColor {
  id: number
  name_pl: string
  name_en: string
  image_url: string | null
  visible_for_cabin: boolean
  visible_for_door: boolean
  price_addition_cabin: number
  price_addition_door: number
  sort_order: number
  is_active: boolean
}
```

with:

```ts
interface CabinModel {
  id: number; name_pl: string; name_en: string; image_url: string | null; details: DetailRow[] | null; sort_order: number; is_active: boolean; price_addition: number; is_default: boolean
}
interface CabinAccessory {
  id: number; category: string; name_pl: string; name_en: string; image_url: string | null; sort_order: number; is_active: boolean; price_addition: number; multiply_by_access_count: boolean; is_default: boolean
}
interface CabinColor {
  id: number
  name_pl: string
  name_en: string
  image_url: string | null
  visible_for_cabin: boolean
  visible_for_door: boolean
  price_addition_cabin: number
  price_addition_door: number
  sort_order: number
  is_active: boolean
  is_default_cabin: boolean
  is_default_door: boolean
}
```

- [ ] **Step 3: `CabinModelsTab` — reload-on-change fetch + toggle handler**

Replace:

```tsx
  useEffect(() => {
    api.get('/admin/cabin-models').then(r => setModels(r.data)).finally(() => setLoading(false))
  }, [])
```

with:

```tsx
  const loadModels = () => {
    setLoading(true)
    api.get('/admin/cabin-models').then(r => setModels(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { loadModels() }, [])
```

Replace:

```tsx
  const toggleActive = async (m: CabinModel) => {
    await api.patch(`/admin/cabin-models/${m.id}`, { is_active: !m.is_active })
    setModels(prev => prev.map(x => x.id === m.id ? { ...x, is_active: !x.is_active } : x))
  }
```

with:

```tsx
  const toggleActive = async (m: CabinModel) => {
    await api.patch(`/admin/cabin-models/${m.id}`, { is_active: !m.is_active })
    setModels(prev => prev.map(x => x.id === m.id ? { ...x, is_active: !x.is_active } : x))
  }
  const toggleDefault = async (m: CabinModel) => {
    await api.patch(`/admin/cabin-models/${m.id}`, { is_default: !m.is_default })
    loadModels()
  }
```

- [ ] **Step 4: `CabinModelsTab` — table header and row**

Replace:

```tsx
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3 w-20" />
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('settings.namePl')}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('settings.nameEn')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.cabinModels.sortOrder')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.cabinModels.detailsCol')}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.cabinModels.priceAddition')}</th>
              <th className="w-10" />
            </tr></thead>
```

with:

```tsx
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3 w-20" />
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('settings.namePl')}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('settings.nameEn')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.cabinModels.sortOrder')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.cabinModels.isDefault')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.cabinModels.detailsCol')}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.cabinModels.priceAddition')}</th>
              <th className="w-10" />
            </tr></thead>
```

Replace the row-rendering block:

```tsx
              {models.map(m => (
                <>
                  <tr key={m.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2">
                      <ImagePicker previewUrl={m.image_url} uploadUrl={`/admin/cabin-models/${m.id}/image`} onUploaded={(url) => handleImageUploaded(m.id, url)} />
                    </td>
                    <td className="px-4 py-3"><InlineEdit value={m.name_pl} onSave={v => updateModel(m.id, 'name_pl', v)} /></td>
                    <td className="px-4 py-3"><InlineEdit value={m.name_en} onSave={v => updateModel(m.id, 'name_en', v)} /></td>
                    <td className="px-4 py-3 text-center"><InlineEdit value={m.sort_order} type="number" onSave={v => updateModel(m.id, 'sort_order', parseInt(v))} /></td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleActive(m)} className={`text-xs px-2 py-0.5 rounded-full cursor-pointer ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {m.is_active ? t('settings.active') : t('settings.inactive')}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button type="button" onClick={() => openDetails(m)} className={`text-xs px-2 py-0.5 rounded cursor-pointer transition-colors ${expandedId === m.id ? 'bg-amber-100 text-amber-700' : 'text-amber-600 hover:text-amber-800 underline'}`}>
                        {m.details?.length ?? 0} poz.
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-24 border border-gray-200 rounded px-2 py-1 text-sm"
                        defaultValue={m.price_addition ?? 0}
                        onBlur={e => updateModel(m.id, 'price_addition', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-2 py-3"><Button variant="ghost" size="icon" onClick={() => deleteModel(m.id)} className="h-8 w-8 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></td>
                  </tr>
                  {expandedId === m.id && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 bg-amber-50/40 border-b border-amber-100">
                        <p className="text-xs font-medium text-gray-600 mb-2">{t('database.cabinModels.detailsSectionTitle')}</p>
                        <DetailsEditor value={editingDetails} onChange={setEditingDetails} />
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" onClick={() => saveDetails(m.id)}><Save className="h-3 w-3" />{t('common.save')}</Button>
                          <Button variant="ghost" size="sm" onClick={() => setExpandedId(null)}>{t('common.cancel')}</Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
```

with:

```tsx
              {models.map(m => (
                <>
                  <tr key={m.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2">
                      <ImagePicker previewUrl={m.image_url} uploadUrl={`/admin/cabin-models/${m.id}/image`} onUploaded={(url) => handleImageUploaded(m.id, url)} />
                    </td>
                    <td className="px-4 py-3"><InlineEdit value={m.name_pl} onSave={v => updateModel(m.id, 'name_pl', v)} /></td>
                    <td className="px-4 py-3"><InlineEdit value={m.name_en} onSave={v => updateModel(m.id, 'name_en', v)} /></td>
                    <td className="px-4 py-3 text-center"><InlineEdit value={m.sort_order} type="number" onSave={v => updateModel(m.id, 'sort_order', parseInt(v))} /></td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleActive(m)} className={`text-xs px-2 py-0.5 rounded-full cursor-pointer ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {m.is_active ? t('settings.active') : t('settings.inactive')}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleDefault(m)}
                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer focus:outline-none ${m.is_default ? 'bg-amber-500' : 'bg-gray-200'}`}
                      >
                        <span className={`absolute top-0.75 h-3.5 w-3.5 rounded-full bg-white shadow transition-all ${m.is_default ? 'left-4.75' : 'left-0.75'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button type="button" onClick={() => openDetails(m)} className={`text-xs px-2 py-0.5 rounded cursor-pointer transition-colors ${expandedId === m.id ? 'bg-amber-100 text-amber-700' : 'text-amber-600 hover:text-amber-800 underline'}`}>
                        {m.details?.length ?? 0} poz.
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-24 border border-gray-200 rounded px-2 py-1 text-sm"
                        defaultValue={m.price_addition ?? 0}
                        onBlur={e => updateModel(m.id, 'price_addition', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-2 py-3"><Button variant="ghost" size="icon" onClick={() => deleteModel(m.id)} className="h-8 w-8 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></td>
                  </tr>
                  {expandedId === m.id && (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 bg-amber-50/40 border-b border-amber-100">
                        <p className="text-xs font-medium text-gray-600 mb-2">{t('database.cabinModels.detailsSectionTitle')}</p>
                        <DetailsEditor value={editingDetails} onChange={setEditingDetails} />
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" onClick={() => saveDetails(m.id)}><Save className="h-3 w-3" />{t('common.save')}</Button>
                          <Button variant="ghost" size="sm" onClick={() => setExpandedId(null)}>{t('common.cancel')}</Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
```

- [ ] **Step 5: `AccessoriesTab` — reload-on-change fetch + toggle handler**

Replace:

```tsx
  useEffect(() => {
    api.get('/admin/cabin-accessories').then(r => setAccessories(r.data)).finally(() => setLoading(false))
  }, [])
```

with:

```tsx
  const loadAccessories = () => {
    setLoading(true)
    api.get('/admin/cabin-accessories').then(r => setAccessories(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { loadAccessories() }, [])
```

Replace:

```tsx
  const toggleActive = async (a: CabinAccessory) => {
    await api.patch(`/admin/cabin-accessories/${a.id}`, { is_active: !a.is_active })
    setAccessories(prev => prev.map(x => x.id === a.id ? { ...x, is_active: !x.is_active } : x))
  }
  const updateAcc = async (id: number, field: string, value: string | number) => {
```

with:

```tsx
  const toggleActive = async (a: CabinAccessory) => {
    await api.patch(`/admin/cabin-accessories/${a.id}`, { is_active: !a.is_active })
    setAccessories(prev => prev.map(x => x.id === a.id ? { ...x, is_active: !x.is_active } : x))
  }
  const toggleDefault = async (a: CabinAccessory) => {
    await api.patch(`/admin/cabin-accessories/${a.id}`, { is_default: !a.is_default })
    loadAccessories()
  }
  const updateAcc = async (id: number, field: string, value: string | number) => {
```

- [ ] **Step 6: `AccessoriesTab` — table header and rows**

Replace:

```tsx
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-2 w-20 text-left text-xs font-medium text-gray-500 uppercase">{t('database.accessories.photo')}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('settings.namePl')}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('settings.nameEn')}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.accessories.sortOrder')}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.accessories.priceAddition')}</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-center">{t('database.accessories.multiplyByAccessCount')}</th>
                <th className="w-10" />
              </tr>
            </thead>
```

with:

```tsx
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-2 w-20 text-left text-xs font-medium text-gray-500 uppercase">{t('database.accessories.photo')}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('settings.namePl')}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('settings.nameEn')}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.accessories.sortOrder')}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.accessories.isDefault')}</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.accessories.priceAddition')}</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-center">{t('database.accessories.multiplyByAccessCount')}</th>
                <th className="w-10" />
              </tr>
            </thead>
```

Replace the whole `<tbody>...</tbody>` block:

```tsx
            <tbody>
              {ACCESSORY_CATEGORIES.filter(cat => grouped[cat].length > 0).map(cat => (
                <>
                  <tr key={`cat-${cat}`} className="bg-gray-50/60 border-t border-gray-100">
                    <td colSpan={8} className="px-4 py-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{i18n.resolvedLanguage === 'pl' ? CATEGORY_LABELS_PL[cat] : CATEGORY_LABELS_EN[cat]}</span>
                    </td>
                  </tr>
                  {grouped[cat].map(a => (
                    <tr key={a.id} className="hover:bg-gray-50/50 border-t border-gray-50">
                      <td className="px-4 py-2 w-20">
                        <ImagePicker previewUrl={a.image_url} uploadUrl={`/admin/cabin-accessories/${a.id}/image`} onUploaded={(url) => handleImageUploaded(a.id, url)} />
                      </td>
                      <td className="px-4 py-3"><InlineEdit value={a.name_pl} onSave={v => updateAcc(a.id, 'name_pl', v)} /></td>
                      <td className="px-4 py-3"><InlineEdit value={a.name_en} onSave={v => updateAcc(a.id, 'name_en', v)} /></td>
                      <td className="px-4 py-3 text-center"><InlineEdit value={a.sort_order} type="number" onSave={v => updateAcc(a.id, 'sort_order', parseInt(v))} /></td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleActive(a)} className={`text-xs px-2 py-0.5 rounded-full cursor-pointer ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {a.is_active ? t('settings.active') : t('settings.inactive')}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-24 border border-gray-200 rounded px-2 py-1 text-sm"
                          defaultValue={a.price_addition ?? 0}
                          onBlur={e => api.patch(`/admin/cabin-accessories/${a.id}`, { price_addition: parseFloat(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const newVal = !a.multiply_by_access_count;
                            setAccessories(prev => prev.map(x => x.id === a.id ? { ...x, multiply_by_access_count: newVal } : x));
                            api.patch(`/admin/cabin-accessories/${a.id}`, { multiply_by_access_count: newVal });
                          }}
                          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer focus:outline-none ${a.multiply_by_access_count ? 'bg-amber-500' : 'bg-gray-200'}`}
                        >
                          <span className={`absolute top-0.75 h-3.5 w-3.5 rounded-full bg-white shadow transition-all ${a.multiply_by_access_count ? 'left-4.75' : 'left-0.75'}`} />
                        </button>
                      </td>
                      <td className="px-2 py-3"><Button variant="ghost" size="icon" onClick={() => deleteAcc(a.id)} className="h-8 w-8 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></td>
                    </tr>
                  ))}
                </>
              ))}
              {ACCESSORY_CATEGORIES.every(cat => grouped[cat].length === 0) && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">{t('database.accessories.noAccessories')}</td></tr>
              )}
            </tbody>
```

with:

```tsx
            <tbody>
              {ACCESSORY_CATEGORIES.filter(cat => grouped[cat].length > 0).map(cat => (
                <>
                  <tr key={`cat-${cat}`} className="bg-gray-50/60 border-t border-gray-100">
                    <td colSpan={9} className="px-4 py-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{i18n.resolvedLanguage === 'pl' ? CATEGORY_LABELS_PL[cat] : CATEGORY_LABELS_EN[cat]}</span>
                    </td>
                  </tr>
                  {grouped[cat].map(a => (
                    <tr key={a.id} className="hover:bg-gray-50/50 border-t border-gray-50">
                      <td className="px-4 py-2 w-20">
                        <ImagePicker previewUrl={a.image_url} uploadUrl={`/admin/cabin-accessories/${a.id}/image`} onUploaded={(url) => handleImageUploaded(a.id, url)} />
                      </td>
                      <td className="px-4 py-3"><InlineEdit value={a.name_pl} onSave={v => updateAcc(a.id, 'name_pl', v)} /></td>
                      <td className="px-4 py-3"><InlineEdit value={a.name_en} onSave={v => updateAcc(a.id, 'name_en', v)} /></td>
                      <td className="px-4 py-3 text-center"><InlineEdit value={a.sort_order} type="number" onSave={v => updateAcc(a.id, 'sort_order', parseInt(v))} /></td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleActive(a)} className={`text-xs px-2 py-0.5 rounded-full cursor-pointer ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {a.is_active ? t('settings.active') : t('settings.inactive')}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleDefault(a)}
                          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer focus:outline-none ${a.is_default ? 'bg-amber-500' : 'bg-gray-200'}`}
                        >
                          <span className={`absolute top-0.75 h-3.5 w-3.5 rounded-full bg-white shadow transition-all ${a.is_default ? 'left-4.75' : 'left-0.75'}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-24 border border-gray-200 rounded px-2 py-1 text-sm"
                          defaultValue={a.price_addition ?? 0}
                          onBlur={e => api.patch(`/admin/cabin-accessories/${a.id}`, { price_addition: parseFloat(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const newVal = !a.multiply_by_access_count;
                            setAccessories(prev => prev.map(x => x.id === a.id ? { ...x, multiply_by_access_count: newVal } : x));
                            api.patch(`/admin/cabin-accessories/${a.id}`, { multiply_by_access_count: newVal });
                          }}
                          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer focus:outline-none ${a.multiply_by_access_count ? 'bg-amber-500' : 'bg-gray-200'}`}
                        >
                          <span className={`absolute top-0.75 h-3.5 w-3.5 rounded-full bg-white shadow transition-all ${a.multiply_by_access_count ? 'left-4.75' : 'left-0.75'}`} />
                        </button>
                      </td>
                      <td className="px-2 py-3"><Button variant="ghost" size="icon" onClick={() => deleteAcc(a.id)} className="h-8 w-8 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></td>
                    </tr>
                  ))}
                </>
              ))}
              {ACCESSORY_CATEGORIES.every(cat => grouped[cat].length === 0) && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-400">{t('database.accessories.noAccessories')}</td></tr>
              )}
            </tbody>
```

- [ ] **Step 7: `ExtrasTab` — reload-on-change fetch + toggle handler**

Replace:

```tsx
  useEffect(() => {
    api.get('/admin/cabin-accessories')
      .then(r => setExtras((r.data as CabinAccessory[]).filter(a => a.category === 'EXTRA')))
      .finally(() => setLoading(false))
  }, [])
```

with:

```tsx
  const loadExtras = () => {
    setLoading(true)
    api.get('/admin/cabin-accessories')
      .then(r => setExtras((r.data as CabinAccessory[]).filter(a => a.category === 'EXTRA')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadExtras() }, [])
```

Replace:

```tsx
  const toggleActive = async (a: CabinAccessory) => {
    await api.patch(`/admin/cabin-accessories/${a.id}`, { is_active: !a.is_active })
    setExtras(prev => prev.map(x => x.id === a.id ? { ...x, is_active: !x.is_active } : x))
  }
```

with:

```tsx
  const toggleActive = async (a: CabinAccessory) => {
    await api.patch(`/admin/cabin-accessories/${a.id}`, { is_active: !a.is_active })
    setExtras(prev => prev.map(x => x.id === a.id ? { ...x, is_active: !x.is_active } : x))
  }
  const toggleDefault = async (a: CabinAccessory) => {
    await api.patch(`/admin/cabin-accessories/${a.id}`, { is_default: !a.is_default })
    loadExtras()
  }
```

- [ ] **Step 8: `ExtrasTab` — table header and rows**

Replace:

```tsx
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('settings.namePl')}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('settings.nameEn')}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.accessories.priceAddition')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.accessories.sortOrder')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
              <th className="w-10" />
            </tr></thead>
```

with:

```tsx
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('settings.namePl')}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('settings.nameEn')}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.accessories.priceAddition')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.accessories.sortOrder')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.accessories.isDefault')}</th>
              <th className="w-10" />
            </tr></thead>
```

Replace the whole `<tbody>...</tbody>` block:

```tsx
            <tbody className="divide-y divide-gray-50">
              {extras.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-400">{t('database.extras.noExtras')}</td></tr>
              )}
              {extras.map(a => (
                <tr key={a.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3"><InlineEdit value={a.name_pl} onSave={v => updateExtra(a.id, 'name_pl', v)} /></td>
                  <td className="px-4 py-3"><InlineEdit value={a.name_en} onSave={v => updateExtra(a.id, 'name_en', v)} /></td>
                  <td className="px-4 py-3 text-center">
                    <input type="number" min="0" step="0.01" className="w-24 border border-gray-200 rounded px-2 py-1 text-sm" defaultValue={a.price_addition ?? 0} onBlur={e => api.patch(`/admin/cabin-accessories/${a.id}`, { price_addition: parseFloat(e.target.value) || 0 })} />
                  </td>
                  <td className="px-4 py-3 text-center"><InlineEdit value={a.sort_order} type="number" onSave={v => updateExtra(a.id, 'sort_order', parseInt(v))} /></td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive(a)} className={`text-xs px-2 py-0.5 rounded-full cursor-pointer ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {a.is_active ? t('settings.active') : t('settings.inactive')}
                    </button>
                  </td>
                  <td className="px-2 py-3"><Button variant="ghost" size="icon" onClick={() => deleteExtra(a.id)} className="h-8 w-8 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
```

with:

```tsx
            <tbody className="divide-y divide-gray-50">
              {extras.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-400">{t('database.extras.noExtras')}</td></tr>
              )}
              {extras.map(a => (
                <tr key={a.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3"><InlineEdit value={a.name_pl} onSave={v => updateExtra(a.id, 'name_pl', v)} /></td>
                  <td className="px-4 py-3"><InlineEdit value={a.name_en} onSave={v => updateExtra(a.id, 'name_en', v)} /></td>
                  <td className="px-4 py-3 text-center">
                    <input type="number" min="0" step="0.01" className="w-24 border border-gray-200 rounded px-2 py-1 text-sm" defaultValue={a.price_addition ?? 0} onBlur={e => api.patch(`/admin/cabin-accessories/${a.id}`, { price_addition: parseFloat(e.target.value) || 0 })} />
                  </td>
                  <td className="px-4 py-3 text-center"><InlineEdit value={a.sort_order} type="number" onSave={v => updateExtra(a.id, 'sort_order', parseInt(v))} /></td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive(a)} className={`text-xs px-2 py-0.5 rounded-full cursor-pointer ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {a.is_active ? t('settings.active') : t('settings.inactive')}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => toggleDefault(a)}
                      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer focus:outline-none ${a.is_default ? 'bg-amber-500' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-0.75 h-3.5 w-3.5 rounded-full bg-white shadow transition-all ${a.is_default ? 'left-4.75' : 'left-0.75'}`} />
                    </button>
                  </td>
                  <td className="px-2 py-3"><Button variant="ghost" size="icon" onClick={() => deleteExtra(a.id)} className="h-8 w-8 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
```

- [ ] **Step 9: `CabinColorsTab` — table header and rows (uses existing `loadColors`/`handleColorField`, no new handler needed)**

Replace:

```tsx
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3 w-20 text-left text-xs font-medium text-gray-500 uppercase">{t('database.colors.image')}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.namePl')}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.nameEn')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.visibleForCabin')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.visibleForDoor')}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.priceAdditionCabin')}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.priceAdditionDoor')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.sortOrder')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
              <th className="w-10" />
            </tr></thead>
```

with:

```tsx
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3 w-20 text-left text-xs font-medium text-gray-500 uppercase">{t('database.colors.image')}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.namePl')}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.nameEn')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.visibleForCabin')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.visibleForDoor')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.isDefaultCabin')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.isDefaultDoor')}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.priceAdditionCabin')}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.priceAdditionDoor')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.sortOrder')}</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
              <th className="w-10" />
            </tr></thead>
```

Replace the whole `<tbody>...</tbody>` block:

```tsx
            <tbody className="divide-y divide-gray-50">
              {colors.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-400">{t('database.colors.noColors')}</td></tr>
              )}
              {colors.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <ImagePicker
                      previewUrl={c.image_url}
                      uploadUrl={`/admin/cabin-colors/${c.id}/image`}
                      onUploaded={(url) => handleImageUploaded(c.id, url)}
                    />
                  </td>
                  <td className="px-4 py-3"><InlineEdit value={c.name_pl} onSave={v => handleColorField(c.id, 'name_pl', v)} /></td>
                  <td className="px-4 py-3"><InlineEdit value={c.name_en} onSave={v => handleColorField(c.id, 'name_en', v)} /></td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        const newVal = !c.visible_for_cabin;
                        setColors(prev => prev.map(x => x.id === c.id ? { ...x, visible_for_cabin: newVal } : x));
                        api.patch(`/admin/cabin-colors/${c.id}`, { visible_for_cabin: newVal });
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer focus:outline-none ${c.visible_for_cabin ? 'bg-amber-500' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-0.75 h-3.5 w-3.5 rounded-full bg-white shadow transition-all ${c.visible_for_cabin ? 'left-4.75' : 'left-0.75'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        const newVal = !c.visible_for_door;
                        setColors(prev => prev.map(x => x.id === c.id ? { ...x, visible_for_door: newVal } : x));
                        api.patch(`/admin/cabin-colors/${c.id}`, { visible_for_door: newVal });
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer focus:outline-none ${c.visible_for_door ? 'bg-amber-500' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-0.75 h-3.5 w-3.5 rounded-full bg-white shadow transition-all ${c.visible_for_door ? 'left-4.75' : 'left-0.75'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input type="number" min="0" step="0.01" className="w-24 border border-gray-200 rounded px-2 py-1 text-sm" defaultValue={c.price_addition_cabin} onBlur={e => handleColorField(c.id, 'price_addition_cabin', parseFloat(e.target.value) || 0)} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input type="number" min="0" step="0.01" className="w-24 border border-gray-200 rounded px-2 py-1 text-sm" defaultValue={c.price_addition_door} onBlur={e => handleColorField(c.id, 'price_addition_door', parseFloat(e.target.value) || 0)} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input type="number" min="0" className="w-16 border border-gray-200 rounded px-2 py-1 text-sm text-center" defaultValue={c.sort_order} onBlur={e => handleColorField(c.id, 'sort_order', parseInt(e.target.value) || 0)} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleColorField(c.id, 'is_active', !c.is_active)} className={`text-xs px-2 py-0.5 rounded-full cursor-pointer ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.is_active ? t('settings.active') : t('settings.inactive')}
                    </button>
                  </td>
                  <td className="px-2 py-3"><Button variant="ghost" size="icon" onClick={() => deleteColor(c.id)} className="h-8 w-8 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
```

with:

```tsx
            <tbody className="divide-y divide-gray-50">
              {colors.length === 0 && (
                <tr><td colSpan={12} className="px-4 py-8 text-center text-sm text-gray-400">{t('database.colors.noColors')}</td></tr>
              )}
              {colors.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <ImagePicker
                      previewUrl={c.image_url}
                      uploadUrl={`/admin/cabin-colors/${c.id}/image`}
                      onUploaded={(url) => handleImageUploaded(c.id, url)}
                    />
                  </td>
                  <td className="px-4 py-3"><InlineEdit value={c.name_pl} onSave={v => handleColorField(c.id, 'name_pl', v)} /></td>
                  <td className="px-4 py-3"><InlineEdit value={c.name_en} onSave={v => handleColorField(c.id, 'name_en', v)} /></td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        const newVal = !c.visible_for_cabin;
                        setColors(prev => prev.map(x => x.id === c.id ? { ...x, visible_for_cabin: newVal } : x));
                        api.patch(`/admin/cabin-colors/${c.id}`, { visible_for_cabin: newVal });
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer focus:outline-none ${c.visible_for_cabin ? 'bg-amber-500' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-0.75 h-3.5 w-3.5 rounded-full bg-white shadow transition-all ${c.visible_for_cabin ? 'left-4.75' : 'left-0.75'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        const newVal = !c.visible_for_door;
                        setColors(prev => prev.map(x => x.id === c.id ? { ...x, visible_for_door: newVal } : x));
                        api.patch(`/admin/cabin-colors/${c.id}`, { visible_for_door: newVal });
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer focus:outline-none ${c.visible_for_door ? 'bg-amber-500' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-0.75 h-3.5 w-3.5 rounded-full bg-white shadow transition-all ${c.visible_for_door ? 'left-4.75' : 'left-0.75'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleColorField(c.id, 'is_default_cabin', !c.is_default_cabin)}
                      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer focus:outline-none ${c.is_default_cabin ? 'bg-amber-500' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-0.75 h-3.5 w-3.5 rounded-full bg-white shadow transition-all ${c.is_default_cabin ? 'left-4.75' : 'left-0.75'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleColorField(c.id, 'is_default_door', !c.is_default_door)}
                      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer focus:outline-none ${c.is_default_door ? 'bg-amber-500' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-0.75 h-3.5 w-3.5 rounded-full bg-white shadow transition-all ${c.is_default_door ? 'left-4.75' : 'left-0.75'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input type="number" min="0" step="0.01" className="w-24 border border-gray-200 rounded px-2 py-1 text-sm" defaultValue={c.price_addition_cabin} onBlur={e => handleColorField(c.id, 'price_addition_cabin', parseFloat(e.target.value) || 0)} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input type="number" min="0" step="0.01" className="w-24 border border-gray-200 rounded px-2 py-1 text-sm" defaultValue={c.price_addition_door} onBlur={e => handleColorField(c.id, 'price_addition_door', parseFloat(e.target.value) || 0)} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input type="number" min="0" className="w-16 border border-gray-200 rounded px-2 py-1 text-sm text-center" defaultValue={c.sort_order} onBlur={e => handleColorField(c.id, 'sort_order', parseInt(e.target.value) || 0)} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleColorField(c.id, 'is_active', !c.is_active)} className={`text-xs px-2 py-0.5 rounded-full cursor-pointer ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.is_active ? t('settings.active') : t('settings.inactive')}
                    </button>
                  </td>
                  <td className="px-2 py-3"><Button variant="ghost" size="icon" onClick={() => deleteColor(c.id)} className="h-8 w-8 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
```

- [ ] **Step 10: Type-check**

Run: `cd wipro-react-frontend && npm run build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 11: Manual verification**

With the backend migrations from Tasks 2-4 applied and the frontend dev server running, open `/w-admin/database`, go through Models/Accessories/Extras/Colors tabs, toggle "Domyślny" on one row in each group, and confirm the previously-default row in the same group (same category for accessories; same cabin/door column for colors) automatically flips off after the list reloads.

- [ ] **Step 12: Commit**

```bash
git add wipro-react-frontend/src/admin/app/protected/database/index.tsx \
        wipro-react-frontend/src/admin/i18n/pl.ts \
        wipro-react-frontend/src/admin/i18n/en.ts
git commit -m "$(cat <<'EOF'
feat: add "domyślny" toggle to cabin models/accessories/extras/colors admin UI

Toggling default reloads the affected list so mutual exclusivity
enforced by the backend is reflected immediately.
EOF
)"
```

---

## Task 6: Configurator — types + auto-select default options on step 3

**Depends on:** Task 2, Task 3, Task 4 (backend fields must exist).

**Files:**
- Modify: `wipro-react-frontend/src/configurator/store/mainApi/response.ts`
- Modify: `wipro-react-frontend/src/configurator/components/multiStepWizard/FinishesAndAccessories.tsx`

**Interfaces:**
- Consumes: `is_default` on `CabinModel`/`CabinAccessory`, `is_default_cabin`/`is_default_door` on `CabinColor` from the public API (added by Tasks 2-4; the public `index()` endpoints already return all columns, no controller change needed there).
- Produces: nothing new for other tasks.

- [ ] **Step 1: Add the new fields to the response types**

In `wipro-react-frontend/src/configurator/store/mainApi/response.ts`, replace:

```ts
export interface CabinModel {
    id: number;
    name_pl: string;
    name_en: string;
    image_url: string | null;
    details: Array<{ label: string; value: string }> | null;
    sort_order: number;
    is_active: boolean;
}
```

with:

```ts
export interface CabinModel {
    id: number;
    name_pl: string;
    name_en: string;
    image_url: string | null;
    details: Array<{ label: string; value: string }> | null;
    sort_order: number;
    is_active: boolean;
    is_default: boolean;
}
```

Replace:

```ts
export interface CabinAccessory {
    id: number;
    category: AccessoryCategory;
    name_pl: string;
    name_en: string;
    image_url: string | null;
    sort_order: number;
    is_active: boolean;
}
```

with:

```ts
export interface CabinAccessory {
    id: number;
    category: AccessoryCategory;
    name_pl: string;
    name_en: string;
    image_url: string | null;
    sort_order: number;
    is_active: boolean;
    is_default: boolean;
}
```

Replace:

```ts
export interface CabinColor {
    id: number;
    name_pl: string;
    name_en: string;
    image_url: string | null;
    visible_for_cabin: boolean;
    visible_for_door: boolean;
    price_addition_cabin: string;
    price_addition_door: string;
    sort_order: number;
    is_active: boolean;
}
```

with:

```ts
export interface CabinColor {
    id: number;
    name_pl: string;
    name_en: string;
    image_url: string | null;
    visible_for_cabin: boolean;
    visible_for_door: boolean;
    price_addition_cabin: string;
    price_addition_door: string;
    sort_order: number;
    is_active: boolean;
    is_default_cabin: boolean;
    is_default_door: boolean;
}
```

- [ ] **Step 2: Destructure `getValues`/`setValue` from `useForm`**

In `wipro-react-frontend/src/configurator/components/multiStepWizard/FinishesAndAccessories.tsx`, replace:

```tsx
    const { formState: { errors }, control, handleSubmit } = useForm<FormFinishesAndAccessories>({
        resolver: yupResolver(dataSchema),
        defaultValues: defaultData,
        mode: 'onChange',
    })
```

with:

```tsx
    const { formState: { errors }, control, handleSubmit, getValues, setValue } = useForm<FormFinishesAndAccessories>({
        resolver: yupResolver(dataSchema),
        defaultValues: defaultData,
        mode: 'onChange',
    })
```

- [ ] **Step 3: Add the auto-select effect**

Replace:

```tsx
    const cabinDoorSameAsLanding = useWatch({control, name: 'cabinDoorSameAsLanding'})
```

with:

```tsx
    const cabinDoorSameAsLanding = useWatch({control, name: 'cabinDoorSameAsLanding'})

    type NumericFieldKey = 'cabinModelId' | 'cabinColorId' | 'doorColorId' | 'cabinDoorColorId'
        | 'panelId' | 'signalId' | 'ceilingId' | 'mirrorId' | 'handrailId' | 'flooringId'

    useEffect(() => {
        if (loadingModels || loadingAccessories || loadingColors) return

        const applyDefault = (key: NumericFieldKey, defaultId: number | undefined) => {
            if (!defaultId) return
            if (getValues(key)) return
            setValue(key, defaultId)
            updateField('finishesAndAccessories', key, defaultId)
        }

        applyDefault('cabinModelId', cabinModels?.find(m => m.is_default)?.id)
        applyDefault('cabinColorId', cabinColors?.find(c => c.visible_for_cabin && c.is_default_cabin)?.id)
        applyDefault('doorColorId', cabinColors?.find(c => c.visible_for_door && c.is_default_door)?.id)
        applyDefault('cabinDoorColorId', cabinColors?.find(c => c.visible_for_door && c.is_default_door)?.id)

        ACCESSORY_SECTIONS.forEach(({ key, category }) => {
            const items = accessories?.[category as keyof typeof accessories] ?? []
            applyDefault(key, items.find(i => i.is_default)?.id)
        })

        const extraDefaultId = accessories?.['EXTRA']?.find(i => i.is_default)?.id
        if (extraDefaultId && (getValues('extraIds') ?? []).length === 0) {
            setValue('extraIds', [extraDefaultId])
            updateField('finishesAndAccessories', 'extraIds', [extraDefaultId])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadingModels, loadingAccessories, loadingColors, cabinModels, accessories, cabinColors])
```

Note: `cabinDoorColorId` intentionally reuses the same `is_default_door` flag as `doorColorId` — both represent "door color", the design's independence is between cabin vs. door, not between the two door-color fields (`doorColorId` for landing doors, `cabinDoorColorId` for the cabin's own door when it differs).

- [ ] **Step 4: Type-check**

Run: `cd wipro-react-frontend && npm run build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 5: Manual verification**

With at least one `is_default` flag set in the admin panel per section (from Task 5's manual check), open the configurator in a fresh browser session (clear `localStorage` or use a private window so `form-storage` is empty), go through steps 1-2, and on step 3 confirm each flagged section shows its default already selected. Then change one selection, go back to step 2 and forward to step 3 again, and confirm the manual selection was NOT overwritten by the default.

- [ ] **Step 6: Commit**

```bash
git add wipro-react-frontend/src/configurator/store/mainApi/response.ts \
        wipro-react-frontend/src/configurator/components/multiStepWizard/FinishesAndAccessories.tsx
git commit -m "$(cat <<'EOF'
feat: auto-select default cabin/color/accessory options in step 3

Applies once per section, only when the field is still empty, so a
client's own selection is never overwritten when revisiting step 3.
EOF
)"
```

---

## Task 7: Backend — self-service password change endpoint

**Files:**
- Modify: `wipro-laravel-backend/app/Http/Controllers/Api/AuthController.php`
- Modify: `wipro-laravel-backend/routes/api.php`
- Test: `wipro-laravel-backend/tests/Feature/UpdatePasswordTest.php`

**Interfaces:**
- Produces: `PATCH /api/auth/password` (auth:sanctum), body `{ current_password, password, password_confirmation }`, 200 on success, 422 with `errors.current_password` or `errors.password` on failure.

- [ ] **Step 1: Write the failing test**

Create `wipro-laravel-backend/tests/Feature/UpdatePasswordTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UpdatePasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_change_own_password_with_correct_current_password(): void
    {
        $user = User::factory()->create(['role' => 'admin', 'password' => Hash::make('old-password')]);
        Sanctum::actingAs($user);

        $response = $this->patchJson('/api/auth/password', [
            'current_password' => 'old-password',
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ]);

        $response->assertStatus(200);
        $this->assertTrue(Hash::check('new-password-123', $user->fresh()->password));
    }

    public function test_rejects_wrong_current_password(): void
    {
        $user = User::factory()->create(['role' => 'admin', 'password' => Hash::make('old-password')]);
        Sanctum::actingAs($user);

        $response = $this->patchJson('/api/auth/password', [
            'current_password' => 'wrong-password',
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('current_password');
        $this->assertTrue(Hash::check('old-password', $user->fresh()->password));
    }

    public function test_rejects_unconfirmed_password(): void
    {
        $user = User::factory()->create(['role' => 'admin', 'password' => Hash::make('old-password')]);
        Sanctum::actingAs($user);

        $response = $this->patchJson('/api/auth/password', [
            'current_password' => 'old-password',
            'password' => 'new-password-123',
            'password_confirmation' => 'different',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('password');
    }

    public function test_rejects_short_password(): void
    {
        $user = User::factory()->create(['role' => 'admin', 'password' => Hash::make('old-password')]);
        Sanctum::actingAs($user);

        $response = $this->patchJson('/api/auth/password', [
            'current_password' => 'old-password',
            'password' => 'short',
            'password_confirmation' => 'short',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('password');
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd wipro-laravel-backend && ddev exec php artisan test --filter=UpdatePasswordTest`
Expected: FAIL — route `PATCH /api/auth/password` does not exist (404).

- [ ] **Step 3: Add the route**

In `wipro-laravel-backend/routes/api.php`, replace:

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);

    // Admin routes
```

with:

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::patch('/auth/password', [AuthController::class, 'updatePassword']);

    // Admin routes
```

- [ ] **Step 4: Add the controller method**

In `wipro-laravel-backend/app/Http/Controllers/Api/AuthController.php`, replace:

```php
    public function user(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }
}
```

with:

```php
    public function user(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Obecne hasło jest nieprawidłowe.'],
            ]);
        }

        $user->update(['password' => $request->password]);

        return response()->json(['message' => 'Hasło zostało zmienione.']);
    }
}
```

(`User::$casts` already has `'password' => 'hashed'`, so assigning the plain new password via `update()` hashes it automatically — no `Hash::make()` needed here.)

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd wipro-laravel-backend && ddev exec php artisan test --filter=UpdatePasswordTest`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add wipro-laravel-backend/app/Http/Controllers/Api/AuthController.php \
        wipro-laravel-backend/routes/api.php \
        wipro-laravel-backend/tests/Feature/UpdatePasswordTest.php
git commit -m "$(cat <<'EOF'
feat: let an authenticated user change their own password

PATCH /api/auth/password requires the correct current password and a
confirmed new password (min 8 chars); no role restriction — any
authenticated account can change its own credentials.
EOF
)"
```

---

## Task 8: Admin Panel — self-service Profile page

**Depends on:** Task 7 (endpoint must exist).

**Files:**
- Modify: `wipro-react-frontend/src/admin/components/navigation/NavigationBar.tsx`
- Modify: `wipro-react-frontend/src/admin/constants/paths.tsx`
- Modify: `wipro-react-frontend/src/admin/i18n/pl.ts`
- Modify: `wipro-react-frontend/src/admin/i18n/en.ts`
- Create: `wipro-react-frontend/src/admin/app/protected/profile/index.tsx`

**Interfaces:**
- Consumes: `PATCH /auth/password` from Task 7 via the shared `api` axios instance.

- [ ] **Step 1: Add i18n keys**

In `wipro-react-frontend/src/admin/i18n/pl.ts`, replace:

```ts
  admins: {
    title: 'Zarządzanie adminami',
```

with:

```ts
  profile: {
    title: 'Moje konto',
    changePassword: 'Zmiana hasła',
    currentPassword: 'Obecne hasło',
    newPassword: 'Nowe hasło',
    confirmPassword: 'Potwierdź nowe hasło',
    success: 'Hasło zostało zmienione.',
    error: 'Nie udało się zmienić hasła.',
    errors: {
      required: 'To pole jest wymagane.',
      minLength: 'Hasło musi mieć co najmniej 8 znaków.',
      mismatch: 'Hasła nie są identyczne.',
    },
  },
  admins: {
    title: 'Zarządzanie adminami',
```

In `wipro-react-frontend/src/admin/i18n/en.ts`, replace:

```ts
  admins: {
    title: 'Admin accounts',
```

with:

```ts
  profile: {
    title: 'My account',
    changePassword: 'Change password',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    success: 'Password changed successfully.',
    error: 'Failed to change password.',
    errors: {
      required: 'This field is required.',
      minLength: 'Password must be at least 8 characters.',
      mismatch: 'Passwords do not match.',
    },
  },
  admins: {
    title: 'Admin accounts',
```

(If `en.ts`'s `admins.title` string differs slightly from the exact text above, match on the `admins: {` line for that file instead — the important part is inserting the new `profile: { ... }` block immediately before it, mirroring the same key structure as `pl.ts`.)

- [ ] **Step 2: Create the Profile page**

Create `wipro-react-frontend/src/admin/app/protected/profile/index.tsx`:

```tsx
import { Button } from '@admin/components/Button'
import { Card } from '@admin/components/Cards'
import MainHeader from '@admin/components/layout/MainHeader'
import MainLayout from '@admin/components/layout/MainLayout'
import api from '@admin/store/axiosInstance'
import { authStore } from '@admin/store/zustand/authStore'
import { toast } from '@admin/store/zustand/toastStore'
import { Check, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface PasswordForm {
  current_password: string
  password: string
  password_confirmation: string
}

const EMPTY_FORM: PasswordForm = { current_password: '', password: '', password_confirmation: '' }

const ProfilePage = () => {
  const { t } = useTranslation()
  const { user } = authStore()
  const [form, setForm] = useState<PasswordForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof PasswordForm, string>>>({})
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const nextErrors: Partial<Record<keyof PasswordForm, string>> = {}
    if (!form.current_password) nextErrors.current_password = t('profile.errors.required')
    if (form.password.length < 8) nextErrors.password = t('profile.errors.minLength')
    if (form.password !== form.password_confirmation) nextErrors.password_confirmation = t('profile.errors.mismatch')
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setSaving(true)
    try {
      await api.patch('/auth/password', form)
      setForm(EMPTY_FORM)
      toast.success(t('profile.success'))
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors as Record<string, string[]> | undefined
      if (apiErrors) {
        setErrors(Object.fromEntries(Object.entries(apiErrors).map(([k, v]) => [k, v[0]])) as Partial<Record<keyof PasswordForm, string>>)
      } else {
        toast.error(err?.response?.data?.message ?? t('profile.error'))
      }
    } finally {
      setSaving(false)
    }
  }

  const field = (key: keyof PasswordForm, label: string) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</label>
      <input
        type="password"
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:bg-white"
      />
      {errors[key] && <p className="text-xs text-red-600">{errors[key]}</p>}
    </div>
  )

  return (
    <MainLayout headerComponent={
      <MainHeader title={t('profile.title')} subTitle={user?.email} />
    }>
      <Card className="p-6 gap-0 max-w-md">
        <div className="flex items-center gap-2 mb-5">
          <KeyRound className="h-4 w-4 text-amber-500" />
          <h3 className="font-semibold text-gray-900">{t('profile.changePassword')}</h3>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {field('current_password', t('profile.currentPassword'))}
          {field('password', t('profile.newPassword'))}
          {field('password_confirmation', t('profile.confirmPassword'))}
          <Button type="submit" size="sm" disabled={saving} className="self-start">
            <Check className="h-4 w-4" />
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        </form>
      </Card>
    </MainLayout>
  )
}

export default ProfilePage
```

- [ ] **Step 3: Wire up the route**

In `wipro-react-frontend/src/admin/constants/paths.tsx`, replace:

```tsx
import AdminsPage from '@admin/app/protected/admins'

export const router = createBrowserRouter([
  { path: '/', element: <App /> },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { index: true, element: <SignIn /> },
    ],
  },
  {
    element: <ProtectedLayout />,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/quote-requests', element: <QuoteRequests /> },
      { path: '/quote-requests/:id', element: <QuoteRequestDetail /> },
      { path: '/database', element: <Database /> },
      { path: '/address-book', element: <AddressBook /> },
      { path: '/admins', element: <AdminsPage /> },
    ],
  },
  { path: '*', element: <NotFound /> },
], { basename: '/w-admin' })
```

with:

```tsx
import AdminsPage from '@admin/app/protected/admins'
import ProfilePage from '@admin/app/protected/profile'

export const router = createBrowserRouter([
  { path: '/', element: <App /> },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { index: true, element: <SignIn /> },
    ],
  },
  {
    element: <ProtectedLayout />,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/quote-requests', element: <QuoteRequests /> },
      { path: '/quote-requests/:id', element: <QuoteRequestDetail /> },
      { path: '/database', element: <Database /> },
      { path: '/address-book', element: <AddressBook /> },
      { path: '/admins', element: <AdminsPage /> },
      { path: '/profile', element: <ProfilePage /> },
    ],
  },
  { path: '*', element: <NotFound /> },
], { basename: '/w-admin' })
```

- [ ] **Step 4: Make the navbar user block clickable**

In `wipro-react-frontend/src/admin/components/navigation/NavigationBar.tsx`, replace:

```tsx
            <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-gray-900" style={{ background: '#ffb400' }}>
                {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.name}</span>
            </div>
```

with:

```tsx
            <div
              className="flex items-center gap-2 pl-3 border-l border-gray-100 cursor-pointer select-none"
              onClick={() => navigate('/profile')}
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-gray-900" style={{ background: '#ffb400' }}>
                {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.name}</span>
            </div>
```

(This matches the existing clickable-div pattern already used for the logo block a few lines above in the same file, rather than introducing a `<button>` with its own UA-style reset.)

- [ ] **Step 5: Type-check**

Run: `cd wipro-react-frontend && npm run build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 6: Manual verification**

Run the backend (`ddev start` / `php artisan serve`) and frontend dev server, log into `/w-admin`, click the avatar+name in the top-right nav, confirm it navigates to `/w-admin/profile`, submit the form with a wrong current password (expect an inline error under "Obecne hasło"), then with the correct current password and a new password (expect a success toast), then log out and log back in with the new password to confirm it actually changed.

- [ ] **Step 7: Commit**

```bash
git add wipro-react-frontend/src/admin/components/navigation/NavigationBar.tsx \
        wipro-react-frontend/src/admin/constants/paths.tsx \
        wipro-react-frontend/src/admin/i18n/pl.ts \
        wipro-react-frontend/src/admin/i18n/en.ts \
        wipro-react-frontend/src/admin/app/protected/profile/index.tsx
git commit -m "$(cat <<'EOF'
feat: add self-service password change page to admin panel

Clicking the avatar/name in the navbar opens /profile, a form for
changing the logged-in admin's own password.
EOF
)"
```

---

## Task 9: Configurator — regulamin content

**Files:**
- Modify: `wipro-react-frontend/src/configurator/components/TermsPage.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing — standalone content page.

- [ ] **Step 1: Replace the placeholder with full regulamin content**

Replace the entire contents of `wipro-react-frontend/src/configurator/components/TermsPage.tsx`:

```tsx
import {useTranslation} from 'react-i18next'
import {images} from '@/constants/images'
import {Link} from 'react-router'

const TermsPage = () => {
    const {t} = useTranslation()
    return (
        <div className='min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4'>
            <div className='w-full max-w-3xl bg-white rounded-2xl shadow-sm p-8'>
                <div className='mb-8 flex justify-center'>
                    <img src={images.logo.image} alt={images.logo.alt} className='h-10' />
                </div>
                <h1 className='text-2xl font-bold text-gray-900 mb-6'>{t('terms.page.title')}</h1>
                <div className='text-gray-700 text-sm leading-relaxed flex flex-col gap-6'>
                    <section>
                        <h2 className='text-base font-semibold text-gray-900 mb-2'>§ 1. Postanowienia ogólne</h2>
                        <p className='m-0'>
                            Niniejszy regulamin określa zasady korzystania z internetowego konfiguratora dźwigów
                            osobowych (dalej: „Konfigurator”), dostępnego pod niniejszą domeną.
                        </p>
                        <p className='m-0 mt-2'>
                            Administratorem Konfiguratora oraz administratorem danych osobowych przetwarzanych
                            w związku z jego działaniem jest <strong>WINDY WIPRO SP. Z O. O.</strong> z siedzibą
                            w Kokotowie 942, 32-002 Węgrzce Wielkie, NIP: 6832103529, REGON: 382308124,
                            KRS: 0000765948, reprezentowana przez Janusza i Krzysztofa Kasperowskich
                            (dalej: „Administrator”).
                        </p>
                    </section>

                    <section>
                        <h2 className='text-base font-semibold text-gray-900 mb-2'>§ 2. Definicje</h2>
                        <ul className='m-0 pl-5 list-disc flex flex-col gap-1'>
                            <li><strong>Konfigurator</strong> — narzędzie internetowe umożliwiające określenie
                                parametrów technicznych i estetycznych dźwigu oraz przesłanie zapytania
                                ofertowego do Administratora.</li>
                            <li><strong>Użytkownik</strong> — osoba fizyczna lub podmiot korzystający
                                z Konfiguratora.</li>
                            <li><strong>Zapytanie ofertowe</strong> — formularz wypełniony i przesłany przez
                                Użytkownika za pośrednictwem Konfiguratora.</li>
                            <li><strong>Oferta</strong> — wycena przygotowana przez Administratora na
                                podstawie Zapytania ofertowego.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className='text-base font-semibold text-gray-900 mb-2'>§ 3. Zasady korzystania z Konfiguratora</h2>
                        <p className='m-0'>
                            Korzystanie z Konfiguratora polega na wypełnieniu wieloetapowego formularza
                            (dane inwestora i inwestycji, parametry szybu, wykończenia i akcesoria kabiny)
                            oraz przesłaniu Zapytania ofertowego. Po jego przesłaniu Użytkownik otrzymuje
                            automatycznie na podany adres e-mail wstępną Ofertę.
                        </p>
                        <p className='m-0 mt-2'>
                            Wycena przedstawiona w automatycznej Ofercie ma charakter orientacyjny
                            i niewiążący. Ostateczna cena oraz zakres realizacji ustalane są indywidualnie,
                            po kontakcie handlowym i weryfikacji technicznej obiektu przez Administratora.
                        </p>
                    </section>

                    <section>
                        <h2 className='text-base font-semibold text-gray-900 mb-2'>§ 4. Odpowiedzialność</h2>
                        <p className='m-0'>
                            Administrator dokłada starań, aby dane prezentowane w Konfiguratorze
                            (w tym ceny, parametry techniczne i dostępność wykończeń) były aktualne, jednak
                            nie gwarantuje ostatecznej ceny inwestycji bez indywidualnej weryfikacji
                            technicznej. Administrator nie ponosi odpowiedzialności za decyzje podjęte
                            wyłącznie na podstawie wstępnej, automatycznej Oferty.
                        </p>
                    </section>

                    <section>
                        <h2 className='text-base font-semibold text-gray-900 mb-2'>§ 5. Dane osobowe</h2>
                        <p className='m-0'>
                            Dane osobowe podane w Zapytaniu ofertowym (m.in. imię i nazwisko, adres e-mail,
                            numer telefonu, dane firmy) przetwarzane są przez Administratora w celu obsługi
                            Zapytania ofertowego i kontaktu handlowego, na podstawie art. 6 ust. 1 lit. b)
                            RODO (podjęcie działań przed zawarciem umowy) oraz lit. f) RODO (prawnie
                            uzasadniony interes Administratora polegający na prowadzeniu korespondencji
                            handlowej).
                        </p>
                        <p className='m-0 mt-2'>
                            Dane przechowywane są przez okres niezbędny do realizacji Zapytania ofertowego,
                            a następnie przez okres przedawnienia ewentualnych roszczeń. Dane nie są
                            przekazywane do państw trzecich ani wykorzystywane do zautomatyzowanego
                            podejmowania decyzji (profilowania).
                        </p>
                        <p className='m-0 mt-2'>
                            Użytkownikowi przysługuje prawo dostępu do danych, ich sprostowania, usunięcia,
                            ograniczenia przetwarzania, wniesienia sprzeciwu oraz przenoszenia danych,
                            a także prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.
                            W sprawach dotyczących danych osobowych można kontaktować się z Administratorem
                            pod adresem <a className='text-[var(--primary)] underline' href='mailto:projekty@windywipro.pl'>projekty@windywipro.pl</a>.
                        </p>
                    </section>

                    <section>
                        <h2 className='text-base font-semibold text-gray-900 mb-2'>§ 6. Pliki cookies</h2>
                        <p className='m-0'>
                            Konfigurator nie wykorzystuje obecnie plików cookies do celów analitycznych ani
                            marketingowych. Wykorzystywane są wyłącznie mechanizmy techniczne niezbędne do
                            prawidłowego działania formularza (przechowywanie stanu wypełnianego formularza
                            w przeglądarce Użytkownika).
                        </p>
                    </section>

                    <section>
                        <h2 className='text-base font-semibold text-gray-900 mb-2'>§ 7. Reklamacje i kontakt</h2>
                        <p className='m-0'>
                            Wszelkie uwagi i reklamacje dotyczące działania Konfiguratora lub przesłanej
                            Oferty można zgłaszać na adres e-mail{' '}
                            <a className='text-[var(--primary)] underline' href='mailto:projekty@windywipro.pl'>projekty@windywipro.pl</a>.
                        </p>
                    </section>

                    <section>
                        <h2 className='text-base font-semibold text-gray-900 mb-2'>§ 8. Postanowienia końcowe</h2>
                        <p className='m-0'>
                            Administrator zastrzega sobie prawo do zmiany niniejszego regulaminu. Zmiany
                            wchodzą w życie z chwilą publikacji nowej treści pod niniejszym adresem.
                            W sprawach nieuregulowanych niniejszym regulaminem zastosowanie mają przepisy
                            prawa polskiego.
                        </p>
                        <p className='m-0 mt-2 text-gray-400'>Regulamin obowiązuje od dnia 31.08.2026.</p>
                    </section>
                </div>
                <div className='mt-10 pt-6 border-t border-gray-100'>
                    <Link to='/' className='text-[var(--primary)] text-sm underline'>
                        {t('terms.page.backToForm')}
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default TermsPage
```

- [ ] **Step 2: Type-check**

Run: `cd wipro-react-frontend && npm run build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 3: Manual verification**

Run the dev server, open `/regulamin` directly and also via the footer link at the bottom of the configurator form, and confirm the full text renders (all 8 sections) instead of the italic placeholder.

- [ ] **Step 4: Commit**

```bash
git add wipro-react-frontend/src/configurator/components/TermsPage.tsx
git commit -m "$(cat <<'EOF'
feat: publish full regulamin content on /regulamin

Replaces the placeholder with terms of use, administrator details,
and a GDPR/RODO data-processing clause, per WINDY WIPRO SP. Z O.O.
EOF
)"
```

---

## Self-Review Notes

- **Spec coverage:** All 4 spec items covered — Task 1 (scroll), Tasks 2-6 (default flag + auto-select, backend and both frontends), Task 9 (regulamin), Tasks 7-8 (password change, backend and frontend). ✓
- **Placeholder scan:** No TBD/TODO markers; every step has runnable code. ✓
- **Type consistency:** `is_default` (models/accessories) and `is_default_cabin`/`is_default_door` (colors) names are consistent across migration → model → controller → PHP tests → TS interfaces → React components in every task that touches them. `toggleDefault`/`loadModels`/`loadAccessories`/`loadExtras` names are consistent within each tab's own scope (not shared across tabs, matching the existing per-tab `toggleActive`/`updateX` pattern in that file). ✓
- **Task order:** Tasks 2-4 (backend data layer) precede Task 5 (admin UI) and Task 6 (configurator auto-select), which both read the new fields. Task 7 (backend endpoint) precedes Task 8 (frontend page that calls it). Tasks 1 and 9 have no dependencies and can run in any order. ✓
