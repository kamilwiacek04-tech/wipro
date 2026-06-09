# Pricing Prep — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare the data model and UI for the upcoming pricing function: add elevator compensation coefficients, create `cabin_types` table (replacing the hardcoded access diagram), and add a cabin-door-same-as-landing checkbox in the configurator with color info propagated to offer details and PDF.

**Architecture:** Backend migrations first (Laravel/ddev), then admin panel changes (React, `database/index.tsx`), then configurator changes (step 2 access diagram from DB, step 3 door color checkbox), and finally quote request detail + PDF changes. Each task produces independent, committable work.

**Tech Stack:** Laravel 12 (PHP backend, ddev), React + TypeScript + Tailwind (admin & configurator), RTK Query, Zustand, react-hook-form, yup, react-i18next (pl/en)

---

## File Map

### Backend (`wipro-laravel-backend/`)
| File | Action |
|------|--------|
| `database/migrations/2026_06_09_000001_add_coefficients_to_elevators.php` | Create |
| `database/migrations/2026_06_09_000002_create_cabin_types_table.php` | Create |
| `database/seeders/CabinTypeSeeder.php` | Create |
| `database/seeders/DatabaseSeeder.php` | Modify — call CabinTypeSeeder |
| `app/Models/Elevator.php` | Modify — add 7 coeff fields to `$fillable` + `$casts` |
| `app/Models/CabinType.php` | Create |
| `app/Http/Controllers/Api/ElevatorController.php` | Modify — add coeff fields to validation |
| `app/Http/Controllers/Api/CabinTypeController.php` | Create |
| `routes/api.php` | Modify — register cabin-types routes |

### Admin Frontend (`wipro-react-frontend/src/admin/`)
| File | Action |
|------|--------|
| `app/protected/database/index.tsx` | Modify — add coeff fields to `Elevator` interface + `ElevatorRow` + `updateElevator`; add CabinTypes CRUD section |
| `i18n/pl.ts` | Modify — add coeff + cabinTypes keys |
| `i18n/en.ts` | Modify — add coeff + cabinTypes keys |

### Configurator Frontend (`wipro-react-frontend/src/configurator/`)
| File | Action |
|------|--------|
| `store/mainApi/response.ts` | Modify — add `CabinType` interface + `getCabinTypes` endpoint |
| `components/RadioButtonWithImage.tsx` | Modify — accept `CabinType[]` from API instead of static constant |
| `components/ImagePreview.tsx` | Modify — accept direct `src` URL with fallback to local key |
| `types/multiStepWizard/shaftParameters.ts` | Modify — widen `AccessDiagramType` to `string` |
| `types/multiStepWizard/finishesAndAccessories.ts` | Modify — add `cabinDoorSameAsLanding` + `cabinDoorColorId` |
| `store/zustand/formStore.ts` | Modify — add `cabinDoorSameAsLanding: true`, `cabinDoorColorId: 0` |
| `validators/finishesAndAccessories.ts` | Modify — add new fields |
| `components/multiStepWizard/FinishesAndAccessories.tsx` | Modify — checkbox + conditional door color picker |
| `i18n/pl.ts` | Modify — add door color keys |
| `i18n/en.ts` | Modify — add door color keys |

### Admin + PDF
| File | Action |
|------|--------|
| `wipro-react-frontend/src/admin/app/protected/quoteRequests/detail.tsx` | Modify — add `cabinColorId`, `doorColorId`, `cabinDoorSameAsLanding`, `cabinDoorColorId` to `ConfiguratorData`; add color display in Wykończenie card |
| `wipro-laravel-backend/app/Services/OfferService.php` | Modify — resolve color IDs to names in `generateDocx()` |

---

## Task 1: Migration — Elevator Compensation Coefficients

**Files:**
- Create: `wipro-laravel-backend/database/migrations/2026_06_09_000001_add_coefficients_to_elevators.php`
- Modify: `wipro-laravel-backend/app/Models/Elevator.php`
- Modify: `wipro-laravel-backend/app/Http/Controllers/Api/ElevatorController.php`

- [ ] **Step 1: Create migration**

```php
<?php
// database/migrations/2026_06_09_000001_add_coefficients_to_elevators.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('elevators', function (Blueprint $table) {
            $table->decimal('coeff_stops', 10, 4)->nullable()->after('drawing_throughway_doc');
            $table->decimal('coeff_cabin_model', 10, 4)->nullable()->after('coeff_stops');
            $table->decimal('coeff_cabin_throughway', 10, 4)->nullable()->after('coeff_cabin_model');
            $table->decimal('coeff_cabin_doors', 10, 4)->nullable()->after('coeff_cabin_throughway');
            $table->decimal('coeff_landing_doors', 10, 4)->nullable()->after('coeff_cabin_doors');
            $table->decimal('coeff_ei30', 10, 4)->nullable()->after('coeff_landing_doors');
            $table->decimal('coeff_ei60', 10, 4)->nullable()->after('coeff_ei30');
        });
    }

    public function down(): void
    {
        Schema::table('elevators', function (Blueprint $table) {
            $table->dropColumn([
                'coeff_stops', 'coeff_cabin_model', 'coeff_cabin_throughway',
                'coeff_cabin_doors', 'coeff_landing_doors', 'coeff_ei30', 'coeff_ei60',
            ]);
        });
    }
};
```

- [ ] **Step 2: Run migration**

```bash
cd wipro-laravel-backend && ddev exec php artisan migrate
```

Expected: `Migrated: 2026_06_09_000001_add_coefficients_to_elevators`

- [ ] **Step 3: Update Elevator model**

