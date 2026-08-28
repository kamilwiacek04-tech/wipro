# Poprawki wyceny: dopłata za przystanek, VAT wg typu obiektu, brak dopasowania windy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three issues raised by the client in their review of the quoting system: (1) make the 700 zł/stop surcharge base rate admin-editable instead of hardcoded, so it can vary by elevator/capacity via the existing per-elevator `coeff_stops` coefficient; (2) replace the hardcoded 23% VAT with a rate derived from a new "object type" classification (residential ≤150m²/single-family house ≤300m² and certain care homes → 8%, everything else incl. public/commercial → 23%), with an on-document disclaimer that the rate is indicative; (3) stop the system from creating a bogus "wycena indywidualna" 0 zł offer when no elevator matches — instead the lead is still captured, but no auto-offer is generated/sent, the request is flagged `needs_manual_pricing`, and admin-triggered offer generation is blocked with a clear error until an elevator is assigned.

**Architecture:** Backend changes first (Setting-based config, new `object_type` field + VAT resolver, guard in `OfferService::buildPricedItems()`, new `needs_manual_pricing` status), then admin panel UI (pricing settings field, object-type editor, new status label/badge), then the public configurator (object-type dropdown), then document output (PDF/email VAT disclaimer). Each task is independently testable via `php artisan tinker` / manual API calls and the existing admin UI.

**Tech Stack:** Laravel 12 (PHP backend), React + TypeScript + Tailwind (admin & configurator, one build), RTK Query (configurator), react-hook-form + yup (configurator forms), react-i18next (pl/en)

## Global Constraints

- Colors (RAL cabin/door colors) are explicitly OUT OF SCOPE for this plan — the client will populate them directly in production. Do not touch `cabin_colors` or anything color-related.
- Decision already made with the project owner: when no elevator matches a quote request, the request is still saved (lead not lost) but no auto-offer is generated or emailed; it is flagged for manual pricing instead of erroring out the public form.
- `coeff_stops` is the load/udźwig-compensation coefficient (współczynnik rekompensujący udźwig) — do NOT repurpose or touch it. The `700` literal must become its own new per-elevator column (a separate concept), so the base rate itself can differ per elevator (e.g. 630 kg vs 2500 kg), while `coeff_stops` keeps multiplying the result exactly as today.
- VAT rate stays admin-overridable per offer via the existing `AdminOfferController`/`updateOffer` manual `vat_rate` field — the new object-type resolver only supplies the *default*.

---

## File Map

### Backend (`wipro-laravel-backend/`)
| File | Action |
|------|--------|
| `database/migrations/2026_08_26_000000_add_stop_surcharge_rate_to_elevators_table.php` | Create |
| `app/Models/Elevator.php` | Modify — add `stop_surcharge_rate` to `$fillable` + `$casts` |
| `app/Http/Controllers/Api/ElevatorController.php` | Modify — add `stop_surcharge_rate` validation to `store()`/`update()` |
| `app/Services/OfferService.php` | Modify — read `$elevator->stop_surcharge_rate` instead of literal `700`; add `resolveVatRate()`; guard `buildPricedItems()` against missing elevator |
| `database/migrations/2026_08_26_000001_add_object_type_to_quote_requests_table.php` | Create |
| `database/migrations/2026_08_26_000002_add_needs_manual_pricing_status_to_quote_requests.php` | Create |
| `app/Models/QuoteRequest.php` | Modify — add `object_type` to `$fillable` |
| `app/Http/Controllers/Api/QuoteRequestController.php` | Modify — validate `object_type`, skip auto-offer when no elevator matched, use `resolveVatRate()` |
| `app/Http/Controllers/Api/AdminQuoteRequestController.php` | Modify — validate `object_type` in `update()`, block `generateOffer()` when no elevator, use `resolveVatRate()` |
| `lang/pl/messages.php`, `lang/en/messages.php` | Modify — add `offer.no_elevator_matched` |
| `resources/views/offers/pdf.blade.php` | Modify — add VAT disclaimer line |
| `resources/views/emails/offer-sent.blade.php`, `lang/pl/emails.php`, `lang/en/emails.php` | Modify — add VAT disclaimer line |

### Admin Frontend (`wipro-react-frontend/src/admin/`)
| File | Action |
|------|--------|
| `app/protected/database/index.tsx` | Modify — add `stop_surcharge_rate` to `Elevator` interface + a `TechField` in the elevator's "Współczynniki rekompensujące udźwig" section + `nullableFloats` list |
| `i18n/pl.ts`, `i18n/en.ts` | Modify — add `database.coefficients.stopSurchargeRate*`, `status.needs_manual_pricing`, `quoteRequests.detail.objectType*` keys |
| `app/protected/quoteRequests/detail.tsx` | Modify — add `object_type` to `QuoteRequestDetail` interface + `OBJECT_TYPE_OPTIONS` + `EditableSelect` field; add `needs_manual_pricing` to `STATUS_VALUES` + manual-pricing banner |
| `app/protected/quoteRequests/index.tsx` | Modify — add `needs_manual_pricing` to `STATUS_FILTER_VALUES` + `STATUS_DOTS` |
| `components/Badge.tsx` | Modify — add `needs_manual_pricing` case to `statusBadge()` |

