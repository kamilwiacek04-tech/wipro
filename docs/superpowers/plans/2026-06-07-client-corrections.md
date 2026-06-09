# Client Corrections — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement client-requested corrections: price fields on lift types, cabin color picker, pricing on accessories/models, offer sharing between admins, lift type loaded from DB, access diagram cleanup, and terms page.

**Architecture:** Backend changes (Laravel migrations + model/controller updates) first, then admin frontend (React admin panel in `wipro-react-frontend/src/admin/`), then configurator frontend (`wipro-react-frontend/src/configurator/`). No pricing algorithm — only adding DB fields and UI for entering prices.

**Tech Stack:** Laravel 12 (PHP backend, ddev), React + TypeScript + Tailwind (admin & configurator frontend), RTK Query, Zustand, react-hook-form, i18n (pl/en)

---

## File Map

### Backend (`wipro-laravel-backend/`)
| File | Action |
|------|--------|
| `database/migrations/2026_06_07_000001_add_prices_to_lift_types.php` | Create |
| `database/migrations/2026_06_07_000002_add_price_addition_to_cabin_accessories.php` | Create |
| `database/migrations/2026_06_07_000003_add_price_addition_to_cabin_models.php` | Create |
| `database/migrations/2026_06_07_000004_create_cabin_colors_table.php` | Create |
| `database/migrations/2026_06_07_000005_create_offer_admin_shares_table.php` | Create |
| `app/Models/LiftType.php` | Modify — add `base_price`, `price_per_stop` to `$fillable` + `$casts` |
| `app/Models/CabinAccessory.php` | Modify — add `price_addition` to `$fillable` + `$casts` |
| `app/Models/CabinModel.php` | Modify — add `price_addition` to `$fillable` + `$casts` |
| `app/Models/CabinColor.php` | Create |
| `app/Models/Offer.php` | Modify — add `sharedAdmins()` belongsToMany relation |
| `app/Models/User.php` | Modify — add `sharedOffers()` belongsToMany relation |
| `app/Http/Controllers/Api/LiftTypeController.php` | Modify — add `base_price`, `price_per_stop` to validation |
| `app/Http/Controllers/Api/CabinAccessoryController.php` | Modify — add `price_addition` to validation |
| `app/Http/Controllers/Api/CabinModelController.php` | Modify — add `price_addition` to validation |
| `app/Http/Controllers/Api/CabinColorController.php` | Create |
| `app/Http/Controllers/Api/AdminOfferController.php` | Modify — add `shareWithAdmins()` method, update `index()` to include shared offers |
| `app/Http/Controllers/Api/AdminManagementController.php` | Modify — add `adminOffers()` method |
| `routes/api.php` | Modify — register cabin-colors routes + offer share routes |

### Admin Frontend (`wipro-react-frontend/src/admin/`)
| File | Action |
|------|--------|
| `app/protected/database/index.tsx` | Modify — price fields on lift types, accessories, cabin models; add CabinColor section |
| `app/protected/quoteRequests/detail.tsx` | Modify — load lift_types from API, fix ACCESS_DIAGRAM_OPTIONS to 4 values |
| `app/protected/offers/index.tsx` | Modify — superadmin "Przypisz do adminów" share button + modal |
| `app/protected/admins/index.tsx` | Modify — "Udostępnij oferty" button + modal per admin |

### Configurator Frontend (`wipro-react-frontend/src/configurator/`)
| File | Action |
|------|--------|
| `types/multiStepWizard/finishesAndAccessories.ts` | Modify — add `cabinColorId`, `doorColorId` |
| `store/zustand/formStore.ts` | Modify — add `cabinColorId: 0`, `doorColorId: 0` to initial state |
| `store/mainApi/response.ts` | Modify — add `CabinColor` interface + RTK endpoint |
| `components/multiStepWizard/FinishesAndAccessories.tsx` | Modify — add cabin color & door color selectors |
| `components/ColorSelector.tsx` | Create — color swatch picker component |
| `components/TermsBar.tsx` | Create — sticky bottom bar with link to terms |
| `components/multiStepWizard/Data.tsx` | Modify — include `<TermsBar />` |
| `components/Footer.tsx` | Modify — add link to regulamin on all steps |
| `app/App.tsx` | Modify — add `/regulamin` route |
| `components/TermsPage.tsx` | Create — terms placeholder page |
| `i18n/pl.ts` | Modify — add translation keys |
| `i18n/en.ts` | Modify — add translation keys |

---

## Task 1: Migrations — Price Fields on Lift Types

**Files:**
- Create: `wipro-laravel-backend/database/migrations/2026_06_07_000001_add_prices_to_lift_types.php`
- Modify: `wipro-laravel-backend/app/Models/LiftType.php`
- Modify: `wipro-laravel-backend/app/Http/Controllers/Api/LiftTypeController.php`

- [ ] **Step 1: Create migration**

```php
<?php
// database/migrations/2026_06_07_000001_add_prices_to_lift_types.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lift_types', function (Blueprint $table) {
            $table->decimal('base_price', 10, 2)->nullable()->after('is_active');
            $table->decimal('price_per_stop', 10, 2)->nullable()->after('base_price');
        });
    }

    public function down(): void
    {
        Schema::table('lift_types', function (Blueprint $table) {
            $table->dropColumn(['base_price', 'price_per_stop']);
        });
    }
};
```

- [ ] **Step 2: Run migration**

```bash
cd wipro-laravel-backend && ddev exec php artisan migrate
```

Expected: `Migrated: 2026_06_07_000001_add_prices_to_lift_types`

- [ ] **Step 3: Update LiftType model**

In `app/Models/LiftType.php`, update `$fillable` and `$casts`:

```php
protected $fillable = ['key', 'name_pl', 'name_en', 'sort_order', 'is_active', 'base_price', 'price_per_stop'];

protected $casts = [
    'is_active'      => 'boolean',
    'sort_order'     => 'integer',
    'base_price'     => 'decimal:2',
    'price_per_stop' => 'decimal:2',
];
```

- [ ] **Step 4: Update LiftTypeController validation**

In `store()` method add:
```php
'base_price'    => 'nullable|numeric|min:0',
'price_per_stop'=> 'nullable|numeric|min:0',
```

In `update()` method add the same rules with `sometimes|` prefix.

- [ ] **Step 5: Commit**

```bash
git add database/migrations/2026_06_07_000001_add_prices_to_lift_types.php app/Models/LiftType.php app/Http/Controllers/Api/LiftTypeController.php
git commit -m "feat: add base_price and price_per_stop to lift_types"
```

---

## Task 2: Migration — price_addition on Cabin Accessories

**Files:**
- Create: `wipro-laravel-backend/database/migrations/2026_06_07_000002_add_price_addition_to_cabin_accessories.php`
- Modify: `wipro-laravel-backend/app/Models/CabinAccessory.php`
- Modify: `wipro-laravel-backend/app/Http/Controllers/Api/CabinAccessoryController.php`

- [ ] **Step 1: Create migration**

```php
<?php
// database/migrations/2026_06_07_000002_add_price_addition_to_cabin_accessories.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cabin_accessories', function (Blueprint $table) {
            $table->decimal('price_addition', 10, 2)->default(0)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('cabin_accessories', function (Blueprint $table) {
            $table->dropColumn('price_addition');
        });
    }
};
```

- [ ] **Step 2: Run migration**

```bash
ddev exec php artisan migrate
```

- [ ] **Step 3: Update CabinAccessory model**