In `app/Models/Elevator.php`, add to `$fillable` array (after `'drawing_throughway_doc'`):
```php
'coeff_stops', 'coeff_cabin_model', 'coeff_cabin_throughway',
'coeff_cabin_doors', 'coeff_landing_doors', 'coeff_ei30', 'coeff_ei60',
```

Add to `$casts` array:
```php
'coeff_stops'            => 'decimal:4',
'coeff_cabin_model'      => 'decimal:4',
'coeff_cabin_throughway' => 'decimal:4',
'coeff_cabin_doors'      => 'decimal:4',
'coeff_landing_doors'    => 'decimal:4',
'coeff_ei30'             => 'decimal:4',
'coeff_ei60'             => 'decimal:4',
```

- [ ] **Step 4: Update ElevatorController validation**

In `app/Http/Controllers/Api/ElevatorController.php`, in `store()` add after `'equipment'` rule:
```php
'coeff_stops'            => 'nullable|numeric|min:0',
'coeff_cabin_model'      => 'nullable|numeric|min:0',
'coeff_cabin_throughway' => 'nullable|numeric|min:0',
'coeff_cabin_doors'      => 'nullable|numeric|min:0',
'coeff_landing_doors'    => 'nullable|numeric|min:0',
'coeff_ei30'             => 'nullable|numeric|min:0',
'coeff_ei60'             => 'nullable|numeric|min:0',
```

In `update()` add the same rules with `'sometimes|'` prefix on each.

- [ ] **Step 5: Commit**

```bash
git add database/migrations/2026_06_09_000001_add_coefficients_to_elevators.php \
        app/Models/Elevator.php \
        app/Http/Controllers/Api/ElevatorController.php
git commit -m "feat: add compensation coefficient fields to elevators table"
```

---

## Task 2: Admin Panel — Elevator Coefficient Fields UI

**Files:**
- Modify: `wipro-react-frontend/src/admin/app/protected/database/index.tsx`
- Modify: `wipro-react-frontend/src/admin/i18n/pl.ts`
- Modify: `wipro-react-frontend/src/admin/i18n/en.ts`

- [ ] **Step 1: Add coefficient fields to `Elevator` interface**

In `database/index.tsx`, find the `Elevator` interface (around the drawing paths). Add after `drawing_throughway_doc`:
```ts
coeff_stops?: number | null
coeff_cabin_model?: number | null
coeff_cabin_throughway?: number | null
coeff_cabin_doors?: number | null
coeff_landing_doors?: number | null
coeff_ei30?: number | null
coeff_ei60?: number | null
```

- [ ] **Step 2: Add coefficient fields to `nullableFloats` in `updateElevator`**

Find `updateElevator` function (line ~1576). Add all 7 new fields to the `nullableFloats` array:
```ts
const nullableFloats = [
  'base_price', 'lifting_height',
  'coeff_stops', 'coeff_cabin_model', 'coeff_cabin_throughway',
  'coeff_cabin_doors', 'coeff_landing_doors', 'coeff_ei30', 'coeff_ei60',
]
```

- [ ] **Step 3: Add coefficient section to `ElevatorRow` JSX**

In `ElevatorRow`, find the closing `</div>` of the Rysunki section (after the drawings upload block, before `</td>`). Add after it:

```tsx
{/* Współczynniki rekompensujące udźwig */}
<div className="mt-5 pt-4 border-t border-gray-200">
  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
    {t('database.coefficients.sectionTitle')}
  </p>
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
    <TechField label={t('database.coefficients.stops')}         value={localElevator.coeff_stops}            elevatorId={localElevator.id} field="coeff_stops"            onSaved={(id, f, v) => { onUpdate(id, f, v); setLocalElevator(prev => ({ ...prev, coeff_stops: v ? parseFloat(v) : null })) }} type="number" />
    <TechField label={t('database.coefficients.cabinModel')}    value={localElevator.coeff_cabin_model}      elevatorId={localElevator.id} field="coeff_cabin_model"       onSaved={(id, f, v) => { onUpdate(id, f, v); setLocalElevator(prev => ({ ...prev, coeff_cabin_model: v ? parseFloat(v) : null })) }} type="number" />
    <TechField label={t('database.coefficients.cabinThroughway')} value={localElevator.coeff_cabin_throughway} elevatorId={localElevator.id} field="coeff_cabin_throughway"  onSaved={(id, f, v) => { onUpdate(id, f, v); setLocalElevator(prev => ({ ...prev, coeff_cabin_throughway: v ? parseFloat(v) : null })) }} type="number" />
    <TechField label={t('database.coefficients.cabinDoors')}    value={localElevator.coeff_cabin_doors}      elevatorId={localElevator.id} field="coeff_cabin_doors"       onSaved={(id, f, v) => { onUpdate(id, f, v); setLocalElevator(prev => ({ ...prev, coeff_cabin_doors: v ? parseFloat(v) : null })) }} type="number" />
    <TechField label={t('database.coefficients.landingDoors')}  value={localElevator.coeff_landing_doors}    elevatorId={localElevator.id} field="coeff_landing_doors"     onSaved={(id, f, v) => { onUpdate(id, f, v); setLocalElevator(prev => ({ ...prev, coeff_landing_doors: v ? parseFloat(v) : null })) }} type="number" />
    <TechField label={t('database.coefficients.ei30')}          value={localElevator.coeff_ei30}             elevatorId={localElevator.id} field="coeff_ei30"              onSaved={(id, f, v) => { onUpdate(id, f, v); setLocalElevator(prev => ({ ...prev, coeff_ei30: v ? parseFloat(v) : null })) }} type="number" />
    <TechField label={t('database.coefficients.ei60')}          value={localElevator.coeff_ei60}             elevatorId={localElevator.id} field="coeff_ei60"              onSaved={(id, f, v) => { onUpdate(id, f, v); setLocalElevator(prev => ({ ...prev, coeff_ei60: v ? parseFloat(v) : null })) }} type="number" />
  </div>
</div>
```