### Configurator Frontend (`wipro-react-frontend/src/configurator/`)
| File | Action |
|------|--------|
| `types/multiStepWizard/finishesAndAccessories.ts` | Modify — add `objectType` field |
| `validators/finishesAndAccessories.ts` | Modify — add required `objectType` validation |
| `components/multiStepWizard/FinishesAndAccessories.tsx` | Modify — add object-type `<select>` + include `object_type` in submit payload |
| `store/mainApi/response.ts` | Modify — add `object_type` to `StoreQuoteRequestBody` |
| `i18n/pl.ts`, `i18n/en.ts` | Modify — add object-type field/option labels |

---

## Task 1: Backend — new per-elevator `stop_surcharge_rate` column (replaces the hardcoded `700`)

**Files:**
- Create: `wipro-laravel-backend/database/migrations/2026_08_26_000000_add_stop_surcharge_rate_to_elevators_table.php`
- Modify: `wipro-laravel-backend/app/Models/Elevator.php`
- Modify: `wipro-laravel-backend/app/Http/Controllers/Api/ElevatorController.php`
- Modify: `wipro-laravel-backend/app/Services/OfferService.php:532-539`

`coeff_stops` (współczynnik rekompensujący udźwig) stays exactly as-is and is NOT touched — it keeps multiplying the surcharge. What changes is the `700` literal itself: it becomes a new column on `elevators`, so each elevator (e.g. 630 kg vs 2500 kg) can have its own base rate, set directly in the same "Współczynniki rekompensujące udźwig" admin section where `coeff_stops` already lives.

- [ ] **Step 1: Migration**

```php
<?php
// database/migrations/2026_08_26_000000_add_stop_surcharge_rate_to_elevators_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('elevators', function (Blueprint $table) {
            $table->decimal('stop_surcharge_rate', 10, 2)->nullable()->after('coeff_stops');
        });
    }

    public function down(): void
    {
        Schema::table('elevators', function (Blueprint $table) {
            $table->dropColumn('stop_surcharge_rate');
        });
    }
};
```

- [ ] **Step 2: Run migration**

```bash
cd wipro-laravel-backend && ddev exec php artisan migrate
```
Expected: `Migrated: 2026_08_26_000000_add_stop_surcharge_rate_to_elevators_table`

- [ ] **Step 3: Add to the `Elevator` model**

In `app/Models/Elevator.php`, add `'stop_surcharge_rate',` to `$fillable` (in the "Compensation coefficients" block, after `'coeff_stops',`), and to `$casts`:
```php
'stop_surcharge_rate' => 'decimal:2',
```

- [ ] **Step 4: Add validation to `ElevatorController`**

In `app/Http/Controllers/Api/ElevatorController.php::store()`, add after `'coeff_stops' => 'nullable|numeric|min:0',` (line 54):
```php
'stop_surcharge_rate' => 'nullable|numeric|min:0',
```
In `update()`, add after `'coeff_stops' => 'sometimes|nullable|numeric|min:0',` (line 110):
```php
'stop_surcharge_rate' => 'sometimes|nullable|numeric|min:0',
```

- [ ] **Step 5: Use the per-elevator rate instead of the literal `700`, with a fallback for elevators not yet configured**

In `app/Services/OfferService.php`, change lines 532-539 from:
```php
        if ($elevator && $stops > 0 && $accessCount > 2 && (float) $elevator->coeff_stops > 0) {
            $unitPrice = round(700 * $stops * (float) $elevator->coeff_stops * $margin, 2);
            $amount    = round($unitPrice * ($accessCount - 2), 2);
            if ($amount != 0) {
                $this->addItem($offer->id, "Dopłata za liczbę przystanków ({$stops} przyst. × " . ($accessCount - 2) . " dojść ponad 2)", $accessCount - 2, 'kpl.', $unitPrice, $sortOrder++);
                $totalNet += $amount;
            }
        }
```
to:
```php
        if ($elevator && $stops > 0 && $accessCount > 2 && (float) $elevator->coeff_stops > 0) {
            $stopSurchargeRate = (float) ($elevator->stop_surcharge_rate ?? 700);
            $unitPrice = round($stopSurchargeRate * $stops * (float) $elevator->coeff_stops * $margin, 2);
            $amount    = round($unitPrice * ($accessCount - 2), 2);
            if ($amount != 0) {
                $this->addItem($offer->id, "Dopłata za liczbę przystanków ({$stops} przyst. × " . ($accessCount - 2) . " dojść ponad 2)", $accessCount - 2, 'kpl.', $unitPrice, $sortOrder++);
                $totalNet += $amount;
            }
        }
```
The `?? 700` fallback keeps today's behavior unchanged for every existing elevator until an admin sets its own `stop_surcharge_rate` — nothing breaks on deploy.

- [ ] **Step 6: Verify with tinker**

```bash
ddev exec php artisan tinker --execute="\$e = App\Models\Elevator::first(); \$e->update(['stop_surcharge_rate' => 850, 'coeff_stops' => 1]); echo (float) \$e->fresh()->stop_surcharge_rate;"
```
Expected output: `850`

- [ ] **Step 7: Commit**

```bash
git add database/migrations/2026_08_26_000000_add_stop_surcharge_rate_to_elevators_table.php \
        app/Models/Elevator.php app/Http/Controllers/Api/ElevatorController.php app/Services/OfferService.php
git commit -m "feat: make stop-surcharge base rate a per-elevator column instead of a hardcoded 700"
```

---

