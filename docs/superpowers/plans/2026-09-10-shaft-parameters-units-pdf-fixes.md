# Krok 2 walidacje, jednostki cm, dopasowanie wind, specyfikacja PDF/DOCX — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix client-reported bugs in the elevator configurator: step-2 validation gaps, mm/cm unit inconsistency across configurator/admin/PDF/DOCX, an overly-permissive shaft-dimension elevator matcher, and two field-mapping bugs in the generated technical specification (PDF ×2 and DOCX).

**Architecture:** Backend-first. The `Elevator` model gets a pair of Eloquent accessor/mutator per physical dimension column so the column stays mm on disk (no SQL data migration) while every API consumer (admin CRUD, PDF/DOCX, configurator detail modal) sees and sends cm. `QuoteRequest`'s dimension columns are already cm and stay untouched. A new `OfferService::resolveSpecLabels()` method becomes the single source of truth for the "Przeznaczenie" / "Zespół napędowy" fields, replacing three independent (buggy) copies of the same logic in `tech-spec-pdf.blade.php`, `offer-pdf.blade.php`, and `OfferService::generateDocx()`. Frontend changes follow once the backend contract (cm in, cm out) is fixed.

**Tech Stack:** Laravel 12 / PHPUnit (backend, sqlite in-memory `RefreshDatabase` tests), React + TypeScript + react-hook-form + yup (configurator/admin frontend, no test runner configured — verified via `tsc -b`/`vite build` + manual browser check).

## Global Constraints

- No migration, seeder, or manual `UPDATE` may change existing numeric values already stored in `elevators` or `quote_requests` — only read/write conversion logic and display labels change (per approved spec, section B).
- `liftingHeight` (wysokość podnoszenia) stays in **meters** — out of scope for the cm conversion (approved spec decision).
- Client item 5 ("Długość szybu" new field) is explicitly deferred — do not add it.
- `resources/views/offers/pdf.blade.php` and `OfferService::generatePdf()` are confirmed dead code (not called anywhere) — do not modify them.
- Backend: every new/changed behavior gets a PHPUnit test (`tests/Unit` or `tests/Feature`, `RefreshDatabase`, sqlite in-memory per `phpunit.xml`).
- Frontend: no test runner exists in this repo. Verification is `cd wipro-react-frontend && npm run build` (runs `tsc -b && vite build`) plus, for the final task, a manual check in the browser (dev server) per project convention for UI changes.
- Follow existing code style: no added comments unless documenting a non-obvious constraint: this plan's code already includes the ones that are worth keeping.

---

## File Structure

**Backend (`wipro-laravel-backend/`)**

- Modify `app/Models/Elevator.php` — add mm↔cm accessor/mutator pairs for the 9 physical-dimension columns; drop their now-redundant `integer` casts.
- Modify `app/Http/Controllers/Api/ElevFinderController.php` — cm-based shaft matching, drop the "ignore fit" fallback.
- Modify `app/Services/OfferService.php` — add `resolveSpecLabels(QuoteRequest $qr): array`; use it inside `generateDocx()` instead of its local `$statusMap`/`$purposeLabels`/`$driveRaw` block; fix `[m]`/`mm` labels to `[cm]`.
- Modify `app/Services/OfferPdfService.php` — pass `resolveSpecLabels()` output into both blade views as `$spec`.
- Modify `resources/views/offers/tech-spec-pdf.blade.php` and `resources/views/offers/offer-pdf.blade.php` — read `$spec['purposeLabel']` / `$spec['driveTypeLabel']` instead of local `$statusMap`/`$purposeLabels[$driveRaw]`; fix dimension unit labels to `[cm]`.
- New `tests/Unit/ElevatorUnitConversionTest.php`, `tests/Feature/ElevatorAdminCmRoundTripTest.php`, `tests/Feature/ElevFinderShaftMatchTest.php`, `tests/Feature/QuoteRequestShaftPersistenceTest.php`, `tests/Unit/OfferServiceSpecLabelsTest.php`.

**Frontend configurator (`wipro-react-frontend/src/configurator/`)**

- Modify `validators/shaftParameters.ts` — `accessCount` min tied to `stopDoorsCount`; `pitDepth`/`headroom` min 270.
- Modify `components/multiStepWizard/ShaftParameters.tsx` — cm labels for `shaftLen`/`shaftDep`; non-blocking 270–340cm warning banner for `pitDepth`/`headroom`.
- Modify `i18n/pl.ts`, `i18n/en.ts` — label/unit and new warning-message keys.
- Modify `store/mainApi/response.ts` — add `shaft_width`/`shaft_depth` to `StoreQuoteRequestBody`.
- Modify `store/slices/formSlice.ts` — add `shaftTempParameters` selector.
- Modify `components/multiStepWizard/FinishesAndAccessories.tsx` — send `shaft_width`/`shaft_depth` (cm) in the quote-request payload.
- Modify `components/ElevatorDetailModal.tsx` — `mm` → `cm` on the 9 dimension rows (values already arrive in cm once the backend accessor ships).

**Frontend admin (`wipro-react-frontend/src/admin/`)**

- Modify `i18n/pl.ts`, `i18n/en.ts` — `[mm]` → `[cm]` for elevator/quote-request dimension labels.
- Modify `app/protected/quoteRequests/detail.tsx` — hardcoded `unit="mm"` → `unit="cm"` (4 fields).

---

## Task 1: `Elevator` model — mm↔cm accessor/mutator pair

**Files:**
- Modify: `wipro-laravel-backend/app/Models/Elevator.php`
- Test: `wipro-laravel-backend/tests/Unit/ElevatorUnitConversionTest.php`

**Interfaces:**
- Produces: `Elevator::shaft_width/shaft_depth/pit_depth/overhead/cabin_width/cabin_depth/cabin_height/door_width/door_height` now read/write **cm** through the Eloquent attribute API (`$elevator->shaft_width`, `Elevator::create([...])`, `$elevator->update([...])`, JSON serialization). The underlying DB column keeps storing **mm**, unconverted, exactly as today.

Confirmed from real data (`ddev artisan tinker`): the only seeded elevator has `shaft_width=1250, shaft_depth=1350, pit_depth=1100, overhead=3400, cabin_width=780, cabin_depth=1000, cabin_height=2100` — only sensible as millimeters (e.g. `overhead=3400`mm = 3.4m, a realistic overhead). Admin panel (`admin/i18n/pl.ts`) already labels every one of these `[mm]`.

- [ ] **Step 1: Write the failing test**

```php
<?php

namespace Tests\Unit;

use App\Models\Elevator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ElevatorUnitConversionTest extends TestCase
{
    use RefreshDatabase;

    private function baseAttrs(): array
    {
        return [
            'model' => 'E-400',
            'manufacturer' => 'WIPRO',
            'capacity' => 400,
            'persons' => 5,
            'cabin_width' => 100,
            'cabin_depth' => 100,
            'cabin_height' => 210,
            'speed' => 1.0,
            'max_stops' => 8,
        ];
    }

    public function test_dimensions_are_stored_as_mm_but_exposed_as_cm(): void
    {
        $elevator = Elevator::create($this->baseAttrs() + [
            'shaft_width' => 125,
            'shaft_depth' => 135,
            'pit_depth' => 110,
            'overhead' => 340,
            'door_width' => 80,
            'door_height' => 200,
        ]);

        $this->assertSame(125, $elevator->shaft_width);
        $this->assertSame(135, $elevator->shaft_depth);
        $this->assertSame(110, $elevator->pit_depth);
        $this->assertSame(340, $elevator->overhead);
        $this->assertSame(100, $elevator->cabin_width);
        $this->assertSame(100, $elevator->cabin_depth);
        $this->assertSame(210, $elevator->cabin_height);
        $this->assertSame(80, $elevator->door_width);
        $this->assertSame(200, $elevator->door_height);

        $rawMm = \DB::table('elevators')->where('id', $elevator->id)->first();
        $this->assertSame(1250, $rawMm->shaft_width);
        $this->assertSame(1350, $rawMm->shaft_depth);
        $this->assertSame(1100, $rawMm->pit_depth);
        $this->assertSame(3400, $rawMm->overhead);
        $this->assertSame(1000, $rawMm->cabin_width);
        $this->assertSame(800, $rawMm->door_width);
        $this->assertSame(2000, $rawMm->door_height);
    }

    public function test_null_dimensions_stay_null_through_the_conversion(): void
    {
        $elevator = Elevator::create($this->baseAttrs());

        $this->assertNull($elevator->shaft_width);
        $this->assertNull($elevator->pit_depth);
        $this->assertNull($elevator->overhead);
    }

    public function test_legacy_mm_row_reads_back_as_cm(): void
    {
        $id = \DB::table('elevators')->insertGetId(array_merge($this->baseAttrs(), [
            'shaft_width' => 1250,
            'shaft_depth' => 1350,
            'pit_depth' => 1100,
            'overhead' => 3400,
            'cabin_width' => 780,
            'cabin_depth' => 1000,
            'cabin_height' => 2100,
            'created_at' => now(),
            'updated_at' => now(),
        ]));

        $elevator = Elevator::find($id);

        $this->assertSame(125, $elevator->shaft_width);
        $this->assertSame(340, $elevator->overhead);
        $this->assertSame(78, $elevator->cabin_width);
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd wipro-laravel-backend && ddev artisan test --filter=ElevatorUnitConversionTest`
Expected: FAIL — `$elevator->shaft_width` returns `1250` (raw mm), not `125`.