Note: `TechField` already calls `onSaved` with `(elevatorId, field, value)` signature. The local state update is needed because `localElevator` is used for the displayed values.

- [ ] **Step 4: Add i18n keys**

In `src/admin/i18n/pl.ts`, in the `database` object, add after the `drawings` block:
```ts
coefficients: {
  sectionTitle: 'Współczynniki rekompensujące udźwig',
  stops: 'Ilość przystanków',
  cabinModel: 'Model kabiny',
  cabinThroughway: 'Kabina przelot',
  cabinDoors: 'Drzwi kabinowe',
  landingDoors: 'Drzwi przystankowe',
  ei30: 'EI30',
  ei60: 'EI60',
},
```

In `src/admin/i18n/en.ts`, add after the `drawings` block:
```ts
coefficients: {
  sectionTitle: 'Load Compensation Coefficients',
  stops: 'Number of stops',
  cabinModel: 'Cabin model',
  cabinThroughway: 'Throughway cabin',
  cabinDoors: 'Cabin doors',
  landingDoors: 'Landing doors',
  ei30: 'EI30',
  ei60: 'EI60',
},
```

- [ ] **Step 5: Commit**

```bash
git add src/admin/app/protected/database/index.tsx src/admin/i18n/pl.ts src/admin/i18n/en.ts
git commit -m "feat: add load compensation coefficient section to elevator detail in admin"
```

---

## Task 3: Backend — `cabin_types` Table, Model, Controller, Routes

**Files:**
- Create: `wipro-laravel-backend/database/migrations/2026_06_09_000002_create_cabin_types_table.php`
- Create: `wipro-laravel-backend/database/seeders/CabinTypeSeeder.php`
- Modify: `wipro-laravel-backend/database/seeders/DatabaseSeeder.php`
- Create: `wipro-laravel-backend/app/Models/CabinType.php`
- Create: `wipro-laravel-backend/app/Http/Controllers/Api/CabinTypeController.php`
- Modify: `wipro-laravel-backend/routes/api.php`

- [ ] **Step 1: Create migration**

```php
<?php
// database/migrations/2026_06_09_000002_create_cabin_types_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cabin_types', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('name_pl');
            $table->string('name_en');
            $table->string('image_right_url')->nullable();
            $table->string('image_left_url')->nullable();
            $table->decimal('price', 10, 2)->default(0);
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cabin_types');
    }
};
```

- [ ] **Step 2: Run migration**

```bash
cd wipro-laravel-backend && ddev exec php artisan migrate
```

Expected: `Migrated: 2026_06_09_000002_create_cabin_types_table`

- [ ] **Step 3: Create CabinTypeSeeder**

Create `database/seeders/CabinTypeSeeder.php`:
```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CabinTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['key' => 'FRONT',      'name_pl' => 'Frontowe',    'name_en' => 'Front',      'sort_order' => 1],
            ['key' => 'THROUGHT',   'name_pl' => 'Przelotowe',  'name_en' => 'Throughway', 'sort_order' => 2],
            ['key' => 'CORNER',     'name_pl' => 'Kątowe',      'name_en' => 'Corner',     'sort_order' => 3],
            ['key' => 'TRIPARTITE', 'name_pl' => 'Trójstronne', 'name_en' => 'Tripartite', 'sort_order' => 4],
        ];

        foreach ($types as $type) {
            DB::table('cabin_types')->updateOrInsert(
                ['key' => $type['key']],
                array_merge($type, ['is_active' => true, 'price' => 0, 'created_at' => now(), 'updated_at' => now()])
            );
        }
    }
}
```

- [ ] **Step 4: Call seeder from DatabaseSeeder**

In `database/seeders/DatabaseSeeder.php`, add to the `run()` method:
```php
$this->call(CabinTypeSeeder::class);
```

- [ ] **Step 5: Run seeder**

```bash
ddev exec php artisan db:seed --class=CabinTypeSeeder
```

Expected: `Seeded: Database\Seeders\CabinTypeSeeder`

- [ ] **Step 6: Create CabinType model**

Create `app/Models/CabinType.php`:
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CabinType extends Model
{
    protected $fillable = [
        'key', 'name_pl', 'name_en',
        'image_right_url', 'image_left_url',
        'price', 'sort_order', 'is_active',
    ];

    protected $casts = [
        'is_active'  => 'boolean',
        'price'      => 'decimal:2',
        'sort_order' => 'integer',
    ];
}
```

- [ ] **Step 7: Create CabinTypeController**

Create `app/Http/Controllers/Api/CabinTypeController.php`:
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CabinType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CabinTypeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            CabinType::where('is_active', true)->orderBy('sort_order')->get()
        );
    }

    public function adminIndex(): JsonResponse
    {
        return response()->json(CabinType::orderBy('sort_order')->get());
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $type = CabinType::findOrFail($id);

        $data = $request->validate([
            'name_pl'    => 'sometimes|string|max:200',
            'name_en'    => 'sometimes|string|max:200',
            'price'      => 'sometimes|numeric|min:0',
            'sort_order' => 'sometimes|integer|min:0',
            'is_active'  => 'sometimes|boolean',
        ]);

        $type->update($data);

        return response()->json($type);
    }

    public function uploadImage(Request $request, int $id, string $side): JsonResponse
    {
        if (!in_array($side, ['right', 'left'])) {
            return response()->json(['message' => 'Invalid side.'], 422);
        }

        $request->validate(['image' => 'required|image|max:5120']);

        $type = CabinType::findOrFail($id);

        $field = $side === 'right' ? 'image_right_url' : 'image_left_url';

        if ($type->$field) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $type->$field));
        }

        $path = $request->file('image')->store("cabin-types/{$type->key}", 'public');
        $type->update([$field => '/storage/' . $path]);

        return response()->json($type);
    }
}
```