## Task 2: Admin Panel — expose `stop_surcharge_rate` next to the existing coefficients

**Files:**
- Modify: `wipro-react-frontend/src/admin/app/protected/database/index.tsx`
- Modify: `wipro-react-frontend/src/admin/i18n/pl.ts`
- Modify: `wipro-react-frontend/src/admin/i18n/en.ts`

This is a sibling field to `coeff_stops`, in the same "Współczynniki rekompensujące udźwig" section per elevator (NOT the global pricing settings card) — same `TechField` pattern already used for the 7 `coeff_*` fields.

- [ ] **Step 1: Add to the `Elevator` interface**

In `database/index.tsx`, add after `coeff_stops?: number | null` (line 1334):
```ts
stop_surcharge_rate?: number | null
```

- [ ] **Step 2: Add to `nullableFloats` so `updateElevator()` sends it correctly**

In `updateElevator()` (line 1778-1782), add `'stop_surcharge_rate'` to the `nullableFloats` array:
```ts
const nullableFloats = [
  'base_price', 'lifting_height', 'stop_surcharge_rate',
  'coeff_stops', 'coeff_cabin_model', 'coeff_cabin_throughway',
  'coeff_cabin_doors', 'coeff_landing_doors', 'coeff_ei30', 'coeff_ei60',
]
```

- [ ] **Step 3: Render the field in the coefficients section**

In the "Współczynniki rekompensujące udźwig" grid (line 1678-1685), add a `TechField` right before the `coeff_stops` one (so it reads naturally as "base rate, then its multiplier"):
```tsx
<TechField label={t('database.coefficients.stopSurchargeRate')} value={localElevator.stop_surcharge_rate} elevatorId={localElevator.id} field="stop_surcharge_rate" onSaved={(id, f, v) => { onUpdate(id, f, v); setLocalElevator(prev => ({ ...prev, stop_surcharge_rate: v ? parseFloat(v) : null })) }} type="number" />
```

- [ ] **Step 4: Add translations**

In `i18n/pl.ts`, inside `database.coefficients` (near `stops: '...'`), add:
```ts
stopSurchargeRate: 'Stawka bazowa dopłaty za przystanek (PLN) — puste = domyślne 700',
```
In `i18n/en.ts`, the equivalent:
```ts
stopSurchargeRate: 'Stop surcharge base rate (PLN) — blank = default 700',
```

- [ ] **Step 5: Verify in the browser**

Open an elevator's row in the admin panel (e.g. the 630 kg model), expand its coefficients section, set `stop_surcharge_rate` to e.g. `600`; open a different elevator (e.g. 2500 kg), set it to `900`. Generate a test offer for each and confirm the "Dopłata za liczbę przystanków" line item uses each elevator's own rate.

- [ ] **Step 6: Commit**

```bash
git add src/admin/app/protected/database/index.tsx src/admin/i18n/pl.ts src/admin/i18n/en.ts
git commit -m "feat: admin can set a per-elevator stop-surcharge base rate"
```

---

## Task 3: Backend — `object_type` field on quote requests + VAT resolver

**Files:**
- Create: `wipro-laravel-backend/database/migrations/2026_08_26_000001_add_object_type_to_quote_requests_table.php`
- Modify: `wipro-laravel-backend/app/Models/QuoteRequest.php`
- Modify: `wipro-laravel-backend/app/Services/OfferService.php`

Object type drives the VAT rate. Per the client:
- `residential` — mieszkania do 150 m² i/lub dom jednorodzinny do 300 m² → **8%**
- `care_home` — niektóre Domy Spokojnej Starości → **8%**
- `public_commercial` — pozostałe, w tym budynki publiczne i komercyjne → **23%** (default)

- [ ] **Step 1: Migration**

```php
<?php
// database/migrations/2026_08_26_000001_add_object_type_to_quote_requests_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quote_requests', function (Blueprint $table) {
            $table->enum('object_type', ['residential', 'care_home', 'public_commercial'])
                ->default('public_commercial')
                ->after('investment_city');
        });
    }

    public function down(): void
    {
        Schema::table('quote_requests', function (Blueprint $table) {
            $table->dropColumn('object_type');
        });
    }
};
```

- [ ] **Step 2: Run migration**

```bash
cd wipro-laravel-backend && ddev exec php artisan migrate
```
Expected: `Migrated: 2026_08_26_000001_add_object_type_to_quote_requests_table`

- [ ] **Step 3: Add to `QuoteRequest` model**

In `app/Models/QuoteRequest.php`, add `'object_type',` to `$fillable` (after `'investment_city',`).

- [ ] **Step 4: Add the VAT resolver to `OfferService`**

In `app/Services/OfferService.php`, add a new public method (near the top of the class, after the constructor/property block, or right before `buildPricedItems()`):
```php
public static function resolveVatRate(?string $objectType): float
{
    return match ($objectType) {
        'residential', 'care_home' => 8.00,
        default => 23.00,
    };
}
```

- [ ] **Step 5: Verify with tinker**

```bash
ddev exec php artisan tinker --execute="echo App\Services\OfferService::resolveVatRate('residential'); echo ' '; echo App\Services\OfferService::resolveVatRate('public_commercial'); echo ' '; echo App\Services\OfferService::resolveVatRate(null);"
```
Expected output: `8 23 23`

- [ ] **Step 6: Commit**