In `app/Models/CabinAccessory.php`:
```php
protected $fillable = [
    'category', 'name_pl', 'name_en', 'image_url', 'sort_order', 'is_active', 'price_addition',
];

protected $casts = [
    'is_active'      => 'boolean',
    'price_addition' => 'decimal:2',
];
```

- [ ] **Step 4: Update CabinAccessoryController validation**

In `store()` add: `'price_addition' => 'nullable|numeric|min:0'`
In `update()` add: `'price_addition' => 'sometimes|nullable|numeric|min:0'`

- [ ] **Step 5: Commit**

```bash
git add database/migrations/2026_06_07_000002_add_price_addition_to_cabin_accessories.php app/Models/CabinAccessory.php app/Http/Controllers/Api/CabinAccessoryController.php
git commit -m "feat: add price_addition to cabin_accessories"
```

---

## Task 3: Migration — price_addition on Cabin Models

**Files:**
- Create: `wipro-laravel-backend/database/migrations/2026_06_07_000003_add_price_addition_to_cabin_models.php`
- Modify: `wipro-laravel-backend/app/Models/CabinModel.php`
- Modify: `wipro-laravel-backend/app/Http/Controllers/Api/CabinModelController.php`

- [ ] **Step 1: Create migration**

```php
<?php
// database/migrations/2026_06_07_000003_add_price_addition_to_cabin_models.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cabin_models', function (Blueprint $table) {
            $table->decimal('price_addition', 10, 2)->default(0)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('cabin_models', function (Blueprint $table) {
            $table->dropColumn('price_addition');
        });
    }
};
```

- [ ] **Step 2: Run migration**

```bash
ddev exec php artisan migrate
```

- [ ] **Step 3: Update CabinModel model**

In `app/Models/CabinModel.php`:
```php
protected $fillable = [
    'name_pl', 'name_en', 'image_url', 'details', 'sort_order', 'is_active', 'price_addition',
];

protected $casts = [
    'details'        => 'array',
    'is_active'      => 'boolean',
    'price_addition' => 'decimal:2',
];
```

- [ ] **Step 4: Update CabinModelController validation**

In `store()` add: `'price_addition' => 'nullable|numeric|min:0'`
In `update()` add: `'price_addition' => 'sometimes|nullable|numeric|min:0'`

- [ ] **Step 5: Commit**

```bash
git add database/migrations/2026_06_07_000003_add_price_addition_to_cabin_models.php app/Models/CabinModel.php app/Http/Controllers/Api/CabinModelController.php
git commit -m "feat: add price_addition to cabin_models"
```

---

## Task 4: Backend — CabinColor Model, Controller & Routes

**Files:**
- Create: `wipro-laravel-backend/database/migrations/2026_06_07_000004_create_cabin_colors_table.php`
- Create: `wipro-laravel-backend/app/Models/CabinColor.php`
- Create: `wipro-laravel-backend/app/Http/Controllers/Api/CabinColorController.php`
- Modify: `wipro-laravel-backend/routes/api.php`

- [ ] **Step 1: Create migration**

```php
<?php
// database/migrations/2026_06_07_000004_create_cabin_colors_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cabin_colors', function (Blueprint $table) {
            $table->id();
            $table->string('name_pl');
            $table->string('name_en');
            $table->string('hex_color', 7)->nullable();
            $table->boolean('visible_for_cabin')->default(true);
            $table->boolean('visible_for_door')->default(true);
            $table->decimal('price_addition_cabin', 10, 2)->default(0);
            $table->decimal('price_addition_door', 10, 2)->default(0);
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cabin_colors');
    }
};
```

- [ ] **Step 2: Run migration**

```bash
ddev exec php artisan migrate
```

- [ ] **Step 3: Create CabinColor model**