- [ ] **Step 8: Register routes**

In `routes/api.php`, add to the public routes (alongside `/cabin-colors`):
```php
use App\Http\Controllers\Api\CabinTypeController;

Route::get('/cabin-types', [CabinTypeController::class, 'index']);
```

In the admin routes group (alongside cabin-colors admin routes):
```php
Route::get('/cabin-types', [CabinTypeController::class, 'adminIndex']);
Route::patch('/cabin-types/{id}', [CabinTypeController::class, 'update']);
Route::post('/cabin-types/{id}/image/{side}', [CabinTypeController::class, 'uploadImage']);
```

- [ ] **Step 9: Verify routes**

```bash
ddev exec php artisan route:list --path=cabin-types
```

Expected: lines for `GET /api/cabin-types`, `GET /api/admin/cabin-types`, `PATCH /api/admin/cabin-types/{id}`, `POST /api/admin/cabin-types/{id}/image/{side}`.

- [ ] **Step 10: Commit**

```bash
git add database/migrations/2026_06_09_000002_create_cabin_types_table.php \
        database/seeders/CabinTypeSeeder.php \
        database/seeders/DatabaseSeeder.php \
        app/Models/CabinType.php \
        app/Http/Controllers/Api/CabinTypeController.php \
        routes/api.php
git commit -m "feat: add cabin_types table, model, controller, seeder and routes"
```

---

## Task 4: Admin Panel — Cabin Types CRUD Section

**Files:**
- Modify: `wipro-react-frontend/src/admin/app/protected/database/index.tsx`
- Modify: `wipro-react-frontend/src/admin/i18n/pl.ts`
- Modify: `wipro-react-frontend/src/admin/i18n/en.ts`

- [ ] **Step 1: Add CabinType interface and state near the top of `database/index.tsx`**

Find where other interfaces are defined (e.g., `CabinColor`). Add:
```ts
interface CabinType {
  id: number
  key: string
  name_pl: string
  name_en: string
  image_right_url: string | null
  image_left_url: string | null
  price: string
  sort_order: number
  is_active: boolean
}
```

Near where other state variables for sections are declared (e.g., `const [colors, setColors]`), add:
```ts
const [cabinTypes, setCabinTypes] = useState<CabinType[]>([])
const [loadingCabinTypes, setLoadingCabinTypes] = useState(true)
const [uploadingTypeImage, setUploadingTypeImage] = useState<Record<string, boolean>>({})
```

- [ ] **Step 2: Add load + update + image upload functions**