- [ ] **Step 3: Add the accessor/mutator pairs and drop the redundant integer casts**

In `app/Models/Elevator.php`, add the import and remove `'cabin_width' => 'integer', 'cabin_depth' => 'integer', 'cabin_height' => 'integer', 'shaft_width' => 'integer', 'shaft_depth' => 'integer', 'pit_depth' => 'integer', 'overhead' => 'integer', 'door_width' => 'integer', 'door_height' => 'integer',` from `$casts` (leave `is_active`, `capacity`, `persons`, `speed`, `base_price`, `lifting_height`, and the `coeff_*`/`stop_surcharge_rate` casts untouched):

```php
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Elevator extends Model
{
    // ...(fillable unchanged)...

    protected $casts = [
        'is_active' => 'boolean',
        'capacity' => 'integer',
        'persons' => 'integer',
        'speed' => 'decimal:1',
        'base_price' => 'decimal:2',
        'lifting_height' => 'decimal:2',
        'coeff_stops'            => 'decimal:4',
        'stop_surcharge_rate'    => 'decimal:2',
        'coeff_cabin_model'      => 'decimal:4',
        'coeff_cabin_throughway' => 'decimal:4',
        'coeff_cabin_doors'      => 'decimal:4',
        'coeff_landing_doors'    => 'decimal:4',
        'coeff_ei30'             => 'decimal:4',
        'coeff_ei60'             => 'decimal:4',
    ];

    // Stored in mm on disk (legacy); every app-facing read/write is cm.
    // See docs/superpowers/specs/2026-09-10-shaft-parameters-units-pdf-fixes-design.md section B.
    protected function shaftWidth(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => is_null($value) ? null : (int) round($value / 10),
            set: fn ($value) => is_null($value) ? null : (int) round($value * 10),
        );
    }

    protected function shaftDepth(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => is_null($value) ? null : (int) round($value / 10),
            set: fn ($value) => is_null($value) ? null : (int) round($value * 10),
        );
    }

    protected function pitDepth(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => is_null($value) ? null : (int) round($value / 10),
            set: fn ($value) => is_null($value) ? null : (int) round($value * 10),
        );
    }

    protected function overhead(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => is_null($value) ? null : (int) round($value / 10),
            set: fn ($value) => is_null($value) ? null : (int) round($value * 10),
        );
    }

    protected function cabinWidth(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => is_null($value) ? null : (int) round($value / 10),
            set: fn ($value) => is_null($value) ? null : (int) round($value * 10),
        );
    }

    protected function cabinDepth(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => is_null($value) ? null : (int) round($value / 10),
            set: fn ($value) => is_null($value) ? null : (int) round($value * 10),
        );
    }

    protected function cabinHeight(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => is_null($value) ? null : (int) round($value / 10),
            set: fn ($value) => is_null($value) ? null : (int) round($value * 10),
        );
    }

    protected function doorWidth(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => is_null($value) ? null : (int) round($value / 10),
            set: fn ($value) => is_null($value) ? null : (int) round($value * 10),
        );
    }

    protected function doorHeight(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => is_null($value) ? null : (int) round($value / 10),
            set: fn ($value) => is_null($value) ? null : (int) round($value * 10),
        );
    }

    public function elements(): HasMany
    {
        return $this->hasMany(ElevatorElement::class);
    }

    public function quoteRequests(): HasMany
    {
        return $this->hasMany(QuoteRequest::class);
    }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd wipro-laravel-backend && ddev artisan test --filter=ElevatorUnitConversionTest`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd wipro-laravel-backend
git add app/Models/Elevator.php tests/Unit/ElevatorUnitConversionTest.php
git commit -m "$(cat <<'EOF'
fix: expose Elevator dimensions in cm while keeping mm storage