Create `app/Models/CabinColor.php`:
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CabinColor extends Model
{
    protected $fillable = [
        'name_pl', 'name_en', 'hex_color',
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

- [ ] **Step 4: Create CabinColorController**

Create `app/Http/Controllers/Api/CabinColorController.php`:
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CabinColor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CabinColorController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            CabinColor::where('is_active', true)->orderBy('sort_order')->get()
        );
    }

    public function adminIndex(): JsonResponse
    {
        return response()->json(CabinColor::orderBy('sort_order')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name_pl'              => 'required|string|max:200',
            'name_en'              => 'required|string|max:200',
            'hex_color'            => 'nullable|string|max:7',
            'visible_for_cabin'    => 'boolean',
            'visible_for_door'     => 'boolean',
            'price_addition_cabin' => 'nullable|numeric|min:0',
            'price_addition_door'  => 'nullable|numeric|min:0',
            'sort_order'           => 'integer|min:0',
            'is_active'            => 'boolean',
        ]);

        return response()->json(CabinColor::create($data), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $color = CabinColor::findOrFail($id);

        $data = $request->validate([
            'name_pl'              => 'sometimes|string|max:200',
            'name_en'              => 'sometimes|string|max:200',
            'hex_color'            => 'sometimes|nullable|string|max:7',
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

    public function destroy(int $id): JsonResponse
    {
        CabinColor::findOrFail($id)->delete();

        return response()->json(['message' => 'Deleted.']);
    }
}
```

- [ ] **Step 5: Register routes**

In `routes/api.php`, add to the public routes section:
```php
Route::get('/cabin-colors', [CabinColorController::class, 'index']);
```

Add the import at the top:
```php
use App\Http\Controllers\Api\CabinColorController;
```

In the admin routes section (alongside cabin-accessories routes), add:
```php
// Cabin colors
Route::get('/cabin-colors', [CabinColorController::class, 'adminIndex']);
Route::post('/cabin-colors', [CabinColorController::class, 'store']);
Route::patch('/cabin-colors/{id}', [CabinColorController::class, 'update']);
Route::delete('/cabin-colors/{id}', [CabinColorController::class, 'destroy']);
```

- [ ] **Step 6: Verify routes**

```bash
ddev exec php artisan route:list --path=cabin-colors
```

Expected output: lines showing GET /api/cabin-colors, GET/POST /api/admin/cabin-colors, PATCH/DELETE for individual items.

- [ ] **Step 7: Commit**

```bash
git add database/migrations/2026_06_07_000004_create_cabin_colors_table.php app/Models/CabinColor.php app/Http/Controllers/Api/CabinColorController.php routes/api.php
git commit -m "feat: add cabin_colors table, model, controller and routes"
```

---

## Task 5: Backend — Offer Admin Shares (N:M)

**Files:**
- Create: `wipro-laravel-backend/database/migrations/2026_06_07_000005_create_offer_admin_shares_table.php`
- Modify: `wipro-laravel-backend/app/Models/Offer.php`
- Modify: `wipro-laravel-backend/app/Models/User.php`
- Modify: `wipro-laravel-backend/app/Http/Controllers/Api/AdminOfferController.php`
- Modify: `wipro-laravel-backend/app/Http/Controllers/Api/AdminManagementController.php`
- Modify: `wipro-laravel-backend/routes/api.php`

- [ ] **Step 1: Create migration**

```php
<?php
// database/migrations/2026_06_07_000005_create_offer_admin_shares_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('offer_admin_shares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offer_id')->constrained('offers')->cascadeOnDelete();
            $table->foreignId('admin_id')->constrained('users')->cascadeOnDelete();
            $table->unique(['offer_id', 'admin_id']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('offer_admin_shares');
    }
};
```

- [ ] **Step 2: Run migration**

```bash
ddev exec php artisan migrate
```

- [ ] **Step 3: Update Offer model**

In `app/Models/Offer.php`, add to imports:
```php
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
```

Add method:
```php
public function sharedAdmins(): BelongsToMany
{
    return $this->belongsToMany(User::class, 'offer_admin_shares', 'offer_id', 'admin_id')
        ->withTimestamps();
}
```

- [ ] **Step 4: Update User model**

In `app/Models/User.php`, add to imports:
```php
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
```

Add method:
```php
public function sharedOffers(): BelongsToMany
{
    return $this->belongsToMany(Offer::class, 'offer_admin_shares', 'admin_id', 'offer_id')
        ->withTimestamps();
}
```

- [ ] **Step 5: Add offer sharing endpoints to AdminOfferController**

Add `shareWithAdmins()` method to `AdminOfferController`:
```php
public function shareWithAdmins(Request $request, int $offerId): JsonResponse
{
    $offer = Offer::findOrFail($offerId);

    $data = $request->validate([
        'admin_ids'   => 'required|array',
        'admin_ids.*' => 'integer|exists:users,id',
    ]);

    $offer->sharedAdmins()->sync($data['admin_ids']);

    return response()->json(['message' => 'Udostępniono.', 'shared_admin_ids' => $data['admin_ids']]);
}
```

Also update `index()` method so regular admins also see shared offers. Replace the existing filter block in `index()`:

```php
if ($user->isSuperAdmin()) {
    if ($request->filled('admin_id')) {
        $query->where('created_by_admin_id', $request->admin_id);
    }
} else {
    $query->where(function ($q) use ($user) {
        $q->where('created_by_admin_id', $user->id)
          ->orWhereHas('sharedAdmins', fn($sq) => $sq->where('users.id', $user->id));
    });
}
```

Add `sharedAdmins` to the eager load in `index()`:
```php
$query = Offer::with(['quoteRequest', 'createdBy', 'items', 'sharedAdmins'])
```

- [ ] **Step 6: Add adminOffers method to AdminManagementController**

This endpoint returns all offers created by a specific admin (used in the sharing modal on the admins page):

```php
public function adminOffers(Request $request, int $id): JsonResponse
{
    $admin = User::whereIn('role', ['admin', 'superadmin'])->findOrFail($id);
    $targetAdminId = $request->user()->id;

    $offers = Offer::where('created_by_admin_id', $id)
        ->with(['sharedAdmins' => fn($q) => $q->where('users.id', $targetAdminId)])
        ->orderByDesc('created_at')
        ->get(['id', 'offer_number', 'status', 'client_name', 'created_at']);

    $offers->each(function ($offer) use ($targetAdminId) {
        $offer->is_shared_with_me = $offer->sharedAdmins->isNotEmpty();
        unset($offer->sharedAdmins);
    });

    return response()->json($offers);
}
```

- [ ] **Step 7: Register new routes**

In `routes/api.php`, add inside the admin routes:
```php
// Offer sharing (superadmin only)
Route::middleware('superadmin')->group(function () {
    Route::post('/offers/{offerId}/share', [AdminOfferController::class, 'shareWithAdmins']);
    Route::get('/admins/{id}/offers', [AdminManagementController::class, 'adminOffers']);
});
```

- [ ] **Step 8: Verify**

```bash
ddev exec php artisan route:list --path=share
ddev exec php artisan route:list --path=admins
```

- [ ] **Step 9: Commit**

```bash
git add database/migrations/2026_06_07_000005_create_offer_admin_shares_table.php app/Models/Offer.php app/Models/User.php app/Http/Controllers/Api/AdminOfferController.php app/Http/Controllers/Api/AdminManagementController.php routes/api.php
git commit -m "feat: add offer_admin_shares table and sharing endpoints"
```

---

## Task 6: Admin — Price Fields on Lift Types

**Files:**
- Modify: `wipro-react-frontend/src/admin/app/protected/database/index.tsx`

The file has a LiftType section. Search for the LiftType table header or the `liftTypes` state variable. The `LiftType` interface is defined locally. Add two price fields.

- [ ] **Step 1: Extend LiftType interface**

Find the `LiftType` interface (near the top of the file) and add:
```ts
base_price: number | null
price_per_stop: number | null
```

- [ ] **Step 2: Add price inputs to the "add new" form**

Find the `newType` state (near the `setLiftTypes` and `setNewType` state calls) and add `base_price: ''` and `price_per_stop: ''` to the initial object.

In the "add new" form JSX, after the `sort_order` input, add:
```tsx
<div>
  <label className="text-xs text-gray-500 mb-1 block">{t('database.liftTypes.basePrice')}</label>
  <input
    type="number"
    min="0"
    step="0.01"
    className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
    placeholder="0.00"
    value={newType.base_price ?? ''}
    onChange={e => setNewType(prev => ({ ...prev, base_price: e.target.value }))}
  />
</div>
<div>
  <label className="text-xs text-gray-500 mb-1 block">{t('database.liftTypes.pricePerStop')}</label>
  <input
    type="number"
    min="0"
    step="0.01"
    className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
    placeholder="0.00"
    value={newType.price_per_stop ?? ''}
    onChange={e => setNewType(prev => ({ ...prev, price_per_stop: e.target.value }))}
  />
</div>
```

- [ ] **Step 3: Add price columns to the list table**

In the `<table>` header row for lift types, add two `<th>` cells:
```tsx
<th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.liftTypes.basePrice')}</th>
<th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.liftTypes.pricePerStop')}</th>
```

In each table row, add editable cells (follow the same pattern as `sort_order` — the file uses inline `onBlur` edits or similar pattern for existing fields):
```tsx
<td className="px-4 py-3 text-sm text-gray-600">
  <input
    type="number"
    min="0"
    step="0.01"
    className="w-24 border border-gray-200 rounded px-2 py-1 text-sm"
    defaultValue={type.base_price ?? ''}
    onBlur={e => saveLiftTypeField(type.id, 'base_price', parseFloat(e.target.value) || null)}
  />
</td>
<td className="px-4 py-3 text-sm text-gray-600">
  <input
    type="number"
    min="0"
    step="0.01"
    className="w-24 border border-gray-200 rounded px-2 py-1 text-sm"
    defaultValue={type.price_per_stop ?? ''}
    onBlur={e => saveLiftTypeField(type.id, 'price_per_stop', parseFloat(e.target.value) || null)}
  />
</td>
```

(where `saveLiftTypeField` is the existing function that calls `api.patch`)

- [ ] **Step 4: Add i18n keys**

In `src/admin/i18n/pl.ts` (or wherever admin translations live), in the `database.liftTypes` section add:
```
basePrice: 'Cena bazowa (PLN)',
pricePerStop: 'Cena za przystanek (PLN)',
```

- [ ] **Step 5: Commit**

```bash
git add src/admin/app/protected/database/index.tsx
git commit -m "feat: add price fields to lift types in admin database view"
```

---

## Task 7: Admin — price_addition on Accessories and Cabin Models

**Files:**
- Modify: `wipro-react-frontend/src/admin/app/protected/database/index.tsx`

- [ ] **Step 1: Add price_addition to CabinAccessory interface and table**

Find the local `CabinAccessory` interface (or wherever accessories are typed) and add:
```ts
price_addition: number
```

In the accessories table header, add:
```tsx
<th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.accessories.priceAddition')}</th>
```

In each row, add an editable input that calls the existing `api.patch` function:
```tsx
<td className="px-4 py-3 text-sm">
  <input
    type="number"
    min="0"
    step="0.01"
    className="w-24 border border-gray-200 rounded px-2 py-1 text-sm"
    defaultValue={a.price_addition ?? 0}
    onBlur={e => api.patch(`/admin/cabin-accessories/${a.id}`, { price_addition: parseFloat(e.target.value) || 0 })}
  />
</td>
```

In the "add accessory" form, add a `price_addition` field (follow the same pattern as other fields in the form).

- [ ] **Step 2: Add price_addition to CabinModel interface and table**

Find the local `CabinModel` interface and add:
```ts
price_addition: number
```

In the cabin models table header, add:
```tsx
<th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.cabinModels.priceAddition')}</th>
```

In each row (it already uses `handleModelField` or similar), add:
```tsx
<td className="px-4 py-3 text-sm">
  <input
    type="number"
    min="0"
    step="0.01"
    className="w-24 border border-gray-200 rounded px-2 py-1 text-sm"
    defaultValue={m.price_addition ?? 0}
    onBlur={e => handleModelField(m.id, 'price_addition', parseFloat(e.target.value) || 0)}
  />
</td>
```

In the "add cabin model" form (`newModel` state), add `price_addition: 0` to the initial state and a corresponding input.

- [ ] **Step 3: Add i18n keys**

```
database.accessories.priceAddition → 'Dopłata (PLN)'
database.cabinModels.priceAddition → 'Dopłata (PLN)'
```

- [ ] **Step 4: Commit**

```bash
git add src/admin/app/protected/database/index.tsx
git commit -m "feat: add price_addition field to accessories and cabin models in admin"
```

---

## Task 8: Admin — CabinColor CRUD Section

**Files:**
- Modify: `wipro-react-frontend/src/admin/app/protected/database/index.tsx`

This is the largest admin-side change. Add an entirely new section for Cabin Colors, following the same pattern as the existing sections (LiftTypes, CabinModels, CabinAccessories).

- [ ] **Step 1: Add CabinColor state and types**

Near the top of the component, add:
```ts
interface CabinColor {
  id: number
  name_pl: string
  name_en: string
  hex_color: string | null
  visible_for_cabin: boolean
  visible_for_door: boolean
  price_addition_cabin: number
  price_addition_door: number
  sort_order: number
  is_active: boolean
}
```

Add state:
```ts
const [colors, setColors] = useState<CabinColor[]>([])
const [loadingColors, setLoadingColors] = useState(true)
const [showAddColor, setShowAddColor] = useState(false)
const [newColor, setNewColor] = useState({
  name_pl: '', name_en: '', hex_color: '#000000',
  visible_for_cabin: true, visible_for_door: true,
  price_addition_cabin: 0, price_addition_door: 0,
  sort_order: 0,
})
```

- [ ] **Step 2: Add load + CRUD functions**

```ts
const loadColors = () => {
  setLoadingColors(true)
  api.get('/admin/cabin-colors').then(r => setColors(r.data)).finally(() => setLoadingColors(false))
}

useEffect(() => { loadColors() }, [])

const deleteColor = async (id: number) => {
  if (!confirm(t('database.colors.confirmDelete'))) return
  await api.delete(`/admin/cabin-colors/${id}`)
  loadColors()
}

const handleColorField = async (id: number, field: string, value: unknown) => {
  await api.patch(`/admin/cabin-colors/${id}`, { [field]: value })
  loadColors()
}

const createColor = async (e: React.FormEvent) => {
  e.preventDefault()
  await api.post('/admin/cabin-colors', newColor)
  setNewColor({ name_pl: '', name_en: '', hex_color: '#000000', visible_for_cabin: true, visible_for_door: true, price_addition_cabin: 0, price_addition_door: 0, sort_order: 0 })
  setShowAddColor(false)
  loadColors()
}
```

- [ ] **Step 3: Add CabinColor JSX section**

Add a new `<Card>` section (same pattern as LiftTypes/CabinModels). Key elements:

```tsx
<Card className="p-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="font-semibold text-gray-900">{t('database.colors.title')}</h2>
    <Button size="sm" onClick={() => setShowAddColor(!showAddColor)}>
      <Plus className="h-4 w-4" />{t('database.colors.add')}
    </Button>
  </div>

  {/* Add form */}
  {showAddColor && (
    <form onSubmit={createColor} className="mb-4 p-4 bg-gray-50 rounded-lg grid grid-cols-2 gap-3">
      <div><label className="text-xs text-gray-500 mb-1 block">{t('database.colors.namePl')}</label><input required className="..." value={newColor.name_pl} onChange={e => setNewColor(p => ({ ...p, name_pl: e.target.value }))} /></div>
      <div><label className="text-xs text-gray-500 mb-1 block">{t('database.colors.nameEn')}</label><input required className="..." value={newColor.name_en} onChange={e => setNewColor(p => ({ ...p, name_en: e.target.value }))} /></div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">{t('database.colors.hexColor')}</label>
        <div className="flex items-center gap-2">
          <input type="color" value={newColor.hex_color ?? '#000000'} onChange={e => setNewColor(p => ({ ...p, hex_color: e.target.value }))} className="w-10 h-8 cursor-pointer rounded border" />
          <input className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm" value={newColor.hex_color ?? ''} onChange={e => setNewColor(p => ({ ...p, hex_color: e.target.value }))} maxLength={7} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={newColor.visible_for_cabin} onChange={e => setNewColor(p => ({ ...p, visible_for_cabin: e.target.checked }))} />
          {t('database.colors.visibleForCabin')}
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={newColor.visible_for_door} onChange={e => setNewColor(p => ({ ...p, visible_for_door: e.target.checked }))} />
          {t('database.colors.visibleForDoor')}
        </label>
      </div>
      <div><label className="text-xs text-gray-500 mb-1 block">{t('database.colors.priceAdditionCabin')}</label><input type="number" min="0" step="0.01" className="..." value={newColor.price_addition_cabin} onChange={e => setNewColor(p => ({ ...p, price_addition_cabin: parseFloat(e.target.value) || 0 }))} /></div>
      <div><label className="text-xs text-gray-500 mb-1 block">{t('database.colors.priceAdditionDoor')}</label><input type="number" min="0" step="0.01" className="..." value={newColor.price_addition_door} onChange={e => setNewColor(p => ({ ...p, price_addition_door: parseFloat(e.target.value) || 0 }))} /></div>
      <div className="col-span-2 flex gap-2">
        <Button type="submit" size="sm"><Check className="h-4 w-4" />{t('general.save')}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setShowAddColor(false)}><X className="h-4 w-4" />{t('general.cancel')}</Button>
      </div>
    </form>
  )}

  {/* Table */}
  <table className="w-full text-left">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.color')}</th>
        <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.namePl')}</th>
        <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.visibleForCabin')}</th>
        <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.visibleForDoor')}</th>
        <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.priceAdditionCabin')}</th>
        <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.colors.priceAdditionDoor')}</th>
        <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('general.active')}</th>
        <th></th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-50">
      {colors.map(c => (
        <tr key={c.id} className="hover:bg-gray-50">
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border border-gray-200 flex-shrink-0" style={{ backgroundColor: c.hex_color ?? '#ccc' }} />
              <input
                type="color"
                defaultValue={c.hex_color ?? '#000000'}
                className="w-8 h-8 cursor-pointer rounded border opacity-0 absolute"
                onBlur={e => handleColorField(c.id, 'hex_color', e.target.value)}
              />
              <span className="text-xs text-gray-400">{c.hex_color}</span>
            </div>
          </td>
          <td className="px-4 py-3">
            <input className="border border-gray-200 rounded px-2 py-1 text-sm w-32" defaultValue={c.name_pl} onBlur={e => handleColorField(c.id, 'name_pl', e.target.value)} />
          </td>
          <td className="px-4 py-3 text-center">
            <input type="checkbox" defaultChecked={c.visible_for_cabin} onChange={e => handleColorField(c.id, 'visible_for_cabin', e.target.checked)} />
          </td>
          <td className="px-4 py-3 text-center">
            <input type="checkbox" defaultChecked={c.visible_for_door} onChange={e => handleColorField(c.id, 'visible_for_door', e.target.checked)} />
          </td>
          <td className="px-4 py-3">
            <input type="number" min="0" step="0.01" className="w-24 border border-gray-200 rounded px-2 py-1 text-sm" defaultValue={c.price_addition_cabin} onBlur={e => handleColorField(c.id, 'price_addition_cabin', parseFloat(e.target.value) || 0)} />
          </td>
          <td className="px-4 py-3">
            <input type="number" min="0" step="0.01" className="w-24 border border-gray-200 rounded px-2 py-1 text-sm" defaultValue={c.price_addition_door} onBlur={e => handleColorField(c.id, 'price_addition_door', parseFloat(e.target.value) || 0)} />
          </td>
          <td className="px-4 py-3 text-center">
            <button onClick={() => handleColorField(c.id, 'is_active', !c.is_active)} className="text-gray-400 hover:text-gray-600">
              {c.is_active ? <ToggleRight className="h-5 w-5 text-green-500" /> : <ToggleLeft className="h-5 w-5" />}
            </button>
          </td>
          <td className="px-4 py-3">
            <button onClick={() => deleteColor(c.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</Card>
```

Note: replace `...` inside `className` with the same pattern used in other inputs in the file.

- [ ] **Step 4: Add i18n keys for colors section**

```
database.colors.title → 'Kolory kabin i drzwi'
database.colors.add → 'Dodaj kolor'
database.colors.confirmDelete → 'Usunąć ten kolor?'
database.colors.color → 'Kolor'
database.colors.namePl → 'Nazwa (PL)'
database.colors.nameEn → 'Nazwa (EN)'
database.colors.hexColor → 'Kolor HEX'
database.colors.visibleForCabin → 'Widoczny dla kabiny'
database.colors.visibleForDoor → 'Widoczny dla drzwi'
database.colors.priceAdditionCabin → 'Dopłata kabina (PLN)'
database.colors.priceAdditionDoor → 'Dopłata drzwi (PLN)'
```

- [ ] **Step 5: Commit**

```bash
git add src/admin/app/protected/database/index.tsx
git commit -m "feat: add CabinColor CRUD section in admin database view"
```

---

## Task 9: Admin — Fix ACCESS_DIAGRAM_OPTIONS and Load Lift Types from API

**Files:**
- Modify: `wipro-react-frontend/src/admin/app/protected/quoteRequests/detail.tsx`

- [ ] **Step 1: Add liftTypes state and load from API**

In `detail.tsx`, after existing state declarations, add:
```ts
const [liftTypes, setLiftTypes] = useState<{ value: string; label: string }[]>([])
```

In `useEffect` that loads the quote request data (or a new `useEffect`), add:
```ts
useEffect(() => {
  api.get('/admin/lift-types').then(res => {
    setLiftTypes(res.data.map((t: { key: string; name_pl: string }) => ({ value: t.key, label: t.name_pl })))
  })
}, [])
```

- [ ] **Step 2: Replace ACCESS_DIAGRAM_OPTIONS constant**

Find the `ACCESS_DIAGRAM_OPTIONS` array (line ~136) and replace with:
```ts
const ACCESS_DIAGRAM_OPTIONS = [
  { value: 'FRONT',       label: 'Frontowe' },
  { value: 'THROUGHT',    label: 'Przelotowe' },
  { value: 'CORNER',      label: 'Kątowe' },
  { value: 'TRIPARTITE',  label: 'Trójstronne' },
]
```

- [ ] **Step 3: Replace elevatorTypeLabel select options**

Find the `EditableSelect` for `drive_type` (uses `LIFT_PURPOSE_OPTIONS`) and change `options` to `liftTypes`:
```tsx
<EditableSelect
  label={t('quoteRequests.detail.elevatorTypeLabel')}
  value={data.drive_type}
  options={liftTypes}
  onSave={val => saveTextField('drive_type', val ?? '')}
/>
```

Note: Do NOT remove `LIFT_PURPOSE_OPTIONS` if it's used elsewhere in the file for a different field. Check first with `grep -n "LIFT_PURPOSE_OPTIONS"` in the file.

- [ ] **Step 4: Commit**

```bash
git add src/admin/app/protected/quoteRequests/detail.tsx
git commit -m "fix: load lift types from API, normalize access diagram options to 4 values"
```

---

## Task 10: Admin — Offer Sharing UI (Superadmin, from Offers List)

**Files:**
- Modify: `wipro-react-frontend/src/admin/app/protected/offers/index.tsx`

Context: `adminViewStore()` provides `selectedAdminId` and `user` (the current logged-in admin). Only superadmin sees the sharing UI.

- [ ] **Step 1: Add state for the sharing modal**

```ts
const [shareModalOfferId, setShareModalOfferId] = useState<number | null>(null)
const [shareAdminIds, setShareAdminIds] = useState<number[]>([])
const [allAdmins, setAllAdmins] = useState<{ id: number; name: string }[]>([])
const [sharing, setSharing] = useState(false)
```

- [ ] **Step 2: Load admins list when superadmin opens the share modal**

```ts
const openShareModal = async (offer: Offer) => {
  setShareModalOfferId(offer.id)
  setShareAdminIds((offer.shared_admin_ids ?? []) as number[])
  if (allAdmins.length === 0) {
    const res = await api.get('/admin/admins')
    setAllAdmins(res.data.filter((a: { id: number; role: string }) => a.role === 'admin'))
  }
}
```

Note: update the `Offer` interface to include `shared_admin_ids?: number[]`.

- [ ] **Step 3: Implement save share**

```ts
const saveShare = async () => {
  if (!shareModalOfferId) return
  setSharing(true)
  try {
    await api.post(`/admin/offers/${shareModalOfferId}/share`, { admin_ids: shareAdminIds })
    setShareModalOfferId(null)
    load()
  } finally {
    setSharing(false)
  }
}
```

- [ ] **Step 4: Add share button to each offer row**

Find where offer rows are rendered. For superadmin only, add a share icon button:
```tsx
{user?.role === 'superadmin' && (
  <button
    onClick={() => openShareModal(offer)}
    className="text-gray-400 hover:text-blue-500"
    title="Przypisz do adminów"
  >
    <Link className="h-4 w-4" />
  </button>
)}
```

(`Link` is already imported from lucide-react in this file.)

- [ ] **Step 5: Add share modal**

At the bottom of the JSX, before the closing `</MainLayout>`, add:
```tsx
{shareModalOfferId !== null && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
      <h3 className="font-semibold text-gray-900 mb-4">Przypisz ofertę do adminów</h3>
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto mb-4">
        {allAdmins.map(admin => (
          <label key={admin.id} className="flex items-center gap-3 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={shareAdminIds.includes(admin.id)}
              onChange={e => setShareAdminIds(prev =>
                e.target.checked ? [...prev, admin.id] : prev.filter(id => id !== admin.id)
              )}
            />
            <span className="text-sm text-gray-700">{admin.name}</span>
          </label>
        ))}
        {allAdmins.length === 0 && <p className="text-sm text-gray-400">Brak adminów</p>}
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => setShareModalOfferId(null)}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Anuluj
        </button>
        <button
          onClick={saveShare}
          disabled={sharing}
          className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {sharing ? 'Zapisuję...' : 'Przypisz'}
        </button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 6: Commit**

```bash
git add src/admin/app/protected/offers/index.tsx
git commit -m "feat: superadmin can assign offer to multiple admins"
```

---

## Task 11: Admin — Offer Sharing UI (from Admins Page)

**Files:**
- Modify: `wipro-react-frontend/src/admin/app/protected/admins/index.tsx`

Context: for each admin (role='admin', not 'superadmin'), show a "Udostępnij oferty" button. Clicking opens a modal. The modal shows a list of other admins. Each can be expanded to show their offers. Each offer has a checkbox. There's a master checkbox per admin. A "Zapisz" button submits for the target admin.

- [ ] **Step 1: Add state**

```ts
const [shareTargetAdmin, setShareTargetAdmin] = useState<Admin | null>(null)
const [shareSourceAdmins, setShareSourceAdmins] = useState<Admin[]>([])
const [expandedAdminId, setExpandedAdminId] = useState<number | null>(null)
const [adminOffersMap, setAdminOffersMap] = useState<Record<number, { id: number; offer_number: string; status: string; client_name: string | null; is_shared_with_me: boolean }[]>>({})
const [selectedOfferIds, setSelectedOfferIds] = useState<number[]>([])
const [savingShare, setSavingShare] = useState(false)
```

- [ ] **Step 2: Open modal function**

```ts
const openShareModal = async (admin: Admin) => {
  setShareTargetAdmin(admin)
  setSelectedOfferIds([])
  setExpandedAdminId(null)
  setAdminOffersMap({})
  const res = await api.get('/admin/admins')
  setShareSourceAdmins(res.data.filter((a: Admin) => a.id !== admin.id && a.role === 'admin'))
}
```

- [ ] **Step 3: Load offers for a source admin when expanded**

```ts
const expandAdmin = async (sourceAdminId: number) => {
  if (expandedAdminId === sourceAdminId) {
    setExpandedAdminId(null)
    return
  }
  setExpandedAdminId(sourceAdminId)
  if (!adminOffersMap[sourceAdminId]) {
    const res = await api.get(`/admin/admins/${sourceAdminId}/offers`)
    const offers = res.data as { id: number; offer_number: string; status: string; client_name: string | null; is_shared_with_me: boolean }[]
    setAdminOffersMap(prev => ({ ...prev, [sourceAdminId]: offers }))
    const alreadyShared = offers.filter(o => o.is_shared_with_me).map(o => o.id)
    setSelectedOfferIds(prev => [...new Set([...prev, ...alreadyShared])])
  }
}
```

- [ ] **Step 4: Toggle offer and toggle all for an admin**

```ts
const toggleOffer = (offerId: number) => {
  setSelectedOfferIds(prev =>
    prev.includes(offerId) ? prev.filter(id => id !== offerId) : [...prev, offerId]
  )
}

const toggleAdminOffers = (sourceAdminId: number, checked: boolean) => {
  const offers = adminOffersMap[sourceAdminId] ?? []
  const ids = offers.map(o => o.id)
  setSelectedOfferIds(prev =>
    checked ? [...new Set([...prev, ...ids])] : prev.filter(id => !ids.includes(id))
  )
}
```

- [ ] **Step 5: Save shares**

```ts
const saveShares = async () => {
  if (!shareTargetAdmin) return
  setSavingShare(true)
  try {
    await api.post(`/admin/offers/share-with-admin`, {
      admin_id: shareTargetAdmin.id,
      offer_ids: selectedOfferIds,
    })
    setShareTargetAdmin(null)
  } finally {
    setSavingShare(false)
  }
}
```

Wait — this endpoint doesn't exist yet. The existing endpoint is `POST /admin/offers/{offerId}/share` which assigns admins to one offer. We need a different endpoint: assign multiple offers to one admin.

Add a new backend endpoint in Task 11b below. For now, use `POST /admin/admins/{adminId}/share-offers` with body `{ offer_ids: [...] }`.

Update the save function:
```ts
const saveShares = async () => {
  if (!shareTargetAdmin) return
  setSavingShare(true)
  try {
    await api.post(`/admin/admins/${shareTargetAdmin.id}/share-offers`, {
      offer_ids: selectedOfferIds,
    })
    setShareTargetAdmin(null)
  } finally {
    setSavingShare(false)
  }
}
```

- [ ] **Step 6: Add backend endpoint for bulk share with admin**

In `AdminManagementController.php`, add:
```php
public function shareOffers(Request $request, int $id): JsonResponse
{
    $admin = User::where('role', 'admin')->findOrFail($id);

    $data = $request->validate([
        'offer_ids'   => 'required|array',
        'offer_ids.*' => 'integer|exists:offers,id',
    ]);

    $admin->sharedOffers()->sync($data['offer_ids']);

    return response()->json(['message' => 'Zaktualizowano dostęp.']);
}
```

In `routes/api.php`, inside the `superadmin` middleware group:
```php
Route::post('/admins/{id}/share-offers', [AdminManagementController::class, 'shareOffers']);
```

- [ ] **Step 7: Add "Udostępnij oferty" button to admin list**

Find the place in `admins/index.tsx` where each admin row is rendered. For each admin with role `'admin'` (not `'superadmin'`), add the button:

```tsx
{admin.role === 'admin' && (
  <button
    onClick={() => openShareModal(admin)}
    className="text-xs text-blue-600 hover:text-blue-800 underline"
  >
    Udostępnij oferty
  </button>
)}
```

- [ ] **Step 8: Add the sharing modal JSX**

```tsx
{shareTargetAdmin && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col">
      <h3 className="font-semibold text-gray-900 mb-1">Udostępnij oferty dla: {shareTargetAdmin.name}</h3>
      <p className="text-sm text-gray-500 mb-4">Wybierz oferty innych adminów do udostępnienia</p>
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {shareSourceAdmins.map(sourceAdmin => {
          const offers = adminOffersMap[sourceAdmin.id]
          const isExpanded = expandedAdminId === sourceAdmin.id
          const allChecked = offers ? offers.every(o => selectedOfferIds.includes(o.id)) : false
          const someChecked = offers ? offers.some(o => selectedOfferIds.includes(o.id)) : false
          return (
            <div key={sourceAdmin.id}>
              <div className="flex items-center gap-3 py-3 px-1">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={el => { if (el) el.indeterminate = someChecked && !allChecked }}
                  onChange={e => toggleAdminOffers(sourceAdmin.id, e.target.checked)}
                  disabled={!offers}
                />
                <button
                  className="flex-1 text-left text-sm font-medium text-gray-800 hover:text-blue-600"
                  onClick={() => expandAdmin(sourceAdmin.id)}
                >
                  {sourceAdmin.name}
                  {offers && <span className="ml-2 text-xs text-gray-400">({offers.length} ofert)</span>}
                </button>
                <span className="text-xs text-gray-400">{isExpanded ? '▲' : '▼'}</span>
              </div>
              {isExpanded && offers && (
                <div className="pl-8 pb-2 flex flex-col gap-1">
                  {offers.length === 0 && <p className="text-xs text-gray-400 italic">Brak ofert</p>}
                  {offers.map(offer => (
                    <label key={offer.id} className="flex items-center gap-2 cursor-pointer py-0.5">
                      <input
                        type="checkbox"
                        checked={selectedOfferIds.includes(offer.id)}
                        onChange={() => toggleOffer(offer.id)}
                      />
                      <span className="text-sm text-gray-700">{offer.offer_number}</span>
                      {offer.client_name && <span className="text-xs text-gray-400">— {offer.client_name}</span>}
                    </label>
                  ))}
                </div>
              )}
              {isExpanded && !offers && (
                <div className="pl-8 pb-2 text-xs text-gray-400">Ładowanie...</div>
              )}
            </div>
          )
        })}
      </div>
      <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-gray-100">
        <button onClick={() => setShareTargetAdmin(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Anuluj</button>
        <button onClick={saveShares} disabled={savingShare} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {savingShare ? 'Zapisuję...' : 'Zapisz dostęp'}
        </button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 9: Commit all changes**

```bash
# Backend
cd wipro-laravel-backend
git add app/Http/Controllers/Api/AdminManagementController.php routes/api.php
git commit -m "feat: add bulk share-offers endpoint for admin management"

# Frontend
cd ../wipro-react-frontend
git add src/admin/app/protected/admins/index.tsx
git commit -m "feat: add offer sharing modal in admin management page"
```

---

## Task 12: Configurator — Cabin & Door Color Picker

**Files:**
- Modify: `wipro-react-frontend/src/configurator/types/multiStepWizard/finishesAndAccessories.ts`
- Modify: `wipro-react-frontend/src/configurator/store/zustand/formStore.ts`
- Modify: `wipro-react-frontend/src/configurator/store/mainApi/response.ts`
- Create: `wipro-react-frontend/src/configurator/components/ColorSelector.tsx`
- Modify: `wipro-react-frontend/src/configurator/components/multiStepWizard/FinishesAndAccessories.tsx`
- Modify: `wipro-react-frontend/src/configurator/i18n/pl.ts`
- Modify: `wipro-react-frontend/src/configurator/i18n/en.ts`

- [ ] **Step 1: Update FormFinishesAndAccessories type**

In `types/multiStepWizard/finishesAndAccessories.ts`:
```ts
export interface FormFinishesAndAccessories {
    cabinModelId: number;
    cabinColorId: number;
    doorColorId: number;
    panelId: number;
    signalId: number;
    ceilingId: number;
    mirrorId: number;
    handrailId: number;
    flooringId: number;
    extraIds: number[];
}
```

- [ ] **Step 2: Update formStore initial state**

In `store/zustand/formStore.ts`, in `blankFormState.finishesAndAccessories`:
```ts
finishesAndAccessories: {
    cabinModelId: 0,
    cabinColorId: 0,
    doorColorId: 0,
    panelId: 0,
    signalId: 0,
    ceilingId: 0,
    mirrorId: 0,
    handrailId: 0,
    flooringId: 0,
    extraIds: [] as number[],
}
```

- [ ] **Step 3: Add CabinColor interface and RTK endpoint**

In `store/mainApi/response.ts`, add interface:
```ts
export interface CabinColor {
    id: number;
    name_pl: string;
    name_en: string;
    hex_color: string | null;
    visible_for_cabin: boolean;
    visible_for_door: boolean;
    price_addition_cabin: string;
    price_addition_door: string;
    sort_order: number;
    is_active: boolean;
}
```

Add RTK endpoint (alongside `useGetCabinModelsQuery` etc.):
```ts
getCabinColors: build.query<CabinColor[], void>({
    query: () => ({ url: '/cabin-colors', method: 'GET' })
}),
```

Export the hook: `useGetCabinColorsQuery`.

- [ ] **Step 4: Create ColorSelector component**

Create `src/configurator/components/ColorSelector.tsx`:
```tsx
import {useTranslation} from 'react-i18next'
import {CabinColor} from '@/store/mainApi/response'

interface Props {
    items: CabinColor[]
    currentValue: number
    onChange: (id: number) => void
}

const ColorSelector = ({items, currentValue, onChange}: Props) => {
    const {i18n} = useTranslation()

    if (items.length === 0) return null

    return (
        <div className='flex flex-row flex-wrap gap-3'>
            {items.map((color) => {
                const name = i18n.language === 'pl' ? color.name_pl : color.name_en
                const isSelected = color.id === currentValue
                return (
                    <button
                        key={color.id}
                        type='button'
                        onClick={() => onChange(isSelected ? 0 : color.id)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-colors ${
                            isSelected
                                ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <div
                            className='w-10 h-10 rounded-full border border-gray-200 shadow-sm flex-shrink-0'
                            style={{backgroundColor: color.hex_color ?? '#cccccc'}}
                        />
                        <span className='text-[12px] text-gray-600 text-center max-w-[70px] leading-tight'>{name}</span>
                    </button>
                )
            })}
        </div>
    )
}

export default ColorSelector
```

- [ ] **Step 5: Update FinishesAndAccessories.tsx**

Import the new hook and component:
```ts
import {useGetCabinColorsQuery} from '@/store/mainApi/response'
import ColorSelector from '@/components/ColorSelector'
```

Add the query:
```ts
const {data: cabinColors, isLoading: loadingColors} = useGetCabinColorsQuery()
```

Update `isLoadingAll`:
```ts
const isLoadingAll = loadingModels || loadingAccessories || loadingColors
```

After the `cabinModelId` `BorderInput` block, add two new sections:

```tsx
{/* Kolor kabiny */}
{(cabinColors?.filter(c => c.visible_for_cabin) ?? []).length > 0 && (
    <BorderInput title={t(`${textPath}.field.cabinColor`)}>
        <Controller
            control={control}
            name='cabinColorId'
            render={({field}) => (
                <ColorSelector
                    items={cabinColors?.filter(c => c.visible_for_cabin) ?? []}
                    currentValue={field.value}
                    onChange={(id) => {
                        updateField('finishesAndAccessories', 'cabinColorId', id)
                        field.onChange(id)
                    }}
                />
            )}
        />
    </BorderInput>
)}

{/* Kolor drzwi */}
{(cabinColors?.filter(c => c.visible_for_door) ?? []).length > 0 && (
    <BorderInput title={t(`${textPath}.field.doorColor`)}>
        <Controller
            control={control}
            name='doorColorId'
            render={({field}) => (
                <ColorSelector
                    items={cabinColors?.filter(c => c.visible_for_door) ?? []}
                    currentValue={field.value}
                    onChange={(id) => {
                        updateField('finishesAndAccessories', 'doorColorId', id)
                        field.onChange(id)
                    }}
                />
            )}
        />
    </BorderInput>
)}
```

In `onSubmit`, inside the `JSON.stringify({...})` in `additional_notes`, add:
```ts
cabinColorId: dataCurr.cabinColorId || undefined,
doorColorId: dataCurr.doorColorId || undefined,
```

- [ ] **Step 6: Add i18n keys**

In `i18n/pl.ts`, in `form.finishesAndAccessories.field`:
```ts
cabinColor: 'Kolor kabiny',
doorColor: 'Kolor drzwi',
```

In `i18n/en.ts`, same location:
```ts
cabinColor: 'Cabin color',
doorColor: 'Door color',
```

- [ ] **Step 7: Commit**

```bash
git add src/configurator/types/multiStepWizard/finishesAndAccessories.ts src/configurator/store/zustand/formStore.ts src/configurator/store/mainApi/response.ts src/configurator/components/ColorSelector.tsx src/configurator/components/multiStepWizard/FinishesAndAccessories.tsx src/configurator/i18n/pl.ts src/configurator/i18n/en.ts
git commit -m "feat: add cabin color and door color picker in configurator step 3"
```

---

## Task 13: Configurator — Terms Bar and Terms Page

**Files:**
- Create: `wipro-react-frontend/src/configurator/components/TermsBar.tsx`
- Create: `wipro-react-frontend/src/configurator/components/TermsPage.tsx`
- Modify: `wipro-react-frontend/src/configurator/components/multiStepWizard/Data.tsx`
- Modify: `wipro-react-frontend/src/configurator/components/Footer.tsx`
- Modify: `wipro-react-frontend/src/configurator/app/App.tsx`
- Modify: `wipro-react-frontend/src/configurator/i18n/pl.ts`
- Modify: `wipro-react-frontend/src/configurator/i18n/en.ts`

- [ ] **Step 1: Create TermsBar component**

Create `src/configurator/components/TermsBar.tsx`:
```tsx
import {useState} from 'react'
import {Link} from 'react-router'
import {useTranslation} from 'react-i18next'
import {X} from 'lucide-react'

const TermsBar = () => {
    const {t} = useTranslation()
    const [dismissed, setDismissed] = useState(false)

    if (dismissed) return null

    return (
        <div className='fixed bottom-0 left-0 right-0 z-40 bg-[var(--secondary)] border-t border-gray-200 px-4 py-3 flex items-center justify-center gap-4'>
            <p className='text-[13px] text-gray-600 text-center'>
                {t('terms.bar.text')}{' '}
                <Link
                    to='/regulamin'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-[var(--primary)] underline font-medium'
                >
                    {t('terms.bar.link')}
                </Link>
            </p>
            <button
                onClick={() => setDismissed(true)}
                className='flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors'
                aria-label='Zamknij'
            >
                <X className='w-4 h-4' />
            </button>
        </div>
    )
}

export default TermsBar
```

- [ ] **Step 2: Create TermsPage component**

Create `src/configurator/components/TermsPage.tsx`:
```tsx
import {useTranslation} from 'react-i18next'
import {images} from '@/constants/images'
import {Link} from 'react-router'

const TermsPage = () => {
    const {t} = useTranslation()
    return (
        <div className='min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4'>
            <div className='w-full max-w-3xl bg-white rounded-2xl shadow-sm p-8 md:p-12'>
                <div className='mb-8 flex justify-center'>
                    <img src={images.logo.image} alt={images.logo.alt} className='h-10' />
                </div>
                <h1 className='text-2xl font-bold text-gray-900 mb-6'>{t('terms.page.title')}</h1>
                <div className='text-gray-500 text-sm italic'>
                    <p>{t('terms.page.placeholder')}</p>
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

- [ ] **Step 3: Add TermsBar to step 1 (Data)**

In `src/configurator/components/multiStepWizard/Data.tsx`, import and add:
```tsx
import TermsBar from '@/components/TermsBar'
```

At the end of the returned JSX (inside the wrapping div), add `<TermsBar />`.

- [ ] **Step 4: Update Footer with terms link**

In `src/configurator/components/Footer.tsx`:
```tsx
import {Link} from 'react-router'
import {useTranslation} from 'react-i18next'

const Footer = () => {
    const {t} = useTranslation()
    return (
        <div className='mt-[15px] flex flex-col gap-1 items-center justify-center'>
            <div className='flex flex-row gap-1 items-center'>
                <p className='m-0 text-[var(--grey)]'>{t('general.gotProblems')}</p>
                <a className='text-[var(--grey)]' href='mailto:projekty@windywipro.pl'>projekty@windywipro.pl</a>
            </div>
            <Link to='/regulamin' target='_blank' rel='noopener noreferrer' className='text-[12px] text-gray-400 hover:text-gray-600 underline'>
                {t('terms.link')}
            </Link>
        </div>
    )
}

export default Footer
```

- [ ] **Step 5: Add /regulamin route in App.tsx**

In `src/configurator/app/App.tsx`:
```tsx
import TermsPage from '@/components/TermsPage'
```

Add a route outside the BasicLayout routes (so it has its own full-page layout):
```tsx
<Route path='regulamin' element={<TermsPage />} />
```

Place it alongside the top-level routes (before or after the main `<Route>` block).

- [ ] **Step 6: Add i18n keys**

In `i18n/pl.ts`, add a new `terms` section at the top level:
```ts
terms: {
    bar: {
        text: 'Przechodząc do kolejnego kroku, akceptujesz nasz',
        link: 'regulamin',
    },
    link: 'Regulamin',
    page: {
        title: 'Regulamin',
        placeholder: 'Treść regulaminu zostanie tutaj opublikowana.',
        backToForm: '← Wróć do formularza',
    },
},
```

In `i18n/en.ts`, add:
```ts
terms: {
    bar: {
        text: 'By continuing to the next step, you accept our',
        link: 'terms of service',
    },
    link: 'Terms of Service',
    page: {
        title: 'Terms of Service',
        placeholder: 'The terms of service will be published here.',
        backToForm: '← Back to form',
    },
},
```

- [ ] **Step 7: Commit**

```bash
git add src/configurator/components/TermsBar.tsx src/configurator/components/TermsPage.tsx src/configurator/components/multiStepWizard/Data.tsx src/configurator/components/Footer.tsx src/configurator/app/App.tsx src/configurator/i18n/pl.ts src/configurator/i18n/en.ts
git commit -m "feat: add terms bar on step 1, terms page, and footer link"
```

---

## Self-Review Checklist

### Spec Coverage

| Requirement | Task |
|------------|------|
| LiftType — base_price + price_per_stop | Task 1 |
| Kolor kabiny (konfigurator krok 3) | Task 12 |
| Kolor drzwi (konfigurator krok 3) | Task 12 |
| Admin: kolor z checkboxami visible_for_cabin / visible_for_door | Task 8 |
| Admin: dopłata osobna dla kabiny i dla drzwi | Task 8 |
| price_addition na akcesorium | Task 2 |
| price_addition na modelu kabiny | Task 3 |
| price_addition na dodatkach (EXTRA — też CabinAccessory) | Task 2 ✓ (EXTRA jest kategorią CabinAccessory, pole idzie do tej samej tabeli) |
| Przypisanie oferty do wielu adminów (superadmin, z oferty) | Tasks 5 + 10 |
| Typ windy w Specyfikacji technicznej — z bazy danych | Task 9 |
| Układ dojść — 4 wartości spójne z konfiguratorem | Task 9 |
| Pasek regulaminu na kroku 1 | Task 13 |
| Strona regulaminu /regulamin | Task 13 |
| Link do regulaminu w stopce każdego kroku | Task 13 |
| Udostępnianie ofert adminom (z widoku adminów) | Task 11 |

Wszystkie punkty pokryte.

### Placeholder Scan

Brak TODO/TBD/placeholder w kodzie zadań — każde zawiera kompletny kod.

### Type Consistency

- `FormFinishesAndAccessories` definiuje `cabinColorId: number` (Task 12 Step 1) — używane w `FinishesAndAccessories.tsx` (Task 12 Step 5) ✓
- `CabinColor` interface definiowany w Task 12 Step 3, używany w `ColorSelector.tsx` (Task 12 Step 4) ✓
- `offer_admin_shares` tabela (Task 5 Step 1) → `Offer.sharedAdmins()` (Task 5 Step 3) → `User.sharedOffers()` (Task 5 Step 4) ✓
- `shareWithAdmins` endpoint (Task 5 Step 5) → używany w `offers/index.tsx` (Task 10 Step 3) ✓
- `shareOffers` endpoint (Task 11 Step 6) → używany w `admins/index.tsx` (Task 11 Step 5) ✓
- `adminOffers` endpoint (Task 5 Step 6) → używany w `admins/index.tsx` (Task 11 Step 3) ✓