```ts
const loadCabinTypes = () => {
  setLoadingCabinTypes(true)
  api.get('/admin/cabin-types').then(r => setCabinTypes(r.data)).finally(() => setLoadingCabinTypes(false))
}

useEffect(() => { loadCabinTypes() }, [])

const updateCabinType = async (id: number, field: string, value: unknown) => {
  await api.patch(`/admin/cabin-types/${id}`, { [field]: value })
  loadCabinTypes()
}

const uploadCabinTypeImage = async (id: number, side: 'right' | 'left', file: File) => {
  const key = `${id}-${side}`
  setUploadingTypeImage(prev => ({ ...prev, [key]: true }))
  try {
    const token = authStore.getState().token
    const fd = new FormData()
    fd.append('image', file)
    const res = await fetch(`${apiBase}/admin/cabin-types/${id}/image/${side}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      body: fd,
    })
    if (!res.ok) throw new Error('Upload failed')
    loadCabinTypes()
  } catch {
    toast.error(t('database.errorSave'))
  } finally {
    setUploadingTypeImage(prev => ({ ...prev, [key]: false }))
  }
}
```

- [ ] **Step 3: Add CabinTypes JSX section**

Find the end of the last existing section in the main page JSX (e.g., after the CabinColor section, before the Settings section). Add a new `<Card>`:

```tsx
{/* Typy kabin (schemat dojścia) */}
<Card className="p-6">
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="font-semibold text-gray-900">{t('database.cabinTypes.title')}</h2>
      <p className="text-xs text-gray-400 mt-0.5">{t('database.cabinTypes.subtitle')}</p>
    </div>
  </div>

  {loadingCabinTypes ? (
    <div className="flex justify-center py-8"><SkeletonLoader count={4} /></div>
  ) : (
    <table className="w-full text-left">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.cabinTypes.key')}</th>
          <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.cabinTypes.namePl')}</th>
          <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.cabinTypes.nameEn')}</th>
          <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.cabinTypes.imageRight')}</th>
          <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.cabinTypes.imageLeft')}</th>
          <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('database.cabinTypes.price')}</th>
          <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t('general.active')}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {cabinTypes.map(ct => (
          <tr key={ct.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-mono text-gray-500">{ct.key}</td>
            <td className="px-4 py-3">
              <input
                className="border border-gray-200 rounded px-2 py-1 text-sm w-32"
                defaultValue={ct.name_pl}
                onBlur={e => updateCabinType(ct.id, 'name_pl', e.target.value)}
              />
            </td>
            <td className="px-4 py-3">
              <input
                className="border border-gray-200 rounded px-2 py-1 text-sm w-32"
                defaultValue={ct.name_en}
                onBlur={e => updateCabinType(ct.id, 'name_en', e.target.value)}
              />
            </td>
            {(['right', 'left'] as const).map(side => {
              const urlField = side === 'right' ? 'image_right_url' : 'image_left_url'
              const key = `${ct.id}-${side}`
              return (
                <td key={side} className="px-4 py-3">
                  <div className="flex flex-col gap-1 items-start">
                    {ct[urlField] ? (
                      <img src={ct[urlField]!} alt="" className="h-12 w-16 object-contain rounded border border-gray-200 bg-gray-50" />
                    ) : (
                      <div className="h-12 w-16 rounded border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300 text-xs">—</div>
                    )}
                    <label className="text-xs text-blue-600 cursor-pointer hover:underline">
                      {uploadingTypeImage[key] ? t('database.drawings.uploading') : t('database.uploadImage')}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) uploadCabinTypeImage(ct.id, side, file)
                        }}
                      />
                    </label>
                  </div>
                </td>
              )
            })}
            <td className="px-4 py-3">
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-24 border border-gray-200 rounded px-2 py-1 text-sm"
                defaultValue={ct.price}
                onBlur={e => updateCabinType(ct.id, 'price', parseFloat(e.target.value) || 0)}
              />
            </td>
            <td className="px-4 py-3 text-center">
              <button onClick={() => updateCabinType(ct.id, 'is_active', !ct.is_active)}>
                {ct.is_active
                  ? <ToggleRight className="h-5 w-5 text-green-500" />
                  : <ToggleLeft className="h-5 w-5 text-gray-400" />}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</Card>
```

- [ ] **Step 4: Add i18n keys**

In `src/admin/i18n/pl.ts`, in `database` object, add:
```ts
cabinTypes: {
  title: 'Typy kabin (schemat dojścia)',
  subtitle: 'Zasilają sekcję schematu dojścia w konfiguratorze',
  key: 'Klucz',
  namePl: 'Nazwa (PL)',
  nameEn: 'Nazwa (EN)',
  imageRight: 'Zdj. prawostronne',
  imageLeft: 'Zdj. lewostronne',
  price: 'Cena (PLN)',
},
```

In `src/admin/i18n/en.ts`, add:
```ts
cabinTypes: {
  title: 'Cabin Types (access diagram)',
  subtitle: 'Populate the access diagram section in the configurator',
  key: 'Key',
  namePl: 'Name (PL)',
  nameEn: 'Name (EN)',
  imageRight: 'Right-side image',
  imageLeft: 'Left-side image',
  price: 'Price (PLN)',
},
```

- [ ] **Step 5: Commit**

```bash
git add src/admin/app/protected/database/index.tsx src/admin/i18n/pl.ts src/admin/i18n/en.ts
git commit -m "feat: add cabin types CRUD section in admin database view"
```

---

## Task 5: Configurator Step 2 — Access Diagram from DB

**Files:**
- Modify: `wipro-react-frontend/src/configurator/store/mainApi/response.ts`
- Modify: `wipro-react-frontend/src/configurator/types/multiStepWizard/shaftParameters.ts`
- Modify: `wipro-react-frontend/src/configurator/components/ImagePreview.tsx`
- Modify: `wipro-react-frontend/src/configurator/components/RadioButtonWithImage.tsx`
- Modify: `wipro-react-frontend/src/configurator/components/multiStepWizard/ShaftParameters.tsx`

- [ ] **Step 1: Add `CabinType` interface and query to `response.ts`**

In `src/configurator/store/mainApi/response.ts`, add the interface after `CabinColor`:
```ts
export interface CabinType {
    id: number;
    key: string;
    name_pl: string;
    name_en: string;
    image_right_url: string | null;
    image_left_url: string | null;
    price: string;
    sort_order: number;
    is_active: boolean;
}
```

In the `endpoints` builder (alongside `getCabinColors`), add:
```ts
getCabinTypes: build.query<CabinType[], void>({
    query: () => ({url: '/cabin-types', method: 'GET'})
}),
```

Add `useGetCabinTypesQuery` to the exports:
```ts
export const {
    useLazyFindElevatorQuery,
    useStoreQuoteRequestMutation,
    useGetLiftTypesQuery,
    useGetSettingsQuery,
    useGetCabinModelsQuery,
    useGetCabinAccessoriesQuery,
    useGetCabinColorsQuery,
    useGetCabinTypesQuery,
} = responseEndpoints;
```

- [ ] **Step 2: Widen `AccessDiagramType` to `string`**

In `src/configurator/types/multiStepWizard/shaftParameters.ts`, change:
```ts
export type AccessDiagramType = string;
```

This allows any key returned from the API (currently FRONT/THROUGHT/CORNER/TRIPARTITE but extensible).

- [ ] **Step 3: Update `ImagePreview` to accept a direct URL or a local key**

Replace the entire content of `src/configurator/components/ImagePreview.tsx`:
```tsx
import {images} from '@/constants/images'

interface Props {
    image: string;
    checkboxElement?: React.ReactNode;
}

const ImagePreview = ({image, checkboxElement}: Props) => {
    const src = image.startsWith('http') || image.startsWith('/storage')
        ? image
        : (images[image as keyof typeof images]?.image ?? null)

    return (
        <div className="flex-[3] flex justify-center items-center flex-col">
            {src ? (
                <img src={src} alt="" />
            ) : (
                <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center text-gray-300 text-sm">—</div>
            )}
            {checkboxElement}
        </div>
    )
}

export default ImagePreview
```

- [ ] **Step 4: Update `RadioButtonWithImage` to accept API data**

Replace the content of `src/configurator/components/RadioButtonWithImage.tsx`:
```tsx
import RadioButtonContainer from '@/components/RadioButtonContainer'
import {useTranslation} from 'react-i18next'
import ImagePreview from '@/components/ImagePreview'
import {CabinType} from '@/store/mainApi/response'

interface Props {
    items: CabinType[];
    currentValue: string;
    onChange: (e: string) => void;
    checkboxElement?: React.ReactNode;
    leftMechanic?: boolean;
}

const RadioButtonWithImage = ({items, currentValue, onChange, checkboxElement, leftMechanic}: Props) => {
    const {i18n} = useTranslation()

    const current = items.find(item => item.key === currentValue)
    const imageUrl = current
        ? (leftMechanic ? (current.image_left_url ?? current.image_right_url) : current.image_right_url) ?? ''
        : ''

    const radioItems = items.map(item => ({
        id: item.key,
        title: i18n.language === 'pl' ? item.name_pl : item.name_en,
    }))

    return (
        <div>
            <RadioButtonContainer
                items={radioItems}
                selectedId={currentValue}
                onPress={(e) => onChange(e)}
                title={i18n.t('form.shaftParameters.fields.accessDiagram')}
                columnDirection
            >
                <ImagePreview
                    image={imageUrl}
                    checkboxElement={checkboxElement}
                />
            </RadioButtonContainer>
        </div>
    )
}

export default RadioButtonWithImage
```

- [ ] **Step 5: Update `ShaftParameters.tsx` to pass `CabinType[]` from API**

In `src/configurator/components/multiStepWizard/ShaftParameters.tsx`:

Add the import:
```ts
import {useGetCabinTypesQuery} from '@/store/mainApi/response'
```

Add the query alongside `useGetLiftTypesQuery`:
```ts
const {data: cabinTypes, isLoading: loadingCabinTypes} = useGetCabinTypesQuery()
```

Remove the import of `accessDiagram` from `'@/constants/formShaftParameters'` if it's only used by `RadioButtonWithImage` (check the file for other usages of `accessDiagram`).

Find the `<RadioButtonWithImage>` usage and add the `items` prop:
```tsx
<RadioButtonWithImage
    items={cabinTypes ?? []}
    currentValue={field.value}
    onChange={(e) => {
        updateField('shaftParameters', 'accessDiagram', e)
        field.onChange(e)
    }}
    checkboxElement={
        <Controller
            control={control}
            name='leftSideMechanic'
            render={({ field }) => (
                <CheckboxElement
                    currentValue={field.value}
                    onChange={(e) => {
                        updateField('shaftParameters', 'leftSideMechanic', e)
                        field.onChange(e)
                    }}
                />
            )}
        />
    }
    leftMechanic={getValues('leftSideMechanic')}
/>
```

Note: The `watchedDiagram === 'THROUGHT'` warning banner check still works because `key` values from the DB still use `'THROUGHT'`.

- [ ] **Step 6: Commit**

```bash
git add src/configurator/store/mainApi/response.ts \
        src/configurator/types/multiStepWizard/shaftParameters.ts \
        src/configurator/components/ImagePreview.tsx \
        src/configurator/components/RadioButtonWithImage.tsx \
        src/configurator/components/multiStepWizard/ShaftParameters.tsx
git commit -m "feat: load access diagram cabin types from DB in configurator step 2"
```

---

## Task 6: Configurator Step 3 — Cabin Door Same-As-Landing Checkbox

**Files:**
- Modify: `wipro-react-frontend/src/configurator/types/multiStepWizard/finishesAndAccessories.ts`
- Modify: `wipro-react-frontend/src/configurator/store/zustand/formStore.ts`
- Modify: `wipro-react-frontend/src/configurator/validators/finishesAndAccessories.ts`
- Modify: `wipro-react-frontend/src/configurator/components/multiStepWizard/FinishesAndAccessories.tsx`
- Modify: `wipro-react-frontend/src/configurator/i18n/pl.ts`
- Modify: `wipro-react-frontend/src/configurator/i18n/en.ts`

- [ ] **Step 1: Add new fields to `FormFinishesAndAccessories` type**

In `src/configurator/types/multiStepWizard/finishesAndAccessories.ts`, add after `doorColorId`:
```ts
export interface FormFinishesAndAccessories {
    cabinModelId: number;
    cabinColorId: number;
    doorColorId: number;
    cabinDoorSameAsLanding: boolean;
    cabinDoorColorId: number;
    panelId: number;
    signalId: number;
    ceilingId: number;
    mirrorId: number;
    handrailId: number;
    flooringId: number;
    extraIds: number[];
}
```

- [ ] **Step 2: Update `formStore.ts` initial state**

In `src/configurator/store/zustand/formStore.ts`, in the `finishesAndAccessories` initial state object, add after `doorColorId: 0`:
```ts
cabinDoorSameAsLanding: true,
cabinDoorColorId: 0,
```

- [ ] **Step 3: Update validator**

In `src/configurator/validators/finishesAndAccessories.ts`, add to the schema after `doorColorId` (or alongside the other optional fields):
```ts
export const dataSchema = new yup.ObjectSchema<FormFinishesAndAccessories>({
    cabinModelId: yup.number().required('form.errors.require').min(1, 'form.errors.require'),
    cabinColorId: yup.number().default(0),
    doorColorId: yup.number().default(0),
    cabinDoorSameAsLanding: yup.boolean().default(true),
    cabinDoorColorId: yup.number().default(0),
    panelId: yup.number().default(0),
    signalId: yup.number().default(0),
    ceilingId: yup.number().default(0),
    mirrorId: yup.number().default(0),
    handrailId: yup.number().default(0),
    flooringId: yup.number().default(0),
    extraIds: yup.array().of(yup.number().required()).default([]),
});
```

Note: `cabinColorId` and `doorColorId` were missing from the schema before — add them too.

- [ ] **Step 4: Update `FinishesAndAccessories.tsx` — rename door color label and add checkbox**

In `src/configurator/components/multiStepWizard/FinishesAndAccessories.tsx`:

Add `useWatch` to imports:
```ts
import {Controller, useForm, useWatch} from 'react-hook-form'
```

After `const { formState: { errors }, control, handleSubmit } = useForm(...)`, add:
```ts
const cabinDoorSameAsLanding = useWatch({ control, name: 'cabinDoorSameAsLanding' })
```

Update the `additional_notes` JSON in `onSubmit` to include the new fields:
```ts
cabinColorId: dataCurr.cabinColorId || undefined,
doorColorId: dataCurr.doorColorId || undefined,
cabinDoorSameAsLanding: dataCurr.cabinDoorSameAsLanding,
cabinDoorColorId: dataCurr.cabinDoorSameAsLanding ? undefined : (dataCurr.cabinDoorColorId || undefined),
```

Find the "Kolor drzwi" `<BorderInput>` block. Change its title to `t(`${textPath}.field.landingDoorColor`)` and add the checkbox + conditional block after the existing `<ColorSelector>` inside the `BorderInput`:

```tsx
{/* Kolor drzwi przystankowych */}
{(cabinColors?.filter(c => c.visible_for_door) ?? []).length > 0 && (
    <BorderInput title={t(`${textPath}.field.landingDoorColor`)}>
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

        {/* Checkbox: cabin doors same as landing */}
        <Controller
            control={control}
            name='cabinDoorSameAsLanding'
            render={({field}) => (
                <label className='flex items-center gap-2 mt-3 cursor-pointer select-none'>
                    <input
                        type='checkbox'
                        checked={field.value}
                        onChange={e => {
                            updateField('finishesAndAccessories', 'cabinDoorSameAsLanding', e.target.checked)
                            field.onChange(e.target.checked)
                        }}
                        className='w-4 h-4 accent-[var(--primary)]'
                    />
                    <span className='text-[13px] text-gray-600'>{t(`${textPath}.field.cabinDoorSameAsLanding`)}</span>
                </label>
            )}
        />
    </BorderInput>
)}

{/* Kolor drzwi kabinowych — only when checkbox is false */}
{!cabinDoorSameAsLanding && (cabinColors?.filter(c => c.visible_for_door) ?? []).length > 0 && (
    <BorderInput title={t(`${textPath}.field.cabinDoorColor`)}>
        <Controller
            control={control}
            name='cabinDoorColorId'
            render={({field}) => (
                <ColorSelector
                    items={cabinColors?.filter(c => c.visible_for_door) ?? []}
                    currentValue={field.value}
                    onChange={(id) => {
                        updateField('finishesAndAccessories', 'cabinDoorColorId', id)
                        field.onChange(id)
                    }}
                />
            )}
        />
    </BorderInput>
)}
```

- [ ] **Step 5: Add i18n keys**

In `src/configurator/i18n/pl.ts`, in `form.finishesAndAccessories.field`, change `doorColor` and add new keys:
```ts
landingDoorColor: 'Kolor drzwi przystankowych',
cabinDoorSameAsLanding: 'Drzwi kabinowe takie same jak przystankowe',
cabinDoorColor: 'Kolor drzwi kabinowych',
```

Remove or keep the old `doorColor` key — if removing, search for usages first (`grep -rn "field.doorColor"` in `src/configurator/`). If found elsewhere, keep it as an alias.

In `src/configurator/i18n/en.ts`, add:
```ts
landingDoorColor: 'Landing door color',
cabinDoorSameAsLanding: 'Cabin doors same as landing doors',
cabinDoorColor: 'Cabin door color',
```

- [ ] **Step 6: Commit**

```bash
git add src/configurator/types/multiStepWizard/finishesAndAccessories.ts \
        src/configurator/store/zustand/formStore.ts \
        src/configurator/validators/finishesAndAccessories.ts \
        src/configurator/components/multiStepWizard/FinishesAndAccessories.tsx \
        src/configurator/i18n/pl.ts \
        src/configurator/i18n/en.ts
git commit -m "feat: add cabin-door-same-as-landing checkbox in configurator step 3"
```

---

## Task 7: Offer Detail + PDF — Display Door Colors

**Files:**
- Modify: `wipro-react-frontend/src/admin/app/protected/quoteRequests/detail.tsx`
- Modify: `wipro-laravel-backend/app/Services/OfferService.php`

- [ ] **Step 1: Update `ConfiguratorData` interface in `detail.tsx`**

Find the `ConfiguratorData` interface (around line 145). Add new fields:
```ts
interface ConfiguratorData {
  liftingHeight?: number
  accessCount?: number
  ei30DoorsCount?: number
  ei60DoorsCount?: number
  leftSideMechanic?: boolean
  status?: string
  cabinModelId?: number
  cabinColorId?: number
  doorColorId?: number
  cabinDoorSameAsLanding?: boolean
  cabinDoorColorId?: number
  panelId?: number
  signalId?: number
  ceilingId?: number
  mirrorId?: number
  handrailId?: number
  flooringId?: number
  extraIds?: number[]
  [key: string]: unknown
}
```

- [ ] **Step 2: Load cabin colors in detail.tsx**

Find the state declarations near `const [cabinModels, setCabinModels]`. Add:
```ts
const [cabinColors, setCabinColors] = useState<{id: number; name_pl: string}[]>([])
```

In the `useEffect` that loads lookup data (alongside `api.get('/admin/cabin-models')`), add:
```ts
api.get('/admin/cabin-colors').then(r => setCabinColors(r.data)).catch(() => {})
```

- [ ] **Step 3: Add color picker fields to the Wykończenie card**

In the Wykończenie `<Card>` section (the grid with `DbPickerField` components), add two new fields after `cabinModel`:
```tsx
<DbPickerField
  label={t('quoteRequests.detail.cabinColor')}
  selectedId={config?.cabinColorId}
  options={cabinColors.map(c => ({id: c.id, name: c.name_pl}))}
  onSave={id => saveConfigKey('cabinColorId', id ?? undefined)}
/>
<DbPickerField
  label={t('quoteRequests.detail.landingDoorColor')}
  selectedId={config?.doorColorId}
  options={cabinColors.map(c => ({id: c.id, name: c.name_pl}))}
  onSave={id => saveConfigKey('doorColorId', id ?? undefined)}
/>
```

Then add the conditional cabin door color field:
```tsx
{config?.cabinDoorSameAsLanding === false && (
  <DbPickerField
    label={t('quoteRequests.detail.cabinDoorColor')}
    selectedId={config?.cabinDoorColorId}
    options={cabinColors.map(c => ({id: c.id, name: c.name_pl}))}
    onSave={id => saveConfigKey('cabinDoorColorId', id ?? undefined)}
  />
)}
```

- [ ] **Step 4: Add i18n keys to admin i18n**

In `src/admin/i18n/pl.ts`, in `quoteRequests.detail`, add:
```ts
cabinColor: 'Kolor kabiny',
landingDoorColor: 'Kolor drzwi przystankowych',
cabinDoorColor: 'Kolor drzwi kabinowych',
```

In `src/admin/i18n/en.ts`, add:
```ts
cabinColor: 'Cabin color',
landingDoorColor: 'Landing door color',
cabinDoorColor: 'Cabin door color',
```

- [ ] **Step 5: Update `OfferService.php` to resolve color names in PDF**

In `app/Services/OfferService.php`, inside `generateDocx()`, find where `$finishes` array is built (around line 280). Add color resolution before that block:

```php
// Resolve color names from configurator config
$config         = $this->parseConfiguratorNotes($qr->additional_notes);
$cabinColorId   = (int) ($config['cabinColorId'] ?? 0);
$doorColorId    = (int) ($config['doorColorId'] ?? 0);
$sameAsDoor     = $config['cabinDoorSameAsLanding'] ?? true;
$cabinDoorColorId = (int) ($config['cabinDoorColorId'] ?? 0);

$colorNames = [];
$colorIdsToLookup = array_filter(array_unique([$cabinColorId, $doorColorId, $cabinDoorColorId]));
if (!empty($colorIdsToLookup)) {
    \App\Models\CabinColor::whereIn('id', $colorIdsToLookup)->get()
        ->each(fn($c) => $colorNames[$c->id] = $c->name_pl);
}

$cabinColorName   = $cabinColorId && isset($colorNames[$cabinColorId])   ? $colorNames[$cabinColorId]   : null;
$doorColorName    = $doorColorId  && isset($colorNames[$doorColorId])    ? $colorNames[$doorColorId]    : null;
$cabinDoorName    = (!$sameAsDoor && $cabinDoorColorId && isset($colorNames[$cabinDoorColorId]))
    ? $colorNames[$cabinDoorColorId]
    : ($doorColorName ? $doorColorName . ' (jak przystankowe)' : null);
```

Then extend the `$finishes` array with these values:
```php
$finishes = array_filter([
    'Poręcze'                => $qr->handrail,
    'Podsufitka'             => $qr->ceiling,
    'Oświetlenie'            => $qr->lighting,
    'Podłoga'                => $qr->floor_material,
    'Panel sterow.'          => $qr->control_panel,
    'Kolor kabiny'           => $cabinColorName,
    'Kolor drzwi przyst.'    => $doorColorName,
    'Kolor drzwi kabin.'     => $cabinDoorName,
]);
```

- [ ] **Step 6: Commit all**

```bash
# Frontend
cd wipro-react-frontend
git add src/admin/app/protected/quoteRequests/detail.tsx src/admin/i18n/pl.ts src/admin/i18n/en.ts
git commit -m "feat: add cabin and door color fields to quote request detail view"

# Backend
cd ../wipro-laravel-backend
git add app/Services/OfferService.php
git commit -m "feat: include cabin and door color names in offer PDF"
```

---

## Self-Review Checklist

### Spec Coverage

| Requirement | Task |
|------------|------|
| 7 compensation coefficients on `elevators` table | Task 1 |
| Admin: coefficients section under "Rysunki" in elevator detail | Task 2 |
| `cabin_types` table (name_pl/en, right/left image, price) | Task 3 |
| Admin CRUD for cabin types with image upload | Task 4 |
| Configurator step 2: access diagram from DB instead of static | Task 5 |
| Configurator step 3: "drzwi kabinowe takie same jak przystankowe" checkbox | Task 6 |
| Conditional cabin door color picker when checkbox false | Task 6 |
| Offer detail: show cabin/door colors | Task 7 |
| PDF: include color names in "Wykończenie i akcesoria" section | Task 7 |

All requirements covered.

### Placeholder Scan

None — every step contains actual code.

### Type Consistency

- `CabinType` defined in `response.ts` (Task 5 Step 1) → used in `RadioButtonWithImage.tsx` (Task 5 Step 4) ✓
- `FormFinishesAndAccessories.cabinDoorSameAsLanding` + `cabinDoorColorId` defined (Task 6 Step 1) → used in validator (Task 6 Step 3) and component (Task 6 Step 4) ✓
- `ConfiguratorData.cabinDoorSameAsLanding` + `cabinDoorColorId` (Task 7 Step 1) → used in color display (Task 7 Step 3) ✓
- `CabinColor` model referenced in `OfferService.php` (Task 7 Step 5) — already exists at `app/Models/CabinColor.php` ✓
- `updateCabinType` defined (Task 4 Step 2) → used in JSX (Task 4 Step 3) ✓
- `uploadCabinTypeImage` defined (Task 4 Step 2) → used in JSX (Task 4 Step 3) ✓
- `authStore` used in `uploadCabinTypeImage` (Task 4 Step 2) — already imported in `database/index.tsx` (same pattern as elevator drawings) ✓