```bash
git add database/migrations/2026_08_26_000001_add_object_type_to_quote_requests_table.php app/Models/QuoteRequest.php app/Services/OfferService.php
git commit -m "feat: add object_type to quote requests and VAT rate resolver"
```

---

## Task 4: Backend — wire the VAT resolver into both auto-offer flows + validation

**Files:**
- Modify: `wipro-laravel-backend/app/Http/Controllers/Api/QuoteRequestController.php`
- Modify: `wipro-laravel-backend/app/Http/Controllers/Api/AdminQuoteRequestController.php`

- [ ] **Step 1: Accept and validate `object_type` on public submission**

In `QuoteRequestController::store()`, add to the validation array (after `'investment_city' => 'nullable|string|max:100',`):
```php
'object_type' => 'nullable|string|in:residential,care_home,public_commercial',
```

- [ ] **Step 2: Use the resolver instead of the hardcoded 23%**

Still in `store()`, replace:
```php
'vat_rate'            => 23.00,
```
with:
```php
'vat_rate'            => OfferService::resolveVatRate($data['object_type'] ?? null),
```
and replace:
```php
$totalGross   = round($totalNet * 1.23, 2);
```
with:
```php
$totalGross   = round($totalNet * (1 + $offer->vat_rate / 100), 2);
```

- [ ] **Step 3: Accept `object_type` on admin update**

In `AdminQuoteRequestController::update()`, add to the validation array (after `'investment_address' => 'sometimes|nullable|string|max:255',`):
```php
'object_type' => 'sometimes|string|in:residential,care_home,public_commercial',
```

- [ ] **Step 4: Use the resolver in `generateOffer()`**

In `AdminQuoteRequestController::generateOffer()`, replace:
```php
'vat_rate'            => 23.00,
```
with:
```php
'vat_rate'            => \App\Services\OfferService::resolveVatRate($quoteRequest->object_type),
```
and replace:
```php
$totalGross   = round($totalNet * 1.23, 2);
```
with:
```php
$totalGross   = round($totalNet * (1 + $offer->vat_rate / 100), 2);
```

- [ ] **Step 5: Verify with a curl call against the public endpoint**

```bash
curl -s -X POST http://localhost:8000/api/quote-requests \
  -H "Content-Type: application/json" \
  -d '{"investor_name":"Test","investor_email":"test@example.com","object_type":"residential"}' | python3 -m json.tool
```
Then check the created offer's `vat_rate` is `8.00` (e.g. via `ddev exec php artisan tinker --execute="echo App\Models\Offer::latest()->first()->vat_rate;"`).

- [ ] **Step 6: Commit**

```bash
git add app/Http/Controllers/Api/QuoteRequestController.php app/Http/Controllers/Api/AdminQuoteRequestController.php
git commit -m "feat: derive VAT rate from quote request object_type instead of hardcoded 23%"
```

---

## Task 5: Backend — VAT disclaimer on PDF and email offer documents

**Files:**
- Modify: `wipro-laravel-backend/resources/views/offers/pdf.blade.php:405-422`
- Modify: `wipro-laravel-backend/resources/views/emails/offer-sent.blade.php:53-66`
- Modify: `wipro-laravel-backend/lang/pl/emails.php`, `wipro-laravel-backend/lang/en/emails.php`

Client's exact requested wording: "stawka VAT ma charakter poglądowy, ostatecznie decydujące są krajowe przepisy podatkowe".

- [ ] **Step 1: Add the disclaimer to the PDF**