The elevators table stores shaft/cabin/pit/overhead/door dimensions in
millimeters (confirmed from live data), but admin UI and PDFs need to
show/accept centimeters. Add accessor/mutator pairs on the Elevator model
so the conversion happens once, without touching any stored value.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018w7iKNYqhX49giyEuL9s5v
EOF
)"
```

---

## Task 2: Admin elevator API round-trips cm end-to-end

**Files:**
- Test: `wipro-laravel-backend/tests/Feature/ElevatorAdminCmRoundTripTest.php`

**Interfaces:**
- Consumes: `Elevator` accessors/mutators from Task 1 (already wired into `ElevatorController::store/update/index/show`, no controller code changes needed — the validation rules and `Elevator::create($data)`/`$elevator->update($data)` calls are unit-agnostic and pass straight through the model).

This task is a pure regression test proving `POST /api/admin/elevators`, `GET /api/admin/elevators`, and `GET /api/admin/elevators/{id}` all speak cm now, exactly as the admin frontend will expect after Task 10.

- [ ] **Step 1: Write the failing test**

```php
<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ElevatorAdminCmRoundTripTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_creates_elevator_with_cm_and_reads_back_cm(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $response = $this->postJson('/api/admin/elevators', [
            'model' => 'E-500',
            'manufacturer' => 'WIPRO',
            'capacity' => 500,
            'persons' => 6,
            'cabin_width' => 110,
            'cabin_depth' => 120,
            'cabin_height' => 220,
            'shaft_width' => 140,
            'shaft_depth' => 150,
            'pit_depth' => 120,
            'overhead' => 320,
            'speed' => 1.0,
            'max_stops' => 10,
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('shaft_width', 140);
        $response->assertJsonPath('overhead', 320);

        $id = $response->json('id');
        $raw = \DB::table('elevators')->where('id', $id)->first();
        $this->assertSame(1400, $raw->shaft_width);
        $this->assertSame(3200, $raw->overhead);

        $show = $this->getJson("/api/admin/elevators/{$id}");
        $show->assertStatus(200);
        $show->assertJsonPath('shaft_width', 140);
        $show->assertJsonPath('pit_depth', 120);
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd wipro-laravel-backend && ddev artisan test --filter=ElevatorAdminCmRoundTripTest`
Expected: FAIL if Task 1 is not yet applied (`shaft_width` would be `1400` in the JSON response, not `140`). If Task 1 is already committed, this test should already PASS — treat that as confirmation, run it anyway.

- [ ] **Step 3: (No production code change expected)**

If the test fails after Task 1 is merged, the bug is in `ElevatorController` bypassing the model (e.g. a raw `DB::table()` call) — inspect `app/Http/Controllers/Api/ElevatorController.php` `store`/`update`/`index`/`show` and fix so all reads/writes go through `Elevator::create()`/`$elevator->update()`/Eloquent queries.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd wipro-laravel-backend && ddev artisan test --filter=ElevatorAdminCmRoundTripTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd wipro-laravel-backend
git add tests/Feature/ElevatorAdminCmRoundTripTest.php
git commit -m "$(cat <<'EOF'
test: lock in cm round-trip through the admin elevator API

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018w7iKNYqhX49giyEuL9s5v
EOF
)"
```

---

## Task 3: `ElevFinderController` — cm-based shaft matching, drop the "any elevator" fallback

**Files:**
- Modify: `wipro-laravel-backend/app/Http/Controllers/Api/ElevFinderController.php`
- Test: `wipro-laravel-backend/tests/Feature/ElevFinderShaftMatchTest.php`

**Interfaces:**
- Consumes: `POST /elevFinder` body `{ shaftLen, shaftDep }` — **now centimeters** (was meters), matching the configurator UI change in Task 8.
- Consumes: `Elevator` cm accessors from Task 1 are irrelevant here — this controller uses the query builder (`where(...)`, `orderByRaw(...)`), which reads the **raw mm column**, not the Eloquent accessor. The conversion factor must stay explicit in this controller.

Current bug (point 4 of the client's request): when no elevator fits within 5% of the requested shaft, `findByShaft` falls back to "closest elevator regardless of fit" — i.e. it can suggest an elevator that is *larger* than the shaft. This task removes that fallback for the shaft-dimension path only; `findByCapacity`'s fallback is untouched (client confirmed capacity matching already works well).

- [ ] **Step 1: Write the failing tests**

```php
<?php

namespace Tests\Feature;

use App\Models\Elevator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ElevFinderShaftMatchTest extends TestCase
{
    use RefreshDatabase;

    private function makeElevator(int $shaftWidthCm, int $shaftDepthCm, string $model = 'E-TEST'): Elevator
    {
        return Elevator::create([
            'model' => $model,
            'manufacturer' => 'WIPRO',
            'capacity' => 400,
            'persons' => 5,
            'cabin_width' => 100,
            'cabin_depth' => 100,
            'cabin_height' => 210,
            'shaft_width' => $shaftWidthCm,
            'shaft_depth' => $shaftDepthCm,
            'speed' => 1.0,
            'max_stops' => 8,
            'is_active' => true,
        ]);
    }

    public function test_matches_elevator_that_fits_in_requested_shaft_cm(): void
    {
        $fits = $this->makeElevator(125, 135, 'FITS');

        $response = $this->postJson('/api/elevFinder', ['shaftLen' => 130, 'shaftDep' => 140]);

        $response->assertStatus(200);
        $response->assertJsonPath('status', 2);
        $response->assertJsonPath('data.0.id', $fits->id);
    }

    public function test_does_not_suggest_elevator_too_large_for_the_shaft(): void
    {
        $this->makeElevator(200, 200, 'TOO-BIG');

        $response = $this->postJson('/api/elevFinder', ['shaftLen' => 130, 'shaftDep' => 140]);

        $response->assertStatus(200);
        $response->assertJsonPath('status', 1);
        $response->assertJsonPath('data', []);
    }
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd wipro-laravel-backend && ddev artisan test --filter=ElevFinderShaftMatchTest`
Expected: FAIL — `test_matches_elevator_that_fits_in_requested_shaft_cm` fails because the controller still multiplies by 1000 (treats `130` as `130m`); `test_does_not_suggest_elevator_too_large_for_the_shaft` fails because the current fallback still returns the too-big elevator.

- [ ] **Step 3: Fix the controller**

In `app/Http/Controllers/Api/ElevFinderController.php`:

```php
    public function find(Request $request): JsonResponse
    {
        $liftCapacity = $request->input('liftCapacity');
        $shaftLen     = $request->input('shaftLen'); // centimetres
        $shaftDep     = $request->input('shaftDep'); // centimetres

        if ($liftCapacity !== null) {
            return $this->findByCapacity((float) $liftCapacity);
        }

        if ($shaftLen !== null && $shaftDep !== null) {
            return $this->findByShaft((float) $shaftLen, (float) $shaftDep);
        }

        return response()->json([
            'status' => 0,
            'data'   => [],
            'error'  => 'Podaj udźwig lub wymiary szybu.',
        ]);
    }
```

(Only the two comments change — the dispatch logic is otherwise identical.)

```php
    private function findByShaft(float $lenCm, float $depCm): JsonResponse
    {
        $lenMm = $lenCm * 10;
        $depMm = $depCm * 10;

        $base = Elevator::where('is_active', true);

        // Only elevators that fit in the shaft (with 5 % installation tolerance).
        $elevators = (clone $base)
            ->where('shaft_width', '<=', $lenMm * 1.05)
            ->where('shaft_depth', '<=', $depMm * 1.05)
            ->orderByRaw('ABS(shaft_width - ?) + ABS(shaft_depth - ?)', [$lenMm, $depMm])
            ->limit(8)
            ->get();

        if ($elevators->isEmpty()) {
            return response()->json([
                'status' => 1,
                'data'   => [],
                'info'   => 'Brak wind pasujących do podanych wymiarów szybu.',
            ]);
        }

        return response()->json([
            'status' => 2,
            'data'   => $this->map($elevators),
        ]);
    }
```

(The whole "Fallback: closest by shaft dimensions regardless of fit" block is deleted — no elevator larger than the shaft is ever returned.)

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd wipro-laravel-backend && ddev artisan test --filter=ElevFinderShaftMatchTest`
Expected: PASS (2 tests)

- [ ] **Step 5: Run the full backend test suite to check nothing else broke**

Run: `cd wipro-laravel-backend && ddev artisan test`
Expected: PASS (all tests, including Tasks 1–2)

- [ ] **Step 6: Commit**

```bash
cd wipro-laravel-backend
git add app/Http/Controllers/Api/ElevFinderController.php tests/Feature/ElevFinderShaftMatchTest.php
git commit -m "$(cat <<'EOF'
fix: only suggest elevators that fit the requested shaft (cm input)

/elevFinder previously fell back to "closest elevator regardless of fit"
when nothing matched within tolerance, so it could suggest an elevator
larger than the customer's shaft. Also switches the shaft-length input
from meters to centimeters to match the configurator/admin unit change.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018w7iKNYqhX49giyEuL9s5v
EOF
)"
```

---

## Task 4: Lock in that `quote_requests.shaft_width/shaft_depth` persist untouched (cm, no conversion)

**Files:**
- Test: `wipro-laravel-backend/tests/Feature/QuoteRequestShaftPersistenceTest.php`

**Interfaces:**
- Consumes: `POST /quote-requests` — already accepts `shaft_width`/`shaft_depth` as `nullable|integer` (see `QuoteRequestController::store`, existing validation array) and is `QuoteRequest::$fillable`. No backend code change is required for this task; it is a regression test that pins the contract the frontend (Task 9) will rely on: whatever integer the configurator sends is stored as-is (cm), no ×10/×1000 conversion, unlike `Elevator`.

- [ ] **Step 1: Write the test**

```php
<?php

namespace Tests\Feature;

use App\Models\QuoteRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuoteRequestShaftPersistenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_shaft_width_and_depth_are_stored_verbatim_in_cm(): void
    {
        $response = $this->postJson('/api/quote-requests', [
            'investor_name' => 'Jan Kowalski',
            'investor_email' => 'jan.kowalski@example.com',
            'shaft_width' => 140,
            'shaft_depth' => 150,
            'pit_depth' => 120,
            'overhead' => 320,
        ]);

        $response->assertStatus(201);

        $quoteRequest = QuoteRequest::where('request_number', $response->json('request_number'))->firstOrFail();

        $this->assertSame(140, $quoteRequest->shaft_width);
        $this->assertSame(150, $quoteRequest->shaft_depth);
        $this->assertSame(120, $quoteRequest->pit_depth);
        $this->assertSame(320, $quoteRequest->overhead);
    }
}
```

- [ ] **Step 2: Run the test**

Run: `cd wipro-laravel-backend && ddev artisan test --filter=QuoteRequestShaftPersistenceTest`
Expected: PASS immediately (no production code change needed — this documents existing, correct behavior so a future regression is caught).

- [ ] **Step 3: If it fails**

If `shaft_width`/`shaft_depth` are missing from the persisted row, check `app/Http/Controllers/Api/QuoteRequestController.php::store()` — both fields must appear in the `$request->validate([...])` array (they already do) and in `QuoteRequest::$fillable` (they already do). Re-run until green.

- [ ] **Step 4: Commit**

```bash
cd wipro-laravel-backend
git add tests/Feature/QuoteRequestShaftPersistenceTest.php
git commit -m "$(cat <<'EOF'
test: pin quote_requests shaft_width/shaft_depth as unconverted cm

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018w7iKNYqhX49giyEuL9s5v
EOF
)"
```

---

## Task 5: `OfferService::resolveSpecLabels()` — fix "Przeznaczenie" and "Zespół napędowy" at the source

**Files:**
- Modify: `wipro-laravel-backend/app/Services/OfferService.php`
- Test: `wipro-laravel-backend/tests/Unit/OfferServiceSpecLabelsTest.php`

**Interfaces:**
- Produces: `OfferService::resolveSpecLabels(QuoteRequest $qr): array` returning `['purposeLabel' => ?string, 'driveTypeLabel' => ?string]`.
  - `purposeLabel` is the real elevator purpose (`PASSENGER/FREIGHT_PASSENGER/HOSPITAL/FIRE`, which is what `quote_requests.drive_type` actually holds — set from the configurator's `liftPurpose` field, see `FinishesAndAccessories.tsx:112`) mapped to Polish, e.g. `Osobowy`/`Pożarowy`. This is what "Przeznaczenie" must show.
  - `driveTypeLabel` is the matched elevator's real `drive_type` (free text set by admin, e.g. `Elektryczny bezreduktorowy`) — what "Zespół napędowy → Typ" must show. Requires `$qr->relationLoaded('elevator')` or lazy-loads it.
- Consumes (Task 1): nothing from `Elevator`'s cm accessors — `drive_type` is a plain string column, untouched by Task 1.

Today, three near-identical blocks (`tech-spec-pdf.blade.php:28-42`, `offer-pdf.blade.php:138-152`, `OfferService::generateDocx():159-179`) compute `$statusLabel` from `$parsedNotes['status']` (the *requester's* role — contractor/architect/owner/cost-estimator, from `constants/formData.ts` `StatusData`) through a garbled map mixing that enum with `LiftPurposeType` keys — hence the client's "Przeznaczenie: Budowalny" bug (no such purpose exists; `CONTRACTOR` was mapped to `'Budowlany'`, a value from neither real enum). Meanwhile "Zespół napędowy → Typ" reads `$qr->drive_type` — which actually stores `liftPurpose` — through `$purposeLabels`, so it shows a lift purpose (e.g. `Osobowy`) instead of a drive type.

- [ ] **Step 1: Write the failing test**

```php
<?php

namespace Tests\Unit;

use App\Models\Elevator;
use App\Models\QuoteRequest;
use App\Services\OfferService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OfferServiceSpecLabelsTest extends TestCase
{
    use RefreshDatabase;

    public function test_purpose_label_comes_from_real_lift_purpose(): void
    {
        $elevator = Elevator::create([
            'model' => 'E-400', 'manufacturer' => 'WIPRO', 'capacity' => 400, 'persons' => 5,
            'cabin_width' => 100, 'cabin_depth' => 100, 'cabin_height' => 210,
            'speed' => 1.0, 'max_stops' => 8,
            'drive_type' => 'Elektryczny bezreduktorowy',
        ]);
        $qr = QuoteRequest::create([
            'request_number' => 'WPR-2026-901',
            'investor_name' => 'Jan Kowalski',
            'investor_email' => 'jan@example.com',
            'drive_type' => 'FIRE',
            'elevator_id' => $elevator->id,
        ]);

        $labels = (new OfferService())->resolveSpecLabels($qr->fresh(['elevator']));

        $this->assertSame('Pożarowy', $labels['purposeLabel']);
        $this->assertSame('Elektryczny bezreduktorowy', $labels['driveTypeLabel']);
    }

    public function test_all_four_purpose_values_map_correctly(): void
    {
        $service = new OfferService();
        $cases = [
            'PASSENGER'         => 'Osobowy',
            'FREIGHT_PASSENGER' => 'Pasażersko-towarowy',
            'HOSPITAL'          => 'Szpitalny',
            'FIRE'              => 'Pożarowy',
        ];

        foreach ($cases as $raw => $expected) {
            $qr = QuoteRequest::create([
                'request_number' => 'WPR-2026-' . $raw,
                'investor_name' => 'Jan Kowalski',
                'investor_email' => strtolower($raw) . '@example.com',
                'drive_type' => $raw,
            ]);

            $this->assertSame($expected, $service->resolveSpecLabels($qr->fresh(['elevator']))['purposeLabel']);
        }
    }

    public function test_missing_purpose_and_elevator_resolve_to_null(): void
    {
        $qr = QuoteRequest::create([
            'request_number' => 'WPR-2026-902',
            'investor_name' => 'Jan Kowalski',
            'investor_email' => 'jan2@example.com',
        ]);

        $labels = (new OfferService())->resolveSpecLabels($qr->fresh(['elevator']));

        $this->assertNull($labels['purposeLabel']);
        $this->assertNull($labels['driveTypeLabel']);
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd wipro-laravel-backend && ddev artisan test --filter=OfferServiceSpecLabelsTest`
Expected: FAIL — `resolveSpecLabels` does not exist yet.

- [ ] **Step 3: Add the method**

In `app/Services/OfferService.php`, add (near `parseConfiguratorNotes`, before its closing brace — it's a `public` method on the same class already `use`-ing `App\Models\QuoteRequest`):

```php
    public function resolveSpecLabels(QuoteRequest $qr): array
    {
        $purposeLabels = [
            'PASSENGER'         => 'Osobowy',
            'FREIGHT_PASSENGER' => 'Pasażersko-towarowy',
            'HOSPITAL'          => 'Szpitalny',
            'FIRE'              => 'Pożarowy',
        ];

        return [
            'purposeLabel'   => $purposeLabels[$qr->drive_type] ?? $qr->drive_type,
            'driveTypeLabel' => $qr->elevator?->drive_type,
        ];
    }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd wipro-laravel-backend && ddev artisan test --filter=OfferServiceSpecLabelsTest`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd wipro-laravel-backend
git add app/Services/OfferService.php tests/Unit/OfferServiceSpecLabelsTest.php
git commit -m "$(cat <<'EOF'
feat: add OfferService::resolveSpecLabels() as the single source of
truth for spec purpose/drive-type labels

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018w7iKNYqhX49giyEuL9s5v
EOF
)"
```

---

## Task 6: Wire `resolveSpecLabels()` into both PDFs and the DOCX; fix `[cm]` labels

**Files:**
- Modify: `wipro-laravel-backend/app/Services/OfferPdfService.php`
- Modify: `wipro-laravel-backend/resources/views/offers/tech-spec-pdf.blade.php`
- Modify: `wipro-laravel-backend/resources/views/offers/offer-pdf.blade.php`
- Modify: `wipro-laravel-backend/app/Services/OfferService.php` (inside `generateDocx()`)
- Test: `wipro-laravel-backend/tests/Feature/SpecDocumentGenerationTest.php`

**Interfaces:**
- Consumes: `OfferService::resolveSpecLabels()` from Task 5; `Elevator` cm accessors from Task 1 (so `$el?->shaft_width` etc. are already cm — no numeric change needed here, only label text).

- [ ] **Step 1: Write the failing tests (smoke tests — no PDF/DOCX text-extraction dependency in this repo, so assert the pipeline runs end-to-end without error and produces non-empty output)**

```php
<?php

namespace Tests\Feature;

use App\Models\Elevator;
use App\Models\Offer;
use App\Models\QuoteRequest;
use App\Services\OfferPdfService;
use App\Services\OfferService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SpecDocumentGenerationTest extends TestCase
{
    use RefreshDatabase;

    private function makeQuoteRequestWithOffer(): array
    {
        $elevator = Elevator::create([
            'model' => 'E-400', 'manufacturer' => 'WIPRO', 'capacity' => 400, 'persons' => 5,
            'cabin_width' => 100, 'cabin_depth' => 100, 'cabin_height' => 210,
            'shaft_width' => 125, 'shaft_depth' => 135, 'pit_depth' => 110, 'overhead' => 340,
            'speed' => 1.0, 'max_stops' => 8, 'drive_type' => 'Elektryczny bezreduktorowy',
        ]);
        $qr = QuoteRequest::create([
            'request_number' => 'WPR-2026-910',
            'investor_name' => 'Jan Kowalski',
            'investor_email' => 'jan910@example.com',
            'drive_type' => 'FIRE',
            'stops' => 5,
            'pit_depth' => 200,
            'overhead' => 300,
            'elevator_id' => $elevator->id,
        ]);
        $offer = Offer::create([
            'quote_request_id' => $qr->id,
            'offer_number' => 'WPR-2026-910/OF/1',
            'version' => 1,
            'status' => 'sent',
            'total_price_net' => 0,
            'total_price_gross' => 0,
            'vat_rate' => 23,
        ]);

        return [$qr, $offer];
    }

    public function test_tech_spec_pdf_generates_and_contains_correct_purpose_not_investor_status(): void
    {
        [$qr] = $this->makeQuoteRequestWithOffer();

        $pdfBytes = (new OfferPdfService())->generateTechSpec($qr->fresh(['elevator']));

        $this->assertStringStartsWith('%PDF', $pdfBytes);
        $this->assertGreaterThan(1000, strlen($pdfBytes));
    }

    public function test_offer_pdf_generates_successfully(): void
    {
        [$qr, $offer] = $this->makeQuoteRequestWithOffer();

        $path = (new OfferPdfService())->generate($qr->fresh(['elevator']), $offer);

        $this->assertTrue(\Storage::exists($path));
    }

    public function test_docx_generates_successfully_with_shared_labels(): void
    {
        [, $offer] = $this->makeQuoteRequestWithOffer();

        $path = (new OfferService())->generateDocx($offer->fresh());

        $this->assertTrue(\Storage::exists($path));
    }
}
```

- [ ] **Step 2: Run the tests**

Run: `cd wipro-laravel-backend && ddev artisan test --filter=SpecDocumentGenerationTest`
Expected: PASS already (these are smoke tests of the existing pipeline — they confirm nothing breaks structurally). If any fails, fix the underlying error before proceeding to Step 3; note the failure and resolve it (e.g. a missing required model field) rather than skipping.

- [ ] **Step 3: Wire `resolveSpecLabels()` into `OfferPdfService`**

In `app/Services/OfferPdfService.php`, `generate()` — add `$spec` to the view data:

```php
        $offerService = new OfferService();
        $parsedNotes  = $offerService->parseConfiguratorNotes($quoteRequest->additional_notes);
        $spec         = $offerService->resolveSpecLabels($quoteRequest);
```

(insert the new line right after the existing `$parsedNotes` line), and add `'spec'` to the `compact(...)` call:

```php
        $pdf = Pdf::loadView('offers.offer-pdf', compact(
            'offer', 'settings', 'logoBase64', 'pasekBase64', 'cabinImageBase64', 'parsedNotes', 'spec',
            'cabinModelName', 'signalName', 'mirrorName',
            'cabinColorName', 'doorColorName', 'cabinDoorColorName', 'extraNames'
        ) + ['qr' => $quoteRequest])->setPaper('a4');
```

Do the same in `generateTechSpec()`:

```php
        $offerService = new OfferService();
        $parsedNotes  = $offerService->parseConfiguratorNotes($quoteRequest->additional_notes);
        $spec         = $offerService->resolveSpecLabels($quoteRequest);
```

and add `'spec' => $spec,` to the array passed to `Pdf::loadView('offers.tech-spec-pdf', [...])`.

- [ ] **Step 4: Fix `tech-spec-pdf.blade.php`**

Remove the `$statusMap`/`$statusLabel`/`$purposeLabels` block (current lines 28-42) from the `@php` section at the top — it becomes:

```php
@php
  $el = $qr->elevator;
  $accessDiagramLabels = [
    'FRONT'      => 'Frontowe',
    'THROUGHT'   => 'Przelotowe',
    'CORNER'     => 'Kątowe',
    'TRIPARTITE' => 'Trójstronne',
  ];
  $shaftW = $qr->shaft_width  ?? $el?->shaft_width;
  $shaftD = $qr->shaft_depth  ?? $el?->shaft_depth;
  $pitD   = $qr->pit_depth    ?? $el?->pit_depth;
  $oh     = $qr->overhead     ?? $el?->overhead;
  $doorW  = $qr->door_width   ?? $el?->door_width;
  $doorH  = $qr->door_height  ?? $el?->door_height;
  $cabW   = $qr->cabin_width  ?? $el?->cabin_width;
  $cabD   = $qr->cabin_depth  ?? $el?->cabin_depth;
  $cabH   = $qr->cabin_height ?? $el?->cabin_height;
  $ei30   = (int)($parsedNotes['ei30DoorsCount'] ?? 0);
  $ei60   = (int)($parsedNotes['ei60DoorsCount'] ?? 0);
@endphp
```

Change the "Przeznaczenie" row (current line ~86-88):

```blade
    @if($spec['purposeLabel'])
    <tr class="sep"><td class="lbl">Przeznaczenie</td><td>{{ $spec['purposeLabel'] }}</td></tr>
    @endif
```

Change the "Zespół napędowy" block (current lines ~127-133):

```blade
  @if($spec['driveTypeLabel'])
  <table class="sec">
    <tr><td colspan="2" class="sec-head">Zespół napędowy</td></tr>
    <tr><td class="lbl">Typ</td><td>{{ $spec['driveTypeLabel'] }}</td></tr>
  </table>
  @endif
```

Fix the dimension unit labels (current lines 111, 114, 117, 120):

```blade
    @if($shaftW)
    <tr><td class="lbl">Szerokość szybu [cm]</td><td>{{ $shaftW }}</td></tr>
    @endif
    @if($shaftD)
    <tr class="sep"><td class="lbl">Głębokość szybu [cm]</td><td>{{ $shaftD }}</td></tr>
    @endif
    @if($pitD)
    <tr class="sep"><td class="lbl">Głębokość podszybia [cm]</td><td>{{ $pitD }}</td></tr>
    @endif
    @if($oh)
    <tr class="sep"><td class="lbl">Wysokość nadszybia [cm]</td><td>{{ $oh }}</td></tr>
    @endif
```

And the cabin/door dimension rows (current lines 123, 171):

```blade
    @if($doorW && $doorH)
    <tr class="sep"><td class="lbl">Otwory drzwiowe (szer. x wys.) [cm]:</td><td>{{ $doorW }} x {{ $doorH }}</td></tr>
    @endif
```

```blade
    @if($cabW && $cabD && $cabH)
    <tr><td class="lbl">Wymiary kabiny (szer. x gł. x wys.) [cm]:</td><td>{{ $cabW }} x {{ $cabD }} x {{ $cabH }}</td></tr>
    @endif
```

And the "Drzwi" section's own door-dimension row (current line ~147):

```blade
    @if($doorW && $doorH)
    <tr class="sep"><td class="lbl">Wymiary drzwi (szer. x wys.) [cm]:</td><td>{{ $doorW }} x {{ $doorH }}</td></tr>
    @endif
```

- [ ] **Step 5: Apply the identical fix to `offer-pdf.blade.php`**

Same four changes (delete `$statusMap`/`$statusLabel`/`$purposeLabels` from the `@php` block at the top — lines 138-152 in the current file; "Przeznaczenie" row at line ~196-198; "Zespół napędowy" block at line ~238-242; `[cm]` on the dimension labels at lines ~220-230 and the cabin/door rows), using `$spec['purposeLabel']` / `$spec['driveTypeLabel']` exactly as in Step 4.

- [ ] **Step 6: Fix `OfferService::generateDocx()`**

Replace the label-map setup (current lines 158-179):

```php
        $settings = Setting::all()->pluck('value', 'key')->toArray();
        $config   = $this->parseConfiguratorNotes($qr->additional_notes);
        $spec     = $this->resolveSpecLabels($qr);

        // Label maps
        $accessDiagramLabels = [
            'FRONT'      => 'Frontowe',
            'THROUGHT'   => 'Przelotowe',
            'CORNER'     => 'Kątowe',
            'TRIPARTITE' => 'Trójstronne',
        ];
```

Replace the "Przeznaczenie" row (current line 370):

```php
        if ($spec['purposeLabel'])           $this->addSpecRow($pdzT, 'Przeznaczenie',         $spec['purposeLabel'],          $lw, $vw);
```

Replace the "Zespół napędowy" block (current lines 400-408):

```php
        // ── RIGHT: Zespół napędowy ────────────────────────────
        if ($spec['driveTypeLabel']) {
            $outerR->addText('');
            $napT = $outerR->addTable($secStyle);
            $napT->addRow();
            $napT->addCell($colW, ['bgColor' => 'efefef', 'gridSpan' => 2])->addText('Zespół napędowy', $headFont);
            $this->addSpecRow($napT, 'Typ', $spec['driveTypeLabel'], $lw, $vw);
        }
```

Fix the dimension labels (current lines 396-397):

```php
        if ($shaftW)          $this->addSpecRow($szybT, 'Szerokość szybu [cm]',    (string)$shaftW,                $lw, $vw);
        if ($shaftD)          $this->addSpecRow($szybT, 'Głębokość szybu [cm]',    (string)$shaftD,                $lw, $vw);
        if ($pitD)            $this->addSpecRow($szybT, 'Głębokość podszybia [cm]', (string)$pitD,                 $lw, $vw);
        if ($oh)               $this->addSpecRow($szybT, 'Wysokość nadszybia [cm]', (string)$oh,                    $lw, $vw);
        if ($doorW && $doorH) $this->addSpecRow($szybT, 'Otwory drzwiowe (sz. x wys.) [cm]', $doorW . ' x ' . $doorH, $lw, $vw);
```

And the cabin dimensions row (current line 415):

```php
        if ($cabW && $cabD && $cabH)           $this->addSpecRow($kabT, 'Wymiary (sz. x gł. x wys.) [cm]',   $cabW . ' x ' . $cabD . ' x ' . $cabH, $lw, $vw);
```

And the door dimensions row inside the "Drzwi" section (current line 383):

```php
        if ($doorW && $doorH)          $this->addSpecRow($drzT, 'Wymiary (szer. x wys.) [cm]',  $doorW . ' x ' . $doorH,                                $lw, $vw);
```

- [ ] **Step 7: Run the full backend test suite**

Run: `cd wipro-laravel-backend && ddev artisan test`
Expected: PASS (all tests from Tasks 1–6)

- [ ] **Step 8: Commit**

```bash
cd wipro-laravel-backend
git add app/Services/OfferPdfService.php app/Services/OfferService.php \
  resources/views/offers/tech-spec-pdf.blade.php resources/views/offers/offer-pdf.blade.php \
  tests/Feature/SpecDocumentGenerationTest.php
git commit -m "$(cat <<'EOF'
fix: correct Przeznaczenie/Zespół napędowy fields and cm labels in spec docs

"Przeznaczenie" showed the requester's own status (e.g. "Budowlany" for a
contractor) through a garbled label map; "Zespół napędowy" showed the lift
purpose instead of the elevator's actual drive type. Both PDFs and the DOCX
now source these from OfferService::resolveSpecLabels(), and all shaft/cabin/
door dimension labels read [cm] instead of the previously wrong [m]/mm.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018w7iKNYqhX49giyEuL9s5v
EOF
)"
```

---

## Task 7: Configurator step 2 — `accessCount` min, `pitDepth`/`headroom` min 270 (blocking)

**Files:**
- Modify: `wipro-react-frontend/src/configurator/validators/shaftParameters.ts`

**Interfaces:**
- Produces: `createDataSchema(maxStops)` now additionally rejects `accessCount < stopDoorsCount` and `pitDepth`/`headroom < 270`; `dataSchemaTemp` now rejects `shaftLen`/`shaftDep < 100`.

- [ ] **Step 1: Edit `accessCount`'s schema**

In `validators/shaftParameters.ts`, change:

```ts
  accessCount: yup.number().required('form.errors.require').typeError('form.errors.number').min(rangeValue['accessCount'].min, ({ min }) => `form.errors.minNumber|${min}`).when('stopDoorsCount', (stopDoorsCount, schema) => {
    const count = typeof stopDoorsCount === 'number' ? stopDoorsCount : Number(stopDoorsCount);
    return count ? schema.max(count * 2, () => `form.errors.maxNumber|${count * 2}`) : schema;
  }),
```

to:

```ts
  accessCount: yup.number().required('form.errors.require').typeError('form.errors.number').min(rangeValue['accessCount'].min, ({ min }) => `form.errors.minNumber|${min}`).when('stopDoorsCount', (stopDoorsCount, schema) => {
    const count = typeof stopDoorsCount === 'number' ? stopDoorsCount : Number(stopDoorsCount);
    return count ? schema.min(count, () => `form.errors.minNumber|${count}`).max(count * 2, () => `form.errors.maxNumber|${count * 2}`) : schema;
  }),
```

- [ ] **Step 2: Edit `pitDepth`/`headroom`'s minimum**

Change:

```ts
  pitDepth: numberWithComma().required('form.errors.require').typeError('form.errors.number').min(1, () => `form.errors.minNumber|${1}`) as unknown as yup.Schema<string | undefined>,
  headroom: numberWithComma().required('form.errors.require').typeError('form.errors.number').min(1, () => `form.errors.minNumber|${1}`) as unknown as yup.Schema<string | undefined>,
```

to:

```ts
  pitDepth: numberWithComma().required('form.errors.require').typeError('form.errors.number').min(270, () => `form.errors.minNumber|${270}`) as unknown as yup.Schema<string | undefined>,
  headroom: numberWithComma().required('form.errors.require').typeError('form.errors.number').min(270, () => `form.errors.minNumber|${270}`) as unknown as yup.Schema<string | undefined>,
```

- [ ] **Step 3: Edit `shaftLen`/`shaftDep`'s minimum (in `dataSchemaTemp`, above `createDataSchema`)**

Change:

```ts
  shaftLen: numberWithComma().when('liftSpecification', {
    is: 'SHAFT_DIMENSIONS',
    then: (schema) =>
      schema
        .required('form.errors.require')
        .typeError('form.errors.number')
        .positive('form.errors.positive'),
    otherwise: (schema) => schema.strip(),
  }) as unknown as yup.Schema<string | undefined>,

  shaftDep: numberWithComma().when('liftSpecification', {
    is: 'SHAFT_DIMENSIONS',
    then: (schema) =>
      schema
        .required('form.errors.require')
        .typeError('form.errors.number')
        .positive('form.errors.positive'),
    otherwise: (schema) => schema.strip(),
  }) as unknown as yup.Schema<string | undefined>,
```

to:

```ts
  shaftLen: numberWithComma().when('liftSpecification', {
    is: 'SHAFT_DIMENSIONS',
    then: (schema) =>
      schema
        .required('form.errors.require')
        .typeError('form.errors.number')
        .min(100, () => `form.errors.minNumber|${100}`),
    otherwise: (schema) => schema.strip(),
  }) as unknown as yup.Schema<string | undefined>,

  shaftDep: numberWithComma().when('liftSpecification', {
    is: 'SHAFT_DIMENSIONS',
    then: (schema) =>
      schema
        .required('form.errors.require')
        .typeError('form.errors.number')
        .min(100, () => `form.errors.minNumber|${100}`),
    otherwise: (schema) => schema.strip(),
  }) as unknown as yup.Schema<string | undefined>,
```

(`.positive()` is replaced by `.min(100, ...)` — a shaft under 100cm isn't buildable, matching the client's "w cm min. 100" rule.)

- [ ] **Step 4: Typecheck**

Run: `cd wipro-react-frontend && npm run build`
Expected: succeeds with no new TypeScript errors (yup schema shape is unchanged, only numeric literals and `.min()` calls changed).

- [ ] **Step 5: Commit**

```bash
cd wipro-react-frontend
git add src/configurator/validators/shaftParameters.ts
git commit -m "$(cat <<'EOF'
fix: accessCount can't be below stop count; pit/headroom min 270cm;
shaft width/depth min 100cm

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018w7iKNYqhX49giyEuL9s5v
EOF
)"
```

---

## Task 8: Configurator step 2 — 270–340cm warning banner, cm labels for shaft width/depth

**Files:**
- Modify: `wipro-react-frontend/src/configurator/components/multiStepWizard/ShaftParameters.tsx`
- Modify: `wipro-react-frontend/src/configurator/i18n/pl.ts`
- Modify: `wipro-react-frontend/src/configurator/i18n/en.ts`

**Interfaces:**
- Consumes: `rangeValue`, `watch`/`register` from `ShaftParameters.tsx` (unchanged imports).

- [ ] **Step 1: Add the warning-message translation keys**

In `i18n/pl.ts`, inside the `form.shaftParameters` object (near the existing `throughCabinNote` key — search for it to find the right object), add:

```ts
                headroomLowWarning: 'Nadszybie jest zaniżone (zalecane min. 340 cm).',
                pitDepthLowWarning: 'Głębokość podszybia jest zaniżona (zalecane min. 340 cm).',
```

In `i18n/en.ts`, same location:

```ts
                headroomLowWarning: 'Headroom is on the low side (340 cm or more recommended).',
                pitDepthLowWarning: 'Pit depth is on the low side (340 cm or more recommended).',
```

- [ ] **Step 2: Change `shaftLen`/`shaftDep` labels to `[cm]`**

In `i18n/pl.ts`, `i18n/en.ts` — these are plain string values (`shaftLen: 'Szerokość szybu'`, `shaftDep: 'Głębokość szybu'` in `pl.ts`; `shaftLen: 'Shaft length'`, `shaftDep: 'Shaft Depth'` in `en.ts`), unaffected by this task — the `[cm]`/`[m]` unit suffix is appended in the component via a template literal (Step 3), not stored in the translation string. No i18n change needed here beyond Step 1.

- [ ] **Step 3: Edit `ShaftParameters.tsx` — `shaftLen`/`shaftDep` labels**

Change:

```tsx
                <TextInput
                  label={`${t('form.shaftParameters.fields.shaftLen')} [m]`}
                  value={registerTemp('shaftLen', {
                    onChange: (e) => updateField('shaftTempParameters', 'shaftLen', replaceDots(e.target.value))
                  })}
                  error={errorsTemp.shaftLen?.message}
                />
                <TextInput
                  label={`${t('form.shaftParameters.fields.shaftDep')} [m]`}
                  value={registerTemp('shaftDep', {
                    onChange: (e) => updateField('shaftTempParameters', 'shaftDep', replaceDots(e.target.value))
                  })}
                  error={errorsTemp.shaftDep?.message}
                />
```

to:

```tsx
                <TextInput
                  label={`${t('form.shaftParameters.fields.shaftLen')} [cm]`}
                  value={registerTemp('shaftLen', {
                    onChange: (e) => updateField('shaftTempParameters', 'shaftLen', replaceDots(e.target.value))
                  })}
                  error={errorsTemp.shaftLen?.message}
                />
                <TextInput
                  label={`${t('form.shaftParameters.fields.shaftDep')} [cm]`}
                  value={registerTemp('shaftDep', {
                    onChange: (e) => updateField('shaftTempParameters', 'shaftDep', replaceDots(e.target.value))
                  })}
                  error={errorsTemp.shaftDep?.message}
                />
```

- [ ] **Step 4: Add `watch` calls and the warning banners for `pitDepth`/`headroom`**

Add two `watch` calls near the existing `const watchedStops = watch('stopDoorsCount');` / `const watchedDiagram = watch('accessDiagram');` lines:

```tsx
  const watchedStops = watch('stopDoorsCount');
  const watchedDiagram = watch('accessDiagram');
  const watchedPitDepth = watch('pitDepth');
  const watchedHeadroom = watch('headroom');

  const isLowValue = (raw: string | undefined) => {
    if (!raw) return false;
    const n = Number(String(raw).replace(',', '.'));
    return Number.isFinite(n) && n >= 270 && n < 340;
  };
```

Change the `pitDepth`/`headroom` block:

```tsx
            <div className="flex gap-[30px] justify-between max-[500px]:flex-col">
              <TextInput
                label={`${t('form.shaftParameters.fields.pitDepth')} [cm]`}
                value={register('pitDepth', {
                  onChange: (e) => updateField('shaftParameters', 'pitDepth', replaceDots(e.target.value))
                })}
                error={errors.pitDepth?.message}
              />
              <TextInput
                label={`${t('form.shaftParameters.fields.headroom')} [cm]`}
                value={register('headroom', {
                  onChange: (e) => updateField('shaftParameters', 'headroom', replaceDots(e.target.value))
                })}
                error={errors.headroom?.message}
              />
            </div>
            {isLowValue(watchedPitDepth) && (
              <p className="text-[14px] text-[var(--grey)] bg-[#fff8e1] border border-[#ffe082] rounded-[8px] px-4 py-3 -mt-3 m-0">
                {t('form.shaftParameters.pitDepthLowWarning')}
              </p>
            )}
            {isLowValue(watchedHeadroom) && (
              <p className="text-[14px] text-[var(--grey)] bg-[#fff8e1] border border-[#ffe082] rounded-[8px] px-4 py-3 -mt-3 m-0">
                {t('form.shaftParameters.headroomLowWarning')}
              </p>
            )}
```

(The `[fff8e1]`/`[ffe082]` colors and `text-[14px]` classes match the existing `throughCabinNote` banner earlier in the same file, so the new warnings look consistent with the one already on screen.)

- [ ] **Step 5: Typecheck**

Run: `cd wipro-react-frontend && npm run build`
Expected: succeeds with no new TypeScript errors.

- [ ] **Step 6: Manual verification**

Run: `cd wipro-react-frontend && npm run dev`, open the configurator, reach step 2 ("Parametry szybu"), and confirm:
- Entering an `accessCount` below `stopDoorsCount` shows a blocking error.
- Entering `pitDepth`/`headroom` below 270 shows a blocking error; a value in 270–339 shows the new yellow warning without blocking "Dalej"; 340+ shows neither.
- `Szerokość szybu [cm]` / `Głębokość szybu [cm]` labels are visible.

- [ ] **Step 7: Commit**

```bash
cd wipro-react-frontend
git add src/configurator/components/multiStepWizard/ShaftParameters.tsx \
  src/configurator/i18n/pl.ts src/configurator/i18n/en.ts
git commit -m "$(cat <<'EOF'
feat: warn on low headroom/pit depth (270-340cm), shaft width/depth in cm

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018w7iKNYqhX49giyEuL9s5v
EOF
)"
```

---

## Task 9: Persist the configurator's shaft width/depth to the quote request

**Files:**
- Modify: `wipro-react-frontend/src/configurator/store/mainApi/response.ts`
- Modify: `wipro-react-frontend/src/configurator/store/slices/formSlice.ts`
- Modify: `wipro-react-frontend/src/configurator/components/multiStepWizard/FinishesAndAccessories.tsx`

**Interfaces:**
- Consumes: `QuoteRequestShaftPersistenceTest` contract from Task 4 (`POST /quote-requests` body accepts `shaft_width`/`shaft_depth` as plain cm integers).
- Produces: `formSelectors.shaftTempParameters: (state: RootState) => state.form.shaftTempParameters`, used by `FinishesAndAccessories.tsx`.

Today `quote_requests.shaft_width`/`shaft_depth` are always `NULL` — the configurator collects `shaftLen`/`shaftDep` (cm, after Task 8) only for the live `/elevFinder` lookup and never includes them in the final `POST /quote-requests` payload, so the tech spec PDF/DOCX can only ever fall back to the *matched elevator's* shaft size, never the customer's actually-requested one.

- [ ] **Step 1: Add the fields to `StoreQuoteRequestBody`**

In `store/mainApi/response.ts`, change:

```ts
interface StoreQuoteRequestBody {
    investor_name: string;
    investor_email: string;
    investor_phone?: string;
    investor_company?: string;
    investor_nip?: string;
    investor_address?: string;
    investor_city?: string;
    investment_name?: string;
    investment_address?: string;
    investment_city?: string;
    stops?: number;
    pit_depth?: number;
    overhead?: number;
    drive_type?: string;
    door_type?: string;
    elevator_id?: number;
    additional_notes?: string;
    object_type?: 'residential' | 'care_home' | 'public_commercial';
}
```

to:

```ts
interface StoreQuoteRequestBody {
    investor_name: string;
    investor_email: string;
    investor_phone?: string;
    investor_company?: string;
    investor_nip?: string;
    investor_address?: string;
    investor_city?: string;
    investment_name?: string;
    investment_address?: string;
    investment_city?: string;
    stops?: number;
    shaft_width?: number;
    shaft_depth?: number;
    pit_depth?: number;
    overhead?: number;
    drive_type?: string;
    door_type?: string;
    elevator_id?: number;
    additional_notes?: string;
    object_type?: 'residential' | 'care_home' | 'public_commercial';
}
```

- [ ] **Step 2: Add the `shaftTempParameters` selector**

In `store/slices/formSlice.ts`, change:

```ts
export const formSelectors = {
    data: (state: RootState) => state.form.data,
    shaftParameters: (state: RootState) => state.form.shaftParameters,
    finishesAndAccessories: (state: RootState) => state.form.finishesAndAccessories
}
```

to:

```ts
export const formSelectors = {
    data: (state: RootState) => state.form.data,
    shaftParameters: (state: RootState) => state.form.shaftParameters,
    shaftTempParameters: (state: RootState) => state.form.shaftTempParameters,
    finishesAndAccessories: (state: RootState) => state.form.finishesAndAccessories
}
```

- [ ] **Step 3: Send `shaft_width`/`shaft_depth` from `FinishesAndAccessories.tsx`**

Add the selector next to the existing one:

```tsx
    const shaftParameters = useAppSelector(formSelectors.shaftParameters)
    const shaftTempParameters = useAppSelector(formSelectors.shaftTempParameters)
```

In the `sendData({...})` call inside `onSubmit`, add the two fields (values are already cm strings after Task 8, e.g. `"140"` or `"140,5"` — reuse the exact `parseInt(String(x), 10)` pattern already used for `pit_depth`/`overhead` two lines below):

```tsx
            stops: shaftParameters.stopDoorsCount,
            shaft_width: shaftTempParameters.shaftLen ? parseInt(String(shaftTempParameters.shaftLen), 10) : undefined,
            shaft_depth: shaftTempParameters.shaftDep ? parseInt(String(shaftTempParameters.shaftDep), 10) : undefined,
            pit_depth: shaftParameters.pitDepth ? parseInt(String(shaftParameters.pitDepth), 10) : undefined,
            overhead: shaftParameters.headroom ? parseInt(String(shaftParameters.headroom), 10) : undefined,
```

- [ ] **Step 4: Typecheck**

Run: `cd wipro-react-frontend && npm run build`
Expected: succeeds with no new TypeScript errors.

- [ ] **Step 5: Manual verification**

Run: `cd wipro-react-frontend && npm run dev`, complete the configurator wizard through to submission with a shaft-dimension search (not capacity-based) filled in, submit, then check via `ddev artisan tinker` in `wipro-laravel-backend` (`\App\Models\QuoteRequest::latest()->first()->only(['shaft_width','shaft_depth'])`) that the values landed as the cm numbers typed, not `null`.

- [ ] **Step 6: Commit**

```bash
cd wipro-react-frontend
git add src/configurator/store/mainApi/response.ts src/configurator/store/slices/formSlice.ts \
  src/configurator/components/multiStepWizard/FinishesAndAccessories.tsx
git commit -m "$(cat <<'EOF'
fix: persist customer's requested shaft width/depth to the quote request

Previously only used transiently for the /elevFinder lookup and then
discarded, so quote_requests.shaft_width/shaft_depth was always NULL and
the spec PDF/DOCX could only ever show the matched elevator's own shaft
size, never what the customer actually asked for.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018w7iKNYqhX49giyEuL9s5v
EOF
)"
```

---

## Task 10: `ElevatorDetailModal.tsx` — mm → cm

**Files:**
- Modify: `wipro-react-frontend/src/configurator/components/ElevatorDetailModal.tsx`

**Interfaces:**
- Consumes: `GET /elevators/{id}` values, already cm after Task 1 (`ElevatorController::show` returns the Eloquent model, so the accessor applies automatically — no numeric change needed in this file, only the unit suffix text).

- [ ] **Step 1: Replace the 9 hardcoded `mm` suffixes with `cm`**

In `ElevatorDetailModal.tsx`, lines 118-124 and 134-135, change every occurrence of `` ` mm` `` to `` ` cm` ``:

```tsx
            <Row label={t('elevatorDetail.cabinWidth')} value={`${data.cabin_width} cm`} />
            <Row label={t('elevatorDetail.cabinDepth')} value={`${data.cabin_depth} cm`} />
            <Row label={t('elevatorDetail.cabinHeight')} value={`${data.cabin_height} cm`} />
            {data.shaft_width != null && <Row label={t('elevatorDetail.shaftWidth')} value={`${data.shaft_width} cm`} />}
            {data.shaft_depth != null && <Row label={t('elevatorDetail.shaftDepth')} value={`${data.shaft_depth} cm`} />}
            {data.pit_depth != null && <Row label={t('elevatorDetail.pitDepth')} value={`${data.pit_depth} cm`} />}
            {data.overhead != null && <Row label={t('elevatorDetail.overhead')} value={`${data.overhead} cm`} />}
            {data.lifting_height && <Row label="Wys. podnoszenia" value={`${data.lifting_height} m`} />}
```

(`lifting_height` stays `m` — out of scope, per Global Constraints.)

```tsx
                {data.door_width != null && <Row label="Szer. drzwi" value={`${data.door_width} cm`} />}
                {data.door_height != null && <Row label="Wys. drzwi" value={`${data.door_height} cm`} />}
```

- [ ] **Step 2: Typecheck**

Run: `cd wipro-react-frontend && npm run build`
Expected: succeeds with no new TypeScript errors.

- [ ] **Step 3: Commit**

```bash
cd wipro-react-frontend
git add src/configurator/components/ElevatorDetailModal.tsx
git commit -m "$(cat <<'EOF'
fix: elevator detail modal shows cm, matching the corrected API unit

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018w7iKNYqhX49giyEuL9s5v
EOF
)"
```

---

## Task 11: Admin panel — `[mm]` → `[cm]` labels

**Files:**
- Modify: `wipro-react-frontend/src/admin/i18n/pl.ts`
- Modify: `wipro-react-frontend/src/admin/i18n/en.ts`
- Modify: `wipro-react-frontend/src/admin/app/protected/quoteRequests/detail.tsx`

**Interfaces:**
- Consumes: `GET/POST/PATCH /api/admin/elevators*` values, already cm after Task 1. `quote_requests.*` values already cm (unaffected by Task 1). No numeric/logic change anywhere in this task — labels only.

- [ ] **Step 1: Fix `admin/i18n/pl.ts`**

Change every `[mm]` occurrence in the elevator and quote-request dimension labels to `[cm]` (9 keys — `shaftWidth`, `shaftDepth`, `cabinWidth`, `cabinDepth`, `cabinHeight`, `pitDepth`, `overhead`, `doorWidth`, `doorHeight` — each appears twice in the file, once in the elevator-form section around line 159-170 and once in the elevator-table/column section around line 205-213, plus `doorWidth`/`doorHeight` again around line 402-406 for the quote-request tech-spec section):

```ts
        shaftWidth: 'Szerokość szybu [cm]',
        shaftDepth: 'Głębokość szybu [cm]',
        cabinWidth: 'Szer. kabiny [cm]',
        cabinDepth: 'Głęb. kabiny [cm]',
        cabinHeight: 'Wys. kabiny [cm]',
        pitDepth: 'Podszybie [cm]',
        overhead: 'Nadszybie [cm]',
        doorWidth: 'Szer. drzwi [cm]',
        doorHeight: 'Wys. drzwi [cm]',
```

```ts
    cabinWidth: 'Szer. kabiny [cm]',
    cabinDepth: 'Głęb. kabiny [cm]',
    cabinHeight: 'Wys. kabiny [cm]',
    shaftWidth: 'Szer. szybu [cm]',
    shaftDepth: 'Głęb. szybu [cm]',
    pitDepth: 'Podszybie [cm]',
    overhead: 'Nadszybie [cm]',
```

```ts
      doorWidth: 'Szer. drzwi [cm]',
      doorHeight: 'Wys. drzwi [cm]',
```

Also `pitDepthLabel: 'Głęb. podszybia [cm]'` (line 138 — add the missing unit while touching this file, since it currently has none at all).

- [ ] **Step 2: Fix `admin/i18n/en.ts`**

Mirror Step 1's changes with the English label text unchanged apart from `[mm]` → `[cm]`:

```ts
        shaftWidth: 'Shaft width [cm]',
        shaftDepth: 'Shaft depth [cm]',
        cabinWidth: 'Cabin width [cm]',
        cabinDepth: 'Cabin depth [cm]',
        cabinHeight: 'Cabin height [cm]',
        pitDepth: 'Pit depth [cm]',
        overhead: 'Headroom [cm]',
        doorWidth: 'Door width [cm]',
        doorHeight: 'Door height [cm]',
```

```ts
    cabinWidth: 'Cabin width [cm]',
    cabinDepth: 'Cabin depth [cm]',
    cabinHeight: 'Cabin height [cm]',
    shaftWidth: 'Shaft width [cm]',
    shaftDepth: 'Shaft depth [cm]',
    pitDepth: 'Pit depth [cm]',
    overhead: 'Headroom [cm]',
```

```ts
      doorWidth: 'Door width [cm]',
      doorHeight: 'Door height [cm]',
```

And `pitDepthLabel: 'Pit depth [cm]'`.

- [ ] **Step 3: Fix `admin/app/protected/quoteRequests/detail.tsx`**

Change the 4 hardcoded `unit="mm"` props (lines 870-873) to `unit="cm"`:

```tsx
                <EditableField label={t('quoteRequests.detail.width')} value={data.shaft_width} field="shaft_width" onSave={saveNumberField} type="number" unit="cm" />
                <EditableField label={t('quoteRequests.detail.depth')} value={data.shaft_depth} field="shaft_depth" onSave={saveNumberField} type="number" unit="cm" />
                <EditableField label={t('quoteRequests.detail.pitDepthLabel')} value={data.pit_depth} field="pit_depth" onSave={saveNumberField} type="number" unit="cm" />
                <EditableField label={t('quoteRequests.detail.headroomLabel')} value={data.overhead} field="overhead" onSave={saveNumberField} type="number" unit="cm" />
```

- [ ] **Step 4: Typecheck**

Run: `cd wipro-react-frontend && npm run build`
Expected: succeeds with no new TypeScript errors.

- [ ] **Step 5: Commit**

```bash
cd wipro-react-frontend
git add src/admin/i18n/pl.ts src/admin/i18n/en.ts src/admin/app/protected/quoteRequests/detail.tsx
git commit -m "$(cat <<'EOF'
fix: admin panel shows [cm] for elevator/quote-request dimensions

Labels previously said [mm] even though quote_requests dimensions were
always cm, and elevators dimensions are cm too now that the Elevator
model converts at the API boundary.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_018w7iKNYqhX49giyEuL9s5v
EOF
)"
```

---

## Task 12: Final verification — full backend suite, frontend build, manual smoke test

**Files:** none (verification only)

- [ ] **Step 1: Run the full backend test suite**

Run: `cd wipro-laravel-backend && ddev artisan test`
Expected: PASS — all tests from Tasks 1–6 plus the pre-existing suite (`CabinAccessoryDefaultTest`, `CabinColorDefaultTest`, `CabinModelDefaultTest`, `UpdatePasswordTest`, `ExampleTest`).

- [ ] **Step 2: Full frontend build**

Run: `cd wipro-react-frontend && npm run build`
Expected: PASS (type-checks and builds both the configurator and admin bundles).

- [ ] **Step 3: Manual smoke test — configurator**

Run: `cd wipro-react-frontend && npm run dev`. In the browser:
- Complete step 2 with `accessCount` deliberately below `stopDoorsCount` → blocking error shown.
- Enter `headroom`/`pitDepth` at 300 (within 270-340) → yellow warning shown, "Dalej" still clickable.
- Enter `headroom`/`pitDepth` at 200 → blocking error, cannot proceed.
- Switch to "Wymiary szybu" lift-specification mode, enter shaft width/depth in cm, confirm only elevators that actually fit are suggested (create a deliberately oversized test elevator via the admin panel first, in cm, and confirm it is *not* suggested for a smaller shaft).
- Click "Szczegóły" on a suggested elevator → detail modal shows `cm`, not `mm`.

- [ ] **Step 4: Manual smoke test — admin panel**

Navigate to `/w-admin`, open Elevators (Baza wind): confirm dimension fields are labeled `[cm]` and a newly created elevator's typed cm value reads back identically after save/reload. Open a Quote Request detail: confirm shaft/pit/overhead fields show `cm`.

- [ ] **Step 5: Manual smoke test — generated documents**

From the admin panel, generate/download the tech-spec PDF (or trigger the automatic email flow on a new quote request) and the offer PDF/DOCX for a quote request with a known `liftPurpose` (e.g. `FIRE`) and a matched elevator with a known `drive_type` (e.g. `Elektryczny bezreduktorowy`). Confirm:
- "Przeznaczenie" shows `Pożarowy` (not the requester's status like "Budowlany").
- "Zespół napędowy → Typ" shows `Elektryczny bezreduktorowy` (not `Pożarowy`).
- Shaft/cabin/door dimensions are labeled `[cm]`.

- [ ] **Step 6: No commit — this task only verifies prior commits**