In `resources/views/offers/pdf.blade.php`, inside the `PRICING` section, right after the closing `</div>` of `price-box` (after line 421, before the section's closing `</div>` at line 422):
```blade
<p style="font-size: 10px; color: #888; margin-top: 6px;">
    Stawka VAT ma charakter poglądowy, ostatecznie decydujące są krajowe przepisy podatkowe.
</p>
```

- [ ] **Step 2: Add the disclaimer to the offer-sent email**

In `lang/pl/emails.php`, inside the `offer_sent` array (after the `'vat'` key, whatever it currently is), add:
```php
'vat_disclaimer' => 'Stawka VAT ma charakter poglądowy, ostatecznie decydujące są krajowe przepisy podatkowe.',
```

In `lang/en/emails.php`, in the equivalent `offer_sent` array, add:
```php
'vat_disclaimer' => 'The VAT rate is indicative only; national tax regulations are ultimately decisive.',
```

In `resources/views/emails/offer-sent.blade.php`, after the closing `</table>` (line 67), before the following line (line 69, currently blank/next block), add:
```blade
<p style="font-size:11px; color:#aaa; margin-top:4px;">{{ __('emails.offer_sent.vat_disclaimer') }}</p>
```

- [ ] **Step 3: Verify by downloading a PDF**

Generate an offer via the admin panel and download its PDF (`GET /api/admin/offers/{offerId}/pdf`); confirm the disclaimer line appears under the pricing box. Send a test offer email (or preview the blade view) and confirm the disclaimer appears under the totals table.

- [ ] **Step 4: Commit**

```bash
git add resources/views/offers/pdf.blade.php resources/views/emails/offer-sent.blade.php lang/pl/emails.php lang/en/emails.php
git commit -m "feat: add VAT disclaimer note to offer PDF and email"
```

---

## Task 6: Configurator — object-type dropdown in the public quote form

**Files:**
- Modify: `wipro-react-frontend/src/configurator/types/multiStepWizard/finishesAndAccessories.ts`
- Modify: `wipro-react-frontend/src/configurator/validators/finishesAndAccessories.ts`
- Modify: `wipro-react-frontend/src/configurator/components/multiStepWizard/FinishesAndAccessories.tsx`
- Modify: `wipro-react-frontend/src/configurator/store/mainApi/response.ts`
- Modify: `wipro-react-frontend/src/configurator/i18n/pl.ts`, `wipro-react-frontend/src/configurator/i18n/en.ts`

This is the last wizard step, which already collects investor/investment fields and submits the quote request (`onSubmit` in `FinishesAndAccessories.tsx`).

- [ ] **Step 1: Add the field to the form type**

In `types/multiStepWizard/finishesAndAccessories.ts`, add to `FormFinishesAndAccessories`:
```ts
objectType: 'residential' | 'care_home' | 'public_commercial';
```

- [ ] **Step 2: Add yup validation**

In `validators/finishesAndAccessories.ts`, add:
```ts
objectType: yup.mixed<'residential' | 'care_home' | 'public_commercial'>()
    .oneOf(['residential', 'care_home', 'public_commercial'])
    .required('form.errors.require'),
```

- [ ] **Step 3: Add the field to the `StoreQuoteRequestBody` payload type**

In `store/mainApi/response.ts`, add to `StoreQuoteRequestBody` (after `additional_notes?: string;`):
```ts
object_type?: 'residential' | 'care_home' | 'public_commercial';
```

- [ ] **Step 4: Render the dropdown and include it in the submit payload**

In `FinishesAndAccessories.tsx`, add `object_type: dataCurr.objectType,` to the `sendData({...})` call (after `additional_notes:` block starting line 84, or anywhere in that object — order doesn't matter).

Add a new `BorderInput` block in the JSX (near the other form fields, before the final submit button), following the existing `Controller` pattern used for `cabinModelId`:
```tsx
{/* Typ obiektu (stawka VAT) */}
<BorderInput title={t(`${textPath}.field.objectType`)}>
    <Controller
        control={control}
        name="objectType"
        render={({ field }) => (
            <select
                {...field}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
                <option value="" disabled>{t(`${textPath}.field.objectTypePlaceholder`)}</option>
                <option value="residential">{t(`${textPath}.field.objectTypeResidential`)}</option>
                <option value="care_home">{t(`${textPath}.field.objectTypeCareHome`)}</option>
                <option value="public_commercial">{t(`${textPath}.field.objectTypePublicCommercial`)}</option>
            </select>
        )}
    />
    <p className="text-[12px] text-gray-400 mt-1">{t(`${textPath}.field.objectTypeVatNote`)}</p>
    {errors.objectType && (
        <p className="text-[14px] text-[var(--red)] mt-1">{t(errors.objectType.message ?? '')}</p>
    )}
</BorderInput>
```

- [ ] **Step 5: Add translations**

In `configurator/i18n/pl.ts`, inside `form.finishesAndAccessories.field`, add:
```ts
objectType: 'Typ obiektu',
objectTypePlaceholder: 'Wybierz typ obiektu',
objectTypeResidential: 'Mieszkaniowy (mieszkania do 150 m² lub dom jednorodzinny do 300 m²) — VAT 8%',
objectTypeCareHome: 'Dom Spokojnej Starości — VAT 8%',
objectTypePublicCommercial: 'Pozostałe, w tym budynki publiczne i komercyjne — VAT 23%',
objectTypeVatNote: 'Stawka VAT ma charakter poglądowy, ostatecznie decydujące są krajowe przepisy podatkowe.',
```

In `configurator/i18n/en.ts`, the equivalent English strings.

- [ ] **Step 6: Verify in the browser**

Run the configurator dev server, complete the wizard through to the last step, confirm the dropdown is required (form won't submit without a selection), submit with each of the 3 options and confirm (via `ddev exec php artisan tinker`) that the created `QuoteRequest.object_type` and resulting `Offer.vat_rate` match (residential/care_home → 8.00, public_commercial → 23.00).

- [ ] **Step 7: Commit**

```bash
git add src/configurator/types/multiStepWizard/finishesAndAccessories.ts \
        src/configurator/validators/finishesAndAccessories.ts \
        src/configurator/components/multiStepWizard/FinishesAndAccessories.tsx \
        src/configurator/store/mainApi/response.ts \
        src/configurator/i18n/pl.ts src/configurator/i18n/en.ts
git commit -m "feat: add object type selection to configurator, drives VAT rate"
```

---

## Task 7: Admin Panel — view/correct the object type on a quote request

**Files:**
- Modify: `wipro-react-frontend/src/admin/app/protected/quoteRequests/detail.tsx`
- Modify: `wipro-react-frontend/src/admin/i18n/pl.ts`, `wipro-react-frontend/src/admin/i18n/en.ts`

Lets admin correct the client's classification before generating the offer (reuses the existing `EditableSelect` pattern already used for `data.drive_type` and `config?.status`).

- [ ] **Step 1: Add `object_type` to the TS interface**

In `detail.tsx`, add to `QuoteRequestDetail` (after `investment_city: string | null` at line 97):
```ts
object_type: 'residential' | 'care_home' | 'public_commercial' | null
```

- [ ] **Step 2: Add the options constant**

Near `INVESTOR_STATUS_OPTIONS` (line 132), add:
```ts
const OBJECT_TYPE_OPTIONS = [
  { value: 'residential',        label: 'Mieszkaniowy (≤150 m² / dom jedn. ≤300 m²) — VAT 8%' },
  { value: 'care_home',          label: 'Dom Spokojnej Starości — VAT 8%' },
  { value: 'public_commercial',  label: 'Publiczny / komercyjny — VAT 23%' },
]
```

- [ ] **Step 3: Render the field in the "Dane inwestycji" card**

In the "Dane inwestycji" card (after the `investment_city` `EditableField` on line 821, inside the same grid), add:
```tsx
<EditableSelect
  label={t('quoteRequests.detail.objectType')}
  value={data.object_type}
  options={OBJECT_TYPE_OPTIONS}
  onSave={val => saveTextField('object_type', val)}
/>
```

- [ ] **Step 4: Add translations**

In `i18n/pl.ts`, inside `quoteRequests.detail`, add:
```ts
objectType: 'Typ obiektu (VAT)',
```
In `i18n/en.ts`, the equivalent.

- [ ] **Step 5: Verify in the browser**

Open a quote request's detail page as admin, confirm the "Typ obiektu (VAT)" field shows the client's selection (or blank/default), change it, confirm it saves (PATCH `/admin/quote-requests/{id}`), and confirm a newly generated offer picks up the new VAT rate.

- [ ] **Step 6: Commit**

```bash
git add src/admin/app/protected/quoteRequests/detail.tsx src/admin/i18n/pl.ts src/admin/i18n/en.ts
git commit -m "feat: admin can view/correct object type driving VAT rate"
```

---

## Task 8: Backend — stop creating a bogus offer when no elevator matches

**Files:**
- Create: `wipro-laravel-backend/database/migrations/2026_08_26_000002_add_needs_manual_pricing_status_to_quote_requests.php`
- Modify: `wipro-laravel-backend/app/Services/OfferService.php`
- Modify: `wipro-laravel-backend/app/Http/Controllers/Api/QuoteRequestController.php`
- Modify: `wipro-laravel-backend/app/Http/Controllers/Api/AdminQuoteRequestController.php`
- Modify: `wipro-laravel-backend/lang/pl/messages.php`, `wipro-laravel-backend/lang/en/messages.php`

Decided behavior (confirmed with project owner): the `QuoteRequest` is still created (lead captured), but when no elevator can be matched, no auto-offer is generated/emailed on public submission, and the record is flagged `needs_manual_pricing` so it's visible in the admin list/dashboard. Admin-triggered offer generation is blocked with an explicit error until an elevator is assigned to the request.

- [ ] **Step 1: Migration — widen the `status` enum**

MySQL enum columns need a raw `MODIFY` statement (no `doctrine/dbal` dependency in this project):
```php
<?php
// database/migrations/2026_08_26_000002_add_needs_manual_pricing_status_to_quote_requests.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE quote_requests MODIFY status ENUM('new', 'in_progress', 'offer_sent', 'accepted', 'rejected', 'needs_manual_pricing') DEFAULT 'new'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE quote_requests MODIFY status ENUM('new', 'in_progress', 'offer_sent', 'accepted', 'rejected') DEFAULT 'new'");
    }
};
```

- [ ] **Step 2: Run migration**

```bash
cd wipro-laravel-backend && ddev exec php artisan migrate
```
Expected: `Migrated: 2026_08_26_000002_add_needs_manual_pricing_status_to_quote_requests`

- [ ] **Step 3: Remove the bogus 0 zł fallback item and guard `buildPricedItems()`**

In `app/Services/OfferService.php`, replace the `if ($elevator) { ... } else { ... }` block at lines 522-529:
```php
        // ── 1. Cena bazowa windy ──────────────────────────────────────────────
        if ($elevator) {
            $basePrice = round((float) $elevator->base_price * $margin, 2);
            $this->addItem($offer->id, "Dźwig osobowy {$elevator->manufacturer} {$elevator->model} (udźwig {$elevator->capacity} kg, {$elevator->persons} os.)", 1, 'szt.', $basePrice, $sortOrder++);
            $totalNet += $basePrice;
        } else {
            $this->addItem($offer->id, 'Dźwig osobowy — wycena indywidualna', 1, 'szt.', 0, $sortOrder++);
        }
```
with a guard at the very top of `buildPricedItems()` (right after `$quoteRequest->loadMissing(['elevator']);` at line 505) that refuses to build pricing at all without a matched elevator, plus the now-unconditional base-price item:
```php
        $quoteRequest->loadMissing(['elevator']);

        if (!$quoteRequest->elevator) {
            throw new \RuntimeException('Nie można wygenerować wyceny bez dopasowanej windy w bazie.');
        }
```
and change the "1. Cena bazowa windy" block to (no longer needs the `if ($elevator)` branch, since we now guarantee it above):
```php
        // ── 1. Cena bazowa windy ──────────────────────────────────────────────
        $basePrice = round((float) $elevator->base_price * $margin, 2);
        $this->addItem($offer->id, "Dźwig osobowy {$elevator->manufacturer} {$elevator->model} (udźwig {$elevator->capacity} kg, {$elevator->persons} os.)", 1, 'szt.', $basePrice, $sortOrder++);
        $totalNet += $basePrice;
```
(Leave every other `$elevator && ...` guard in steps 2-11 untouched — they still read `$elevator` fine since it's guaranteed non-null now.)

- [ ] **Step 4: Skip auto-offer generation on public submission when no elevator matched**

In `app/Http/Controllers/Api/QuoteRequestController.php::store()`, wrap the existing "Auto-generate offer" try block in a condition. Change:
```php
        $quoteRequest = QuoteRequest::create(array_merge($data, [
            'user_id' => $user->id,
            'request_number' => QuoteRequest::generateRequestNumber(),
            'raw_data' => $request->all(),
            'elevator_id' => $elevatorId,
        ]));

        // Auto-generate offer v1 and send with 5 attachments
        try {
```
to:
```php
        $quoteRequest = QuoteRequest::create(array_merge($data, [
            'user_id' => $user->id,
            'request_number' => QuoteRequest::generateRequestNumber(),
            'raw_data' => $request->all(),
            'elevator_id' => $elevatorId,
            'status' => $elevatorId ? 'new' : 'needs_manual_pricing',
        ]));

        // Auto-generate offer v1 and send with 5 attachments — only when an elevator was matched
        if ($elevatorId) {
        try {
```
and add the matching closing brace right after the existing `catch` block's closing `}` (the one currently ending the try/catch, before `return response()->json([...`):
```php
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to generate/send auto-offer: ' . $e->getMessage());
        }
        }
```

- [ ] **Step 5: Block admin-triggered offer generation when no elevator is assigned**

In `app/Http/Controllers/Api/AdminQuoteRequestController.php::generateOffer()`, add right after the existing `abort_if` for accepted offers (after line 143):
```php
        abort_if(
            !$quoteRequest->elevator,
            422,
            __('messages.offer.no_elevator_matched')
        );
```

- [ ] **Step 6: Add the translation key**

In `lang/pl/messages.php`, in the `offer` array (after `'no_send_accepted'`), add:
```php
'no_elevator_matched' => 'Nie dopasowano żadnej windy z bazy do tego zapytania. Przypisz windę ręcznie (pole "Dopasowana winda"), zanim wygenerujesz ofertę.',
```
In `lang/en/messages.php`, the equivalent English string.

- [ ] **Step 7: Verify — public submission with no matching capacity**

```bash
curl -s -X POST http://localhost:8000/api/quote-requests \
  -H "Content-Type: application/json" \
  -d '{"investor_name":"Test","investor_email":"test2@example.com","lift_capacity":999999}' | python3 -m json.tool
```
Then confirm via tinker: `QuoteRequest::latest()->first()->status` is `needs_manual_pricing`, and `QuoteRequest::latest()->first()->offers()->count()` is `0`.

- [ ] **Step 8: Verify — admin generate-offer without an elevator returns 422**

Create a quote request without an `elevator_id` via `AdminQuoteRequestController::store` (admin "manual" create), then call `POST /api/admin/quote-requests/{id}/generate-offer` and confirm it returns HTTP 422 with the `no_elevator_matched` message, and that no `Offer` row was created.

- [ ] **Step 9: Commit**

```bash
git add database/migrations/2026_08_26_000002_add_needs_manual_pricing_status_to_quote_requests.php \
        app/Services/OfferService.php \
        app/Http/Controllers/Api/QuoteRequestController.php \
        app/Http/Controllers/Api/AdminQuoteRequestController.php \
        lang/pl/messages.php lang/en/messages.php
git commit -m "fix: never auto-generate a 0 zł placeholder offer when no elevator matches"
```

---

## Task 9: Admin Panel — surface the `needs_manual_pricing` status

**Files:**
- Modify: `wipro-react-frontend/src/admin/components/Badge.tsx`
- Modify: `wipro-react-frontend/src/admin/app/protected/quoteRequests/index.tsx`
- Modify: `wipro-react-frontend/src/admin/app/protected/quoteRequests/detail.tsx`
- Modify: `wipro-react-frontend/src/admin/i18n/pl.ts`, `wipro-react-frontend/src/admin/i18n/en.ts`

The dashboard's `by_status` breakdown (`AdminDashboardController::index()`) already groups by whatever `status` values exist in the DB, so `needs_manual_pricing` will appear there automatically — no backend change needed for that.

- [ ] **Step 1: Badge color**

In `components/Badge.tsx`, in `statusBadge()`, add before the `default:` case:
```ts
case 'needs_manual_pricing': return 'destructive'
```

- [ ] **Step 2: List filter + status dot**

In `app/protected/quoteRequests/index.tsx`, change:
```ts
const STATUS_FILTER_VALUES = ['new', 'in_progress', 'offer_sent', 'accepted', 'rejected'] as const
```
to:
```ts
const STATUS_FILTER_VALUES = ['new', 'in_progress', 'needs_manual_pricing', 'offer_sent', 'accepted', 'rejected'] as const
```
and add to `STATUS_DOTS`:
```ts
needs_manual_pricing: 'bg-red-400',
```

- [ ] **Step 3: Detail page status picker**

In `app/protected/quoteRequests/detail.tsx`, change:
```ts
const STATUS_VALUES = ['new', 'in_progress', 'offer_sent', 'accepted', 'rejected'] as const
```
to:
```ts
const STATUS_VALUES = ['new', 'in_progress', 'needs_manual_pricing', 'offer_sent', 'accepted', 'rejected'] as const
```

- [ ] **Step 4: Add a banner when a request needs manual pricing**

In `detail.tsx`, in the "Status" card (right after the opening `<Card className="p-6 gap-0">` at line 765, before the `<div className="flex items-center justify-between mb-4">` header), add:
```tsx
{data.status === 'needs_manual_pricing' && (
  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    {t('quoteRequests.detail.needsManualPricingBanner')}
  </div>
)}
```

- [ ] **Step 5: Add translations**

In `i18n/pl.ts`:
```ts
// in status: { ... }
needs_manual_pricing: 'Wymaga ręcznej wyceny',
// in quoteRequests.detail: { ... }
needsManualPricingBanner: 'Żadna winda z bazy nie została automatycznie dopasowana do tego zapytania — oferta NIE została wygenerowana ani wysłana. Przypisz windę ręcznie i wygeneruj ofertę z tego panelu.',
```
In `i18n/en.ts`, the equivalent.

- [ ] **Step 6: Verify in the browser**

Submit a public quote request with an unmatchable capacity, open it in the admin panel, confirm: it shows the red "Wymaga ręcznej wyceny" badge, the banner is visible, no offer exists yet, and after assigning an elevator (`data.elevator_id` field) and generating an offer, the flow completes normally.

- [ ] **Step 7: Commit**

```bash
git add src/admin/components/Badge.tsx src/admin/app/protected/quoteRequests/index.tsx src/admin/app/protected/quoteRequests/detail.tsx src/admin/i18n/pl.ts src/admin/i18n/en.ts
git commit -m "feat: surface needs_manual_pricing status in admin quote request list/detail"
```

---

## Not in scope / notes

- `OfferService::generateOffer()` (the older, unused item-builder at `app/Services/OfferService.php:24-129`) still hardcodes `vat_rate => 23.00` and has no callers anywhere in the codebase (`grep` confirms only its own definition references it). Left untouched — removing dead code is a separate cleanup, not part of this fix. Worth flagging to the client/team if a cleanup pass is ever scheduled.
- Cabin/door RAL colors: explicitly excluded per the project owner — will be populated directly in production.

---

## Self-Review Checklist

### Spec Coverage

| Client requirement | Task |
|---|---|
| Stop-surcharge 700 zł base rate should be admin-editable | Task 1, 2 |
| Stop-surcharge should vary by elevator capacity (630 kg vs 2500 kg) | Task 1 — new per-elevator `stop_surcharge_rate` column (separate from, and untouched, `coeff_stops`) |
| VAT should not be a flat hardcoded 23% | Task 3, 4 |
| VAT dropdown: mieszkaniowy ≤150m²/dom jedn. ≤300m² + niektóre DPS → 8%; pozostałe (publiczne/komercyjne) → 23% | Task 3 (`resolveVatRate`), 6 (configurator dropdown), 7 (admin correction) |
| "Stawka VAT ma charakter poglądowy..." disclaimer | Task 5 |
| No elevator match should not create a bogus 0 zł "wycena indywidualna" offer | Task 8 |
| (Clarified with owner) capture the lead, skip auto-offer, flag for manual review instead of hard-erroring the public form | Task 8, 9 |
| Colors / RAL sourcing | Explicitly out of scope per owner instruction |

All in-scope requirements covered.

### Placeholder Scan

None — every step contains actual code, exact file paths, and exact line references drawn from the current codebase.

### Type Consistency

- `resolveVatRate(?string $objectType): float` defined in Task 3 Step 4 → called identically in Task 4 Steps 2 & 4 (`OfferService::resolveVatRate(...)`, static call) ✓
- `QuoteRequest.object_type` enum values (`residential`, `care_home`, `public_commercial`) defined in Task 3 Step 1 migration → same 3 values used in Task 4 validation rules, Task 6 configurator type/dropdown, Task 7 admin `OBJECT_TYPE_OPTIONS` ✓
- `FormFinishesAndAccessories.objectType` (Task 6 Step 1) → consumed by yup schema (Step 2) and the `<Controller name="objectType">` (Step 4) ✓
- `StoreQuoteRequestBody.object_type` (Task 6 Step 3) → matches the `object_type` key sent in Task 6 Step 4's `sendData()` call and the backend's `object_type` validation key (Task 4 Step 1) ✓
- `QuoteRequestDetail.object_type` (Task 7 Step 1) → consumed by `OBJECT_TYPE_OPTIONS` + `EditableSelect` (Task 7 Steps 2-3); saved via existing `saveTextField` helper (already defined at `detail.tsx:557`) ✓
- `needs_manual_pricing` status string used consistently across: DB enum (Task 8 Step 1), `QuoteRequestController::store()` (Task 8 Step 4), `Badge.tsx` (Task 9 Step 1), `index.tsx` `STATUS_FILTER_VALUES`/`STATUS_DOTS` (Task 9 Step 2), `detail.tsx` `STATUS_VALUES` (Task 9 Step 3), i18n `status.needs_manual_pricing` (Task 9 Step 5) ✓
- `stop_surcharge_rate` column used consistently in the migration (Task 1 Step 1), `Elevator` model `$fillable`/`$casts` (Task 1 Step 3), `ElevatorController` validation (Task 1 Step 4), `OfferService::buildPricedItems()` read via `$elevator->stop_surcharge_rate ?? 700` (Task 1 Step 5), and admin UI `Elevator` interface/`nullableFloats`/`TechField` (Task 2 Steps 1-3) — `coeff_stops` itself is never modified ✓
