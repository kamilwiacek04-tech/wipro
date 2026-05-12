# Cennik EI30/EI60 + Mail z załącznikami + Historia ofert — Plan implementacji

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement EI30/EI60 door pricing with profit margin, automatic 5-attachment offer email on configurator submission and admin dispatch, and full offer version history with per-version PDF storage.

**Architecture:** Three new backend services (OfferPdfService, AestheticPdfService, QuoteMailService) plus a shared OfferService.buildPricedItems() method apply margin and EI30/EI60 pricing from the settings table. QuoteMailService is called from both public QuoteRequestController (configurator submit) and admin updateOffer() (manual send). Settings table gains 9 new key/value entries for company data and pricing — no migrations needed. Frontend GeneralTab gains company info and pricing form sections.

**Tech Stack:** Laravel 12, PHP 8.3, DomPDF (barryvdh/laravel-dompdf), PhpOffice\PhpWord, Laravel Mail with Attachment objects, React 18, TypeScript, Tailwind CSS, Vite.

---

## File map

### New files (backend — all relative to `wipro-laravel-backend/`)
| File | Purpose |
|---|---|
| `public/images/PL-Pasek_FE-RGB-poziom.png` | Static banner asset for offer PDF |
| `app/Services/OfferPdfService.php` | Generates 2-page offer PDF + standalone tech-spec PDF |
| `app/Services/AestheticPdfService.php` | Generates aesthetic description PDF (cabin photo + accessories) |
| `app/Services/QuoteMailService.php` | Orchestrates PDF generation + email dispatch with 5 attachments |
| `app/Mail/QuoteMailWithAttachments.php` | Laravel Mailable with dynamic attachment list |
| `resources/views/emails/quote-with-attachments.blade.php` | Email body template |
| `resources/views/offers/offer-pdf.blade.php` | 2-page offer PDF (page 1: commercial, page 2: tech spec + cabin photo) |
| `resources/views/offers/tech-spec-pdf.blade.php` | Standalone 1-page tech spec PDF (same content as offer page 2) |
| `resources/views/offers/aesthetic-pdf.blade.php` | Aesthetic PDF: cabin photo header + accessories grid |

### Modified files (backend)
| File | Change |
|---|---|
| `app/Services/OfferService.php` | Add `buildPricedItems()` + `parseConfiguratorNotes()` |
| `app/Http/Controllers/Api/SettingController.php` | Accept new keys in `update()`, add `uploadLogo()` |
| `app/Http/Controllers/Api/AdminQuoteRequestController.php` | `generateOffer()` → calls `buildPricedItems()`; `updateOffer()` → calls `QuoteMailService` |
| `app/Http/Controllers/Api/QuoteRequestController.php` | `store()` → auto-creates Offer v1 + calls `QuoteMailService` |
| `routes/api.php` | Add `POST /admin/settings/logo` |

### Modified files (frontend — relative to `wipro-react-frontend/`)
| File | Change |
|---|---|
| `src/admin/app/protected/database/index.tsx` | Extend `GeneralTab` with company info + pricing sections |
| `src/admin/i18n/pl.ts` | Add translation keys for new sections |
| `src/admin/i18n/en.ts` | Add translation keys for new sections |

---

## Task 1: Copy banner asset

**Files:**
- Create: `wipro-laravel-backend/public/images/PL-Pasek_FE-RGB-poziom.png`

- [ ] **Step 1: Create the images directory and copy asset**

```bash
mkdir -p /Users/wiacus/Work/wipro/wipro-laravel-backend/public/images
cp /Users/wiacus/Desktop/PL-Pasek_FE-RGB-poziom.png \
   /Users/wiacus/Work/wipro/wipro-laravel-backend/public/images/PL-Pasek_FE-RGB-poziom.png
```

- [ ] **Step 2: Verify**

```bash
ls -lh /Users/wiacus/Work/wipro/wipro-laravel-backend/public/images/
```
Expected: file listed, size > 0.

- [ ] **Step 3: Commit**

```bash
cd /Users/wiacus/Work/wipro
git add wipro-laravel-backend/public/images/PL-Pasek_FE-RGB-poziom.png
git commit -m "feat: add pasek banner asset for offer PDF"
```

---

## Task 2: Extend SettingController — company data, pricing, logo upload

**Files:**
- Modify: `wipro-laravel-backend/app/Http/Controllers/Api/SettingController.php`
- Modify: `wipro-laravel-backend/routes/api.php`

- [ ] **Step 1: Replace SettingController with extended version**

Replace the full contents of `wipro-laravel-backend/app/Http/Controllers/Api/SettingController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Setting::all()->pluck('value', 'key'));
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'max_stops'             => 'sometimes|integer|min:2|max:50',
            'door_ei30_price'       => 'sometimes|numeric|min:0',
            'door_ei60_price'       => 'sometimes|numeric|min:0',
            'profit_margin_percent' => 'sometimes|numeric|min:0|max:100',
            'company_name'          => 'sometimes|string|max:255',
            'company_address'       => 'sometimes|string|max:500',
            'company_nip'           => 'sometimes|string|max:20',
            'company_regon'         => 'sometimes|string|max:20',
            'company_krs'           => 'sometimes|string|max:20',
        ]);

        foreach ($data as $key => $value) {
            Setting::set($key, (string) $value);
        }

        return response()->json(Setting::all()->pluck('value', 'key'));
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate([
            'logo' => 'required|file|image|max:4096',
        ]);

        $old = Setting::get('company_logo_path');
        if ($old && Storage::exists($old)) {
            Storage::delete($old);
        }

        $path = $request->file('logo')->store('company', 'public');
        Setting::set('company_logo_path', 'public/' . $path);

        return response()->json([
            'company_logo_path' => 'public/' . $path,
            'logo_url' => Storage::url($path),
        ]);
    }
}
```

- [ ] **Step 2: Add logo route to `wipro-laravel-backend/routes/api.php`**

Inside the `admin` middleware group, directly after `Route::patch('/settings', ...)`, add:

```php
Route::post('/settings/logo', [SettingController::class, 'uploadLogo']);
```

- [ ] **Step 3: Verify logo endpoint exists**

```bash
cd /Users/wiacus/Work/wipro/wipro-laravel-backend
php artisan route:list | grep settings
```
Expected: `GET /api/settings`, `PATCH /api/admin/settings`, `POST /api/admin/settings/logo`.

- [ ] **Step 4: Commit**

```bash
cd /Users/wiacus/Work/wipro
git add wipro-laravel-backend/app/Http/Controllers/Api/SettingController.php \
        wipro-laravel-backend/routes/api.php
git commit -m "feat: extend SettingController with company data, EI pricing, and logo upload"
```

---

## Task 3: OfferService — shared pricing logic

Add two methods to `OfferService`: `buildPricedItems()` (creates OfferItem records, returns total net) and `parseConfiguratorNotes()` (extracts JSON from `additional_notes`). Both admin and public controllers will call these.

**Files:**
- Modify: `wipro-laravel-backend/app/Services/OfferService.php`

- [ ] **Step 1: Add the two methods to OfferService**

Open `wipro-laravel-backend/app/Services/OfferService.php`. Add the following use statements at the top of the file (after the existing ones):

```php
use App\Models\Setting;
```

Then add these two methods before the closing `}` of the class:

```php
    /**
     * Creates OfferItem records for the given offer applying margin and EI pricing from settings.
     * Loads elevator.elements relationship if not already loaded.
     * Returns total net amount.
     */
    public function buildPricedItems(QuoteRequest $quoteRequest, Offer $offer): float
    {
        $quoteRequest->loadMissing(['elevator.elements']);

        $margin   = 1 + ((float) Setting::get('profit_margin_percent', '0')) / 100;
        $ei30Unit = (float) Setting::get('door_ei30_price', '0');
        $ei60Unit = (float) Setting::get('door_ei60_price', '0');

        $config   = $this->parseConfiguratorNotes($quoteRequest->additional_notes);
        $ei30Count = (int) ($config['ei30DoorsCount'] ?? 0);
        $ei60Count = (int) ($config['ei60DoorsCount'] ?? 0);

        $totalNet   = 0.0;
        $sortOrder  = 1;

        if ($quoteRequest->elevator) {
            $elevator  = $quoteRequest->elevator;
            $basePrice = round((float) $elevator->base_price * $margin, 2);

            OfferItem::create([
                'offer_id'        => $offer->id,
                'description'     => "Dźwig osobowy {$elevator->manufacturer} {$elevator->model} (udźwig {$elevator->capacity} kg, {$elevator->persons} os.)",
                'quantity'        => 1,
                'unit'            => 'szt.',
                'unit_price_net'  => $basePrice,
                'total_price_net' => $basePrice,
                'sort_order'      => $sortOrder++,
            ]);
            $totalNet += $basePrice;

            foreach ($elevator->elements as $element) {
                $elemPrice = round((float) $element->price * $margin, 2);
                OfferItem::create([
                    'offer_id'        => $offer->id,
                    'description'     => $element->name,
                    'quantity'        => 1,
                    'unit'            => 'szt.',
                    'unit_price_net'  => $elemPrice,
                    'total_price_net' => $elemPrice,
                    'sort_order'      => $sortOrder++,
                ]);
                $totalNet += $elemPrice;
            }
        } else {
            OfferItem::create([
                'offer_id'        => $offer->id,
                'description'     => 'Dźwig osobowy - wycena indywidualna',
                'quantity'        => 1,
                'unit'            => 'szt.',
                'unit_price_net'  => 0,
                'total_price_net' => 0,
                'sort_order'      => $sortOrder++,
            ]);
        }

        if ($ei30Count > 0 && $ei30Unit > 0) {
            $unitPrice  = round($ei30Unit * $margin, 2);
            $totalItem  = round($unitPrice * $ei30Count, 2);
            OfferItem::create([
                'offer_id'        => $offer->id,
                'description'     => 'Drzwi przeciwpożarowe EI30',
                'quantity'        => $ei30Count,
                'unit'            => 'szt.',
                'unit_price_net'  => $unitPrice,
                'total_price_net' => $totalItem,
                'sort_order'      => $sortOrder++,
            ]);
            $totalNet += $totalItem;
        }

        if ($ei60Count > 0 && $ei60Unit > 0) {
            $unitPrice  = round($ei60Unit * $margin, 2);
            $totalItem  = round($unitPrice * $ei60Count, 2);
            OfferItem::create([
                'offer_id'        => $offer->id,
                'description'     => 'Drzwi przeciwpożarowe EI60',
                'quantity'        => $ei60Count,
                'unit'            => 'szt.',
                'unit_price_net'  => $unitPrice,
                'total_price_net' => $totalItem,
                'sort_order'      => $sortOrder++,
            ]);
            $totalNet += $totalItem;
        }

        return $totalNet;
    }

    /**
     * Extracts the JSON object embedded in additional_notes.
     * The configurator appends a JSON block after two newlines.
     */
    public function parseConfiguratorNotes(?string $notes): array
    {
        if (!$notes) return [];
        foreach (array_reverse(preg_split('/\n{2,}/', $notes)) as $part) {
            $decoded = json_decode(trim($part), true);
            if (is_array($decoded)) return $decoded;
        }
        return [];
    }
```

- [ ] **Step 2: Verify the file parses without errors**

```bash
cd /Users/wiacus/Work/wipro/wipro-laravel-backend
php artisan tinker --execute="new App\Services\OfferService(); echo 'ok';"
```
Expected output: `ok`.

- [ ] **Step 3: Commit**

```bash
cd /Users/wiacus/Work/wipro
git add wipro-laravel-backend/app/Services/OfferService.php
git commit -m "feat: add buildPricedItems and parseConfiguratorNotes to OfferService"
```

---

## Task 4: OfferPdfService + blade templates (2-page offer + standalone tech spec)

**Files:**
- Create: `wipro-laravel-backend/app/Services/OfferPdfService.php`
- Create: `wipro-laravel-backend/resources/views/offers/offer-pdf.blade.php`
- Create: `wipro-laravel-backend/resources/views/offers/tech-spec-pdf.blade.php`

- [ ] **Step 1: Create `wipro-laravel-backend/resources/views/offers/offer-pdf.blade.php`**

```blade
<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<title>Oferta {{ $offer->offer_number }}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: DejaVu Sans, sans-serif; font-size:10px; color:#1a1a2e; line-height:1.5; }
.accent { background:#ffb400; height:6px; }
.header { display:table; width:100%; padding:18px 32px 14px; border-bottom:1px solid #eee; }
.h-left { display:table-cell; vertical-align:middle; width:55%; }
.h-right { display:table-cell; vertical-align:middle; text-align:right; }
.logo-img { max-height:55px; max-width:180px; }
.company-name { font-size:22px; font-weight:bold; color:#1a1a2e; letter-spacing:2px; }
.company-meta { font-size:8px; color:#888; margin-top:4px; line-height:1.7; }
.badge { display:inline-block; background:#ffb400; color:#1a1a2e; font-size:7px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; padding:3px 12px; border-radius:20px; margin-bottom:4px; }
.offer-num { font-size:14px; font-weight:bold; }
.offer-meta { font-size:8px; color:#888; margin-top:2px; }
.body { padding:0 32px 20px; }
.section { margin-top:16px; }
.section-title { font-size:7px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#ffb400; border-bottom:2px solid #ffb400; padding-bottom:3px; margin-bottom:10px; }
.two-col { display:table; width:100%; }
.col { display:table-cell; width:50%; vertical-align:top; }
.col-r { padding-left:16px; }
.info-row { display:table; width:100%; margin-bottom:4px; }
.info-label { display:table-cell; width:42%; font-size:8px; color:#888; }
.info-value { display:table-cell; font-size:10px; font-weight:bold; }
table.items { width:100%; border-collapse:collapse; margin-top:6px; font-size:9px; }
table.items th { text-align:left; color:#888; border-bottom:1px solid #ddd; padding:4px 6px; font-weight:normal; font-size:8px; }
table.items td { padding:5px 6px; border-bottom:1px solid #f5f5f5; }
table.items tr:last-child td { border-bottom:none; }
.price-box { border:2px solid #1a1a2e; border-radius:6px; overflow:hidden; margin-top:6px; }
.p-row { display:table; width:100%; padding:7px 14px; border-bottom:1px solid #f0f0f0; }
.p-row:last-child { border-bottom:none; }
.p-label { display:table-cell; font-size:9px; color:#555; }
.p-value { display:table-cell; text-align:right; font-size:9px; font-weight:bold; }
.p-grand { background:#1a1a2e; }
.p-grand .p-label { color:#fff; font-size:10px; }
.p-grand .p-value { color:#ffb400; font-size:12px; }
.pasek { margin-top:auto; padding-top:16px; }
.pasek img { width:100%; display:block; }
/* page 2 */
.spec-grid { display:table; width:100%; }
.spec-row { display:table-row; }
.spec-cell { display:table-cell; width:25%; padding:6px 8px; border:1px solid #f0f0f0; vertical-align:top; }
.spec-cell-label { font-size:7px; color:#aaa; text-transform:uppercase; letter-spacing:0.5px; }
.spec-cell-value { font-size:9px; font-weight:bold; margin-top:2px; }
.spec-cell:nth-child(even) { background:#fafafa; }
.cabin-img { max-width:280px; max-height:220px; margin-top:14px; border-radius:6px; }
</style>
</head>
<body>

<div class="accent"></div>

{{-- PAGE 1: Commercial offer --}}
<div class="header">
  <div class="h-left">
    @if($logoBase64)
      <img class="logo-img" src="{{ $logoBase64 }}">
    @else
      <div class="company-name">{{ $settings['company_name'] ?? 'WIPRO' }}</div>
    @endif
    <div class="company-meta">
      @if(!empty($settings['company_address'])){{ $settings['company_address'] }}<br>@endif
      @if(!empty($settings['company_nip']))NIP: {{ $settings['company_nip'] }}@endif
      @if(!empty($settings['company_regon']))&nbsp;&nbsp;REGON: {{ $settings['company_regon'] }}@endif
      @if(!empty($settings['company_krs']))<br>KRS: {{ $settings['company_krs'] }}@endif
    </div>
  </div>
  <div class="h-right">
    <div class="badge">Oferta handlowa</div>
    <div class="offer-num">{{ $offer->offer_number }}</div>
    <div class="offer-meta">Data: {{ $offer->created_at->format('d.m.Y') }}</div>
    @if($offer->valid_until)
    <div class="offer-meta">Ważna do: <strong>{{ $offer->valid_until->format('d.m.Y') }}</strong></div>
    @endif
  </div>
</div>

<div class="body">

<div class="section">
  <div class="two-col">
    <div class="col">
      <div class="section-title">Adresat oferty</div>
      @if($qr->investor_name)
      <div class="info-row"><span class="info-label">Imię i nazwisko</span><span class="info-value">{{ $qr->investor_name }}</span></div>
      @endif
      @if($qr->investor_company)
      <div class="info-row"><span class="info-label">Firma</span><span class="info-value">{{ $qr->investor_company }}</span></div>
      @endif
      @if($qr->investor_nip)
      <div class="info-row"><span class="info-label">NIP</span><span class="info-value">{{ $qr->investor_nip }}</span></div>
      @endif
      @if($qr->investor_email)
      <div class="info-row"><span class="info-label">Email</span><span class="info-value">{{ $qr->investor_email }}</span></div>
      @endif
      @if($qr->investor_phone)
      <div class="info-row"><span class="info-label">Telefon</span><span class="info-value">{{ $qr->investor_phone }}</span></div>
      @endif
    </div>
    <div class="col col-r">
      <div class="section-title">Dane inwestycji</div>
      @if($qr->investment_name)
      <div class="info-row"><span class="info-label">Nazwa</span><span class="info-value">{{ $qr->investment_name }}</span></div>
      @endif
      @if($qr->investment_address)
      <div class="info-row"><span class="info-label">Adres</span><span class="info-value">{{ $qr->investment_address }}</span></div>
      @endif
      @if($qr->stops)
      <div class="info-row"><span class="info-label">Liczba przystanków</span><span class="info-value">{{ $qr->stops }}</span></div>
      @endif
      @if($qr->drive_type)
      <div class="info-row"><span class="info-label">Napęd</span><span class="info-value">{{ $qr->drive_type }}</span></div>
      @endif
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Zakres i wycena</div>
  <table class="items">
    <thead>
      <tr>
        <th style="width:50%">Opis</th>
        <th style="text-align:center">Ilość</th>
        <th style="text-align:center">J.m.</th>
        <th style="text-align:right">Cena jedn. netto</th>
        <th style="text-align:right">Wartość netto</th>
      </tr>
    </thead>
    <tbody>
      @foreach($offer->items as $item)
      <tr>
        <td>{{ $item->description }}</td>
        <td style="text-align:center">{{ $item->quantity }}</td>
        <td style="text-align:center">{{ $item->unit }}</td>
        <td style="text-align:right">{{ number_format($item->unit_price_net, 2, ',', ' ') }} PLN</td>
        <td style="text-align:right">{{ number_format($item->total_price_net, 2, ',', ' ') }} PLN</td>
      </tr>
      @endforeach
    </tbody>
  </table>
</div>

<div class="section">
  <div class="section-title">Wartość oferty</div>
  <div class="price-box">
    <div class="p-row"><span class="p-label">Wartość netto</span><span class="p-value">{{ number_format($offer->total_price_net, 2, ',', ' ') }} PLN</span></div>
    <div class="p-row"><span class="p-label">VAT {{ $offer->vat_rate }}%</span><span class="p-value">{{ number_format($offer->total_price_gross - $offer->total_price_net, 2, ',', ' ') }} PLN</span></div>
    <div class="p-row p-grand"><span class="p-label">Łącznie brutto</span><span class="p-value">{{ number_format($offer->total_price_gross, 2, ',', ' ') }} PLN</span></div>
  </div>
</div>

@if($pasekBase64)
<div class="pasek">
  <img src="{{ $pasekBase64 }}">
</div>
@endif

</div>{{-- /body page 1 --}}

{{-- PAGE 2: Technical specification --}}
<div style="page-break-before:always;"></div>

<div class="accent"></div>
<div style="padding:18px 32px 20px;">

<div class="section">
  <div class="section-title">Specyfikacja Techniczna Dźwigu</div>
  @php
    $specs = array_filter([
      'Udźwig'        => $qr->lift_capacity ? $qr->lift_capacity . ' kg' : null,
      'Przystanki'    => $qr->stops,
      'Kondygnacje'   => $qr->floors,
      'Napęd'         => $qr->drive_type,
      'Wys. podnosz.' => isset($parsedNotes['liftingHeight']) ? $parsedNotes['liftingHeight'] . ' m' : null,
      'Szer. szybu'   => $qr->shaft_width  ? $qr->shaft_width  . ' mm' : null,
      'Głęb. szybu'   => $qr->shaft_depth  ? $qr->shaft_depth  . ' mm' : null,
      'Szer. kabiny'  => $qr->cabin_width  ? $qr->cabin_width  . ' mm' : null,
      'Głęb. kabiny'  => $qr->cabin_depth  ? $qr->cabin_depth  . ' mm' : null,
      'Wys. kabiny'   => $qr->cabin_height ? $qr->cabin_height . ' mm' : null,
      'Podszybie'     => $qr->pit_depth    ? $qr->pit_depth    . ' mm' : null,
      'Nadszybie'     => $qr->overhead     ? $qr->overhead     . ' mm' : null,
      'Typ drzwi'     => $qr->door_type,
      'Szer. drzwi'   => $qr->door_width   ? $qr->door_width   . ' mm' : null,
      'Wys. drzwi'    => $qr->door_height  ? $qr->door_height  . ' mm' : null,
      'Drzwi EI30'    => ($parsedNotes['ei30DoorsCount'] ?? 0) > 0 ? ($parsedNotes['ei30DoorsCount'] . ' szt.') : null,
      'Drzwi EI60'    => ($parsedNotes['ei60DoorsCount'] ?? 0) > 0 ? ($parsedNotes['ei60DoorsCount'] . ' szt.') : null,
      'Liczba wejść'  => $parsedNotes['accessCount'] ?? null,
      'Strona mech.'  => isset($parsedNotes['leftSideMechanic']) ? ($parsedNotes['leftSideMechanic'] ? 'Lewa' : 'Prawa') : null,
      'Przeznaczenie' => $parsedNotes['status'] ?? null,
    ]);
  @endphp
  <div class="spec-grid">
    @foreach(array_chunk($specs, 4, true) as $row)
    <div class="spec-row">
      @foreach($row as $label => $value)
      <div class="spec-cell">
        <div class="spec-cell-label">{{ $label }}</div>
        <div class="spec-cell-value">{{ $value }}</div>
      </div>
      @endforeach
      @for($i = count($row); $i < 4; $i++)
      <div class="spec-cell" style="background:#fff;border-color:#f8f8f8;"></div>
      @endfor
    </div>
    @endforeach
  </div>
</div>

@if($cabinImageBase64)
<div class="section">
  <div class="section-title">Wybrany model kabiny</div>
  <img class="cabin-img" src="{{ $cabinImageBase64 }}">
</div>
@endif

</div>

</body>
</html>
```

- [ ] **Step 2: Create `wipro-laravel-backend/resources/views/offers/tech-spec-pdf.blade.php`**

```blade
<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<title>Specyfikacja Techniczna</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: DejaVu Sans, sans-serif; font-size:10px; color:#1a1a2e; line-height:1.5; }
.accent { background:#ffb400; height:6px; }
.header { padding:16px 32px 12px; border-bottom:1px solid #eee; }
.header h1 { font-size:14px; font-weight:bold; }
.header p { font-size:8px; color:#888; margin-top:3px; }
.body { padding:16px 32px; }
.section-title { font-size:7px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#ffb400; border-bottom:2px solid #ffb400; padding-bottom:3px; margin-bottom:10px; }
.spec-grid { display:table; width:100%; }
.spec-row { display:table-row; }
.spec-cell { display:table-cell; width:25%; padding:6px 8px; border:1px solid #f0f0f0; vertical-align:top; }
.spec-cell-label { font-size:7px; color:#aaa; text-transform:uppercase; letter-spacing:0.5px; }
.spec-cell-value { font-size:9px; font-weight:bold; margin-top:2px; }
.spec-cell:nth-child(even) { background:#fafafa; }
.cabin-img { max-width:280px; max-height:220px; margin-top:14px; border-radius:6px; }
</style>
</head>
<body>

<div class="accent"></div>
<div class="header">
  <h1>Specyfikacja Techniczna Dźwigu</h1>
  <p>Zapytanie nr: {{ $qr->request_number }} &nbsp;·&nbsp; Data: {{ now()->format('d.m.Y') }}</p>
</div>

<div class="body">

<div class="section-title">Dane techniczne</div>
@php
  $specs = array_filter([
    'Udźwig'        => $qr->lift_capacity ? $qr->lift_capacity . ' kg' : null,
    'Przystanki'    => $qr->stops,
    'Kondygnacje'   => $qr->floors,
    'Napęd'         => $qr->drive_type,
    'Wys. podnosz.' => isset($parsedNotes['liftingHeight']) ? $parsedNotes['liftingHeight'] . ' m' : null,
    'Szer. szybu'   => $qr->shaft_width  ? $qr->shaft_width  . ' mm' : null,
    'Głęb. szybu'   => $qr->shaft_depth  ? $qr->shaft_depth  . ' mm' : null,
    'Szer. kabiny'  => $qr->cabin_width  ? $qr->cabin_width  . ' mm' : null,
    'Głęb. kabiny'  => $qr->cabin_depth  ? $qr->cabin_depth  . ' mm' : null,
    'Wys. kabiny'   => $qr->cabin_height ? $qr->cabin_height . ' mm' : null,
    'Podszybie'     => $qr->pit_depth    ? $qr->pit_depth    . ' mm' : null,
    'Nadszybie'     => $qr->overhead     ? $qr->overhead     . ' mm' : null,
    'Typ drzwi'     => $qr->door_type,
    'Szer. drzwi'   => $qr->door_width   ? $qr->door_width   . ' mm' : null,
    'Wys. drzwi'    => $qr->door_height  ? $qr->door_height  . ' mm' : null,
    'Drzwi EI30'    => ($parsedNotes['ei30DoorsCount'] ?? 0) > 0 ? ($parsedNotes['ei30DoorsCount'] . ' szt.') : null,
    'Drzwi EI60'    => ($parsedNotes['ei60DoorsCount'] ?? 0) > 0 ? ($parsedNotes['ei60DoorsCount'] . ' szt.') : null,
    'Liczba wejść'  => $parsedNotes['accessCount'] ?? null,
    'Strona mech.'  => isset($parsedNotes['leftSideMechanic']) ? ($parsedNotes['leftSideMechanic'] ? 'Lewa' : 'Prawa') : null,
    'Przeznaczenie' => $parsedNotes['status'] ?? null,
  ]);
@endphp
<div class="spec-grid">
  @foreach(array_chunk($specs, 4, true) as $row)
  <div class="spec-row">
    @foreach($row as $label => $value)
    <div class="spec-cell">
      <div class="spec-cell-label">{{ $label }}</div>
      <div class="spec-cell-value">{{ $value }}</div>
    </div>
    @endforeach
    @for($i = count($row); $i < 4; $i++)
    <div class="spec-cell" style="background:#fff;border-color:#f8f8f8;"></div>
    @endfor
  </div>
  @endforeach
</div>

@if($cabinImageBase64)
<div style="margin-top:16px;">
  <div class="section-title">Model kabiny</div>
  <img class="cabin-img" src="{{ $cabinImageBase64 }}">
</div>
@endif

</div>
</body>
</html>
```

- [ ] **Step 3: Create `wipro-laravel-backend/app/Services/OfferPdfService.php`**

```php
<?php

namespace App\Services;

use App\Models\CabinModel;
use App\Models\Offer;
use App\Models\QuoteRequest;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class OfferPdfService
{
    /**
     * Generates the full 2-page offer PDF, saves it to storage, updates offer.pdf_path.
     * Returns the storage path.
     */
    public function generate(QuoteRequest $quoteRequest, Offer $offer): string
    {
        $quoteRequest->loadMissing(['elevator']);
        $offer->loadMissing(['items']);

        $offerService = new OfferService();
        $parsedNotes  = $offerService->parseConfiguratorNotes($quoteRequest->additional_notes);

        $settings = Setting::all()->pluck('value', 'key')->toArray();

        $logoBase64  = $this->storageImageToBase64($settings['company_logo_path'] ?? null);
        $pasekBase64 = $this->publicImageToBase64('images/PL-Pasek_FE-RGB-poziom.png');

        $cabinModel     = null;
        $cabinImageBase64 = null;
        $cabinModelId   = (int) ($parsedNotes['cabinModelId'] ?? 0);
        if ($cabinModelId > 0) {
            $cabinModel = CabinModel::find($cabinModelId);
            if ($cabinModel?->image_url) {
                $cabinImageBase64 = $this->urlImageToBase64($cabinModel->image_url);
            }
        }

        $pdf = Pdf::loadView('offers.offer-pdf', compact(
            'offer', 'settings', 'logoBase64', 'pasekBase64', 'cabinImageBase64', 'parsedNotes'
        ) + ['qr' => $quoteRequest])->setPaper('a4');

        $filename = str_replace('/', '_', $offer->offer_number) . '.pdf';
        $path     = 'offers/' . $filename;

        if (!is_dir(storage_path('app/offers'))) {
            mkdir(storage_path('app/offers'), 0755, true);
        }

        Storage::put($path, $pdf->output());
        $offer->update(['pdf_path' => $path]);

        return $path;
    }

    /**
     * Generates a standalone 1-page tech-spec PDF (for separate attachment).
     * Returns raw PDF string — not saved to disk.
     */
    public function generateTechSpec(QuoteRequest $quoteRequest): string
    {
        $offerService = new OfferService();
        $parsedNotes  = $offerService->parseConfiguratorNotes($quoteRequest->additional_notes);

        $cabinImageBase64 = null;
        $cabinModelId     = (int) ($parsedNotes['cabinModelId'] ?? 0);
        if ($cabinModelId > 0) {
            $cabinModel = CabinModel::find($cabinModelId);
            if ($cabinModel?->image_url) {
                $cabinImageBase64 = $this->urlImageToBase64($cabinModel->image_url);
            }
        }

        return Pdf::loadView('offers.tech-spec-pdf', [
            'qr'               => $quoteRequest,
            'parsedNotes'      => $parsedNotes,
            'cabinImageBase64' => $cabinImageBase64,
        ])->setPaper('a4')->output();
    }

    private function storageImageToBase64(?string $storagePath): ?string
    {
        if (!$storagePath || !Storage::exists($storagePath)) return null;
        $content = Storage::get($storagePath);
        $ext     = strtolower(pathinfo($storagePath, PATHINFO_EXTENSION));
        $mime    = match($ext) { 'jpg', 'jpeg' => 'image/jpeg', 'gif' => 'image/gif', default => 'image/png' };
        return 'data:' . $mime . ';base64,' . base64_encode($content);
    }

    private function publicImageToBase64(string $relativePath): ?string
    {
        $abs = public_path($relativePath);
        if (!file_exists($abs)) return null;
        $ext  = strtolower(pathinfo($abs, PATHINFO_EXTENSION));
        $mime = match($ext) { 'jpg', 'jpeg' => 'image/jpeg', 'gif' => 'image/gif', default => 'image/png' };
        return 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($abs));
    }

    private function urlImageToBase64(?string $url): ?string
    {
        if (!$url) return null;
        try {
            $content = @file_get_contents($url);
            if (!$content) return null;
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime  = finfo_buffer($finfo, $content);
            finfo_close($finfo);
            return 'data:' . $mime . ';base64,' . base64_encode($content);
        } catch (\Throwable) {
            return null;
        }
    }
}
```

- [ ] **Step 4: Verify the service loads**

```bash
cd /Users/wiacus/Work/wipro/wipro-laravel-backend
php artisan tinker --execute="new App\Services\OfferPdfService(); echo 'ok';"
```
Expected: `ok`.

- [ ] **Step 5: Commit**

```bash
cd /Users/wiacus/Work/wipro
git add wipro-laravel-backend/app/Services/OfferPdfService.php \
        wipro-laravel-backend/resources/views/offers/offer-pdf.blade.php \
        wipro-laravel-backend/resources/views/offers/tech-spec-pdf.blade.php
git commit -m "feat: add OfferPdfService with 2-page offer PDF and standalone tech-spec PDF"
```

---

## Task 5: AestheticPdfService + blade template

**Files:**
- Create: `wipro-laravel-backend/app/Services/AestheticPdfService.php`
- Create: `wipro-laravel-backend/resources/views/offers/aesthetic-pdf.blade.php`

- [ ] **Step 1: Create `wipro-laravel-backend/resources/views/offers/aesthetic-pdf.blade.php`**

```blade
<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<title>Opis Rozwiązań Estetycznych</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: DejaVu Sans, sans-serif; font-size:10px; color:#1a1a2e; line-height:1.5; }
.accent { background:#ffb400; height:6px; }
.header { padding:16px 32px 14px; border-bottom:1px solid #eee; }
.header h1 { font-size:15px; font-weight:bold; color:#1a1a2e; }
.header p { font-size:8px; color:#888; margin-top:3px; }
.body { padding:16px 32px; }
.section-title { font-size:7px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#ffb400; border-bottom:2px solid #ffb400; padding-bottom:3px; margin-bottom:12px; margin-top:18px; }
.cabin-section { text-align:center; margin-bottom:16px; }
.cabin-section img { max-width:320px; max-height:250px; border-radius:8px; }
.cabin-section p { font-size:11px; font-weight:bold; margin-top:8px; }
.grid { display:table; width:100%; border-collapse:separate; }
.grid-row { display:table-row; }
.grid-cell { display:table-cell; width:50%; padding:10px; border:1px solid #f0f0f0; vertical-align:top; text-align:center; }
.grid-cell img { max-width:180px; max-height:140px; border-radius:6px; }
.grid-cell p { font-size:9px; font-weight:bold; margin-top:6px; color:#1a1a2e; }
.grid-cell .cat { font-size:7px; color:#aaa; text-transform:uppercase; letter-spacing:1px; margin-top:2px; }
.no-image { width:180px; height:120px; background:#f5f5f5; border-radius:6px; display:inline-block; line-height:120px; color:#ccc; font-size:9px; }
</style>
</head>
<body>

<div class="accent"></div>
<div class="header">
  <h1>Opis Rozwiązań Estetycznych</h1>
  <p>Zapytanie nr: {{ $qr->request_number }} &nbsp;·&nbsp; {{ now()->format('d.m.Y') }}</p>
</div>

<div class="body">

@if($cabinModel)
<div class="section-title">Wybrany model kabiny</div>
<div class="cabin-section">
  @if($cabinImageBase64)
    <img src="{{ $cabinImageBase64 }}">
  @else
    <div class="no-image">Brak zdjęcia</div>
  @endif
  <p>{{ $cabinModel->name_pl }}</p>
</div>
@endif

@if(count($accessories) > 0)
<div class="section-title">Wybrane wykończenia i akcesoria</div>
<div class="grid">
  @foreach(array_chunk($accessories, 2) as $row)
  <div class="grid-row">
    @foreach($row as $idx => $accessory)
    <div class="grid-cell">
      @if(isset($accessoryImages[$accessory['id']]) && $accessoryImages[$accessory['id']])
        <img src="{{ $accessoryImages[$accessory['id']] }}">
      @else
        <div class="no-image">Brak zdjęcia</div>
      @endif
      <p>{{ $accessory['name_pl'] }}</p>
      <div class="cat">{{ $accessory['category'] }}</div>
    </div>
    @endforeach
    @if(count($row) === 1)
    <div class="grid-cell"></div>
    @endif
  </div>
  @endforeach
</div>
@endif

</div>
</body>
</html>
```

- [ ] **Step 2: Create `wipro-laravel-backend/app/Services/AestheticPdfService.php`**

```php
<?php

namespace App\Services;

use App\Models\CabinAccessory;
use App\Models\CabinModel;
use App\Models\QuoteRequest;
use Barryvdh\DomPDF\Facade\Pdf;

class AestheticPdfService
{
    /**
     * Generates the aesthetic description PDF.
     * Returns raw PDF string — not saved to disk.
     */
    public function generate(QuoteRequest $quoteRequest): string
    {
        $offerService = new OfferService();
        $parsedNotes  = $offerService->parseConfiguratorNotes($quoteRequest->additional_notes);

        // Collect all accessory IDs from parsed notes
        $accessoryIdFields = ['panelId', 'signalId', 'ceilingId', 'mirrorId', 'handrailId', 'flooringId'];
        $singleIds = [];
        foreach ($accessoryIdFields as $field) {
            if (!empty($parsedNotes[$field])) {
                $singleIds[] = (int) $parsedNotes[$field];
            }
        }
        $extraIds = array_map('intval', (array) ($parsedNotes['extraIds'] ?? []));
        $allIds   = array_unique(array_merge($singleIds, $extraIds));

        $accessories = CabinAccessory::whereIn('id', $allIds)->get()
            ->map(fn($a) => [
                'id'       => $a->id,
                'name_pl'  => $a->name_pl,
                'category' => $a->category,
                'image_url'=> $a->image_url,
            ])
            ->sortBy(fn($a) => array_search($a['id'], $allIds))
            ->values()
            ->all();

        // Cabin model
        $cabinModel       = null;
        $cabinImageBase64 = null;
        $cabinModelId     = (int) ($parsedNotes['cabinModelId'] ?? 0);
        if ($cabinModelId > 0) {
            $cabinModel = CabinModel::find($cabinModelId);
            if ($cabinModel?->image_url) {
                $cabinImageBase64 = $this->urlToBase64($cabinModel->image_url);
            }
        }

        // Fetch accessory images as base64
        $accessoryImages = [];
        foreach ($accessories as $acc) {
            $accessoryImages[$acc['id']] = $acc['image_url']
                ? $this->urlToBase64($acc['image_url'])
                : null;
        }

        return Pdf::loadView('offers.aesthetic-pdf', [
            'qr'               => $quoteRequest,
            'cabinModel'       => $cabinModel,
            'cabinImageBase64' => $cabinImageBase64,
            'accessories'      => $accessories,
            'accessoryImages'  => $accessoryImages,
        ])->setPaper('a4')->output();
    }

    private function urlToBase64(?string $url): ?string
    {
        if (!$url) return null;
        try {
            $content = @file_get_contents($url);
            if (!$content) return null;
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime  = finfo_buffer($finfo, $content);
            finfo_close($finfo);
            return 'data:' . $mime . ';base64,' . base64_encode($content);
        } catch (\Throwable) {
            return null;
        }
    }
}
```

- [ ] **Step 3: Verify**

```bash
cd /Users/wiacus/Work/wipro/wipro-laravel-backend
php artisan tinker --execute="new App\Services\AestheticPdfService(); echo 'ok';"
```
Expected: `ok`.

- [ ] **Step 4: Commit**

```bash
cd /Users/wiacus/Work/wipro
git add wipro-laravel-backend/app/Services/AestheticPdfService.php \
        wipro-laravel-backend/resources/views/offers/aesthetic-pdf.blade.php
git commit -m "feat: add AestheticPdfService with cabin photo and accessories grid PDF"
```

---

## Task 6: QuoteMailWithAttachments + QuoteMailService

**Files:**
- Create: `wipro-laravel-backend/app/Mail/QuoteMailWithAttachments.php`
- Create: `wipro-laravel-backend/resources/views/emails/quote-with-attachments.blade.php`
- Create: `wipro-laravel-backend/app/Services/QuoteMailService.php`

- [ ] **Step 1: Create `wipro-laravel-backend/resources/views/emails/quote-with-attachments.blade.php`**

```blade
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Oferta handlowa</title>
<style>
body { font-family: Arial, sans-serif; line-height:1.6; color:#333; max-width:620px; margin:0 auto; padding:20px; }
.header { background:#ffb400; padding:20px; text-align:center; border-radius:8px 8px 0 0; }
.header h1 { color:#1a1a1a; margin:0; font-size:22px; }
.content { background:#f9f9f9; padding:30px; border-radius:0 0 8px 8px; }
.info-box { background:white; border:1px solid #e0e0e0; border-radius:6px; padding:20px; margin:20px 0; }
.number { font-size:18px; font-family:monospace; font-weight:bold; color:#1a1a1a; }
</style>
</head>
<body>
<div class="header"><h1>Oferta handlowa WIPRO</h1></div>
<div class="content">
  <p>Szanowna Pani / Szanowny Panie <strong>{{ $quoteRequest->investor_name }}</strong>,</p>
  <p>Dziękujemy za złożone zapytanie ofertowe. W załączeniu przesyłamy komplet dokumentacji:</p>
  <div class="info-box">
    <p><strong>Numer oferty:</strong> <span class="number">{{ $offer->offer_number }}</span></p>
    <p><strong>Data wystawienia:</strong> {{ now()->format('d.m.Y') }}</p>
    @if($offer->valid_until)
    <p><strong>Ważna do:</strong> {{ \Carbon\Carbon::parse($offer->valid_until)->format('d.m.Y') }}</p>
    @endif
  </div>
  <p>W skład przesłanej dokumentacji wchodzą:</p>
  <ul style="font-size:14px; margin:10px 0 10px 20px; line-height:2;">
    <li>Oferta handlowa (PDF)</li>
    <li>Opis rozwiązań estetycznych (PDF)</li>
    <li>Specyfikacja techniczna (PDF)</li>
    <li>Rysunki techniczne (jeśli dostępne)</li>
    <li>Opis podstawowy (jeśli dostępny)</li>
  </ul>
  <p>W razie pytań prosimy o kontakt pod adresem <a href="mailto:{{ config('mail.from.address') }}">{{ config('mail.from.address') }}</a></p>
</div>
</body>
</html>
```

- [ ] **Step 2: Create `wipro-laravel-backend/app/Mail/QuoteMailWithAttachments.php`**

```php
<?php

namespace App\Mail;

use App\Models\Offer;
use App\Models\QuoteRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class QuoteMailWithAttachments extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly QuoteRequest $quoteRequest,
        public readonly Offer $offer,
        public readonly string $offerPdfPath,
        public readonly string $aestheticPdfContent,
        public readonly string $techSpecPdfContent,
        public readonly array $extraAttachments,
        string $locale = 'pl',
    ) {
        $this->locale($locale);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Oferta handlowa nr ' . $this->offer->offer_number,
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.quote-with-attachments');
    }

    public function attachments(): array
    {
        $list = [];

        // 1. Full offer PDF
        if (Storage::exists($this->offerPdfPath)) {
            $filename = 'oferta-' . str_replace('/', '_', $this->offer->offer_number) . '.pdf';
            $list[] = Attachment::fromPath(Storage::path($this->offerPdfPath))
                ->as($filename)
                ->withMime('application/pdf');
        }

        // 2. Aesthetic description PDF (in-memory)
        $aestheticContent = $this->aestheticPdfContent;
        $list[] = Attachment::fromData(fn() => $aestheticContent, 'opis-rozwiazan-estetycznych.pdf')
            ->withMime('application/pdf');

        // 3. Technical spec PDF (in-memory)
        $techContent = $this->techSpecPdfContent;
        $list[] = Attachment::fromData(fn() => $techContent, 'specyfikacja-techniczna.pdf')
            ->withMime('application/pdf');

        // 4+. Drawing files and basic description from elevator
        foreach ($this->extraAttachments as $att) {
            if (isset($att['path']) && Storage::exists($att['path'])) {
                $list[] = Attachment::fromPath(Storage::path($att['path']))
                    ->as($att['name'])
                    ->withMime($att['mime']);
            }
        }

        return $list;
    }
}
```

- [ ] **Step 3: Create `wipro-laravel-backend/app/Services/QuoteMailService.php`**

```php
<?php

namespace App\Services;

use App\Mail\QuoteMailWithAttachments;
use App\Models\Offer;
use App\Models\QuoteRequest;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class QuoteMailService
{
    public function send(QuoteRequest $quoteRequest, Offer $offer): void
    {
        $quoteRequest->loadMissing(['elevator']);
        $offer->loadMissing(['items']);

        $pdfService       = new OfferPdfService();
        $aestheticService = new AestheticPdfService();

        $offerPdfPath        = $pdfService->generate($quoteRequest, $offer);
        $aestheticPdfContent = $aestheticService->generate($quoteRequest);
        $techSpecPdfContent  = $pdfService->generateTechSpec($quoteRequest);

        $extraAttachments = $this->collectElevatorFiles($quoteRequest);

        try {
            Mail::to($quoteRequest->investor_email)
                ->send(new QuoteMailWithAttachments(
                    quoteRequest:        $quoteRequest,
                    offer:               $offer,
                    offerPdfPath:        $offerPdfPath,
                    aestheticPdfContent: $aestheticPdfContent,
                    techSpecPdfContent:  $techSpecPdfContent,
                    extraAttachments:    $extraAttachments,
                    locale:              app()->getLocale(),
                ));
        } catch (\Throwable $e) {
            Log::warning('QuoteMailService: failed to send mail for offer ' . $offer->offer_number . ': ' . $e->getMessage());
        }
    }

    private function collectElevatorFiles(QuoteRequest $quoteRequest): array
    {
        $elevator = $quoteRequest->elevator;
        if (!$elevator) return [];

        $attachments = [];

        $drawingMap = [
            'drawing_standard_pdf'   => ['name' => 'rysunek-standardowy.pdf',         'mime' => 'application/pdf'],
            'drawing_throughway_pdf' => ['name' => 'rysunek-przelotowy.pdf',           'mime' => 'application/pdf'],
            'drawing_standard_dwg'   => ['name' => 'rysunek-standardowy.dwg',         'mime' => 'application/octet-stream'],
            'drawing_throughway_dwg' => ['name' => 'rysunek-przelotowy.dwg',           'mime' => 'application/octet-stream'],
            'drawing_standard_doc'   => ['name' => 'opis-podstawowy.docx',            'mime' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            'drawing_throughway_doc' => ['name' => 'opis-podstawowy-przelotowy.docx', 'mime' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        ];

        foreach ($drawingMap as $field => $meta) {
            $path = $elevator->$field ?? null;
            if ($path && Storage::exists($path)) {
                $attachments[] = array_merge(['path' => $path], $meta);
            }
        }

        return $attachments;
    }
}
```

- [ ] **Step 4: Verify**

```bash
cd /Users/wiacus/Work/wipro/wipro-laravel-backend
php artisan tinker --execute="new App\Services\QuoteMailService(); echo 'ok';"
```
Expected: `ok`.

- [ ] **Step 5: Commit**

```bash
cd /Users/wiacus/Work/wipro
git add wipro-laravel-backend/app/Mail/QuoteMailWithAttachments.php \
        wipro-laravel-backend/app/Services/QuoteMailService.php \
        wipro-laravel-backend/resources/views/emails/quote-with-attachments.blade.php
git commit -m "feat: add QuoteMailWithAttachments and QuoteMailService with 5 attachments"
```

---

## Task 7: Update AdminQuoteRequestController — generateOffer() + updateOffer()

**Files:**
- Modify: `wipro-laravel-backend/app/Http/Controllers/Api/AdminQuoteRequestController.php`

### 7a — generateOffer()

- [ ] **Step 1: Replace the generateOffer() method body**

Find the `generateOffer` method in `AdminQuoteRequestController.php`. Replace everything between the opening `{` and closing `}` of the method with:

```php
    public function generateOffer(Request $request, int $id): JsonResponse
    {
        $quoteRequest = QuoteRequest::with(['elevator.elements'])->findOrFail($id);

        abort_if(
            $quoteRequest->offers()->where('status', 'accepted')->exists(),
            422,
            __('messages.offer.no_new_accepted')
        );

        $quoteRequest->offers()->where('status', 'draft')->delete();
        $version     = $quoteRequest->offers()->count() + 1;
        $offerNumber = sprintf('%s/OF/%d', $quoteRequest->request_number, $version);

        $offer = Offer::create([
            'quote_request_id'    => $quoteRequest->id,
            'created_by_admin_id' => $request->user()->id,
            'offer_number'        => $offerNumber,
            'version'             => $version,
            'status'              => 'draft',
            'total_price_net'     => 0,
            'total_price_gross'   => 0,
            'vat_rate'            => 23.00,
            'valid_until'         => now()->addDays(30)->toDateString(),
        ]);

        $offerService = new \App\Services\OfferService();
        $totalNet     = $offerService->buildPricedItems($quoteRequest, $offer);
        $totalGross   = round($totalNet * 1.23, 2);

        $offer->update([
            'total_price_net'   => $totalNet,
            'total_price_gross' => $totalGross,
        ]);

        $quoteRequest->update(['status' => 'in_progress']);

        return response()->json($offer->load('items'));
    }
```

### 7b — updateOffer()

- [ ] **Step 2: Replace OfferSentMail with QuoteMailService in updateOffer()**

In `updateOffer()`, find the block that currently runs when `$data['status'] === 'sent'`:

```php
            $quoteRequest = $offer->quoteRequest()->with('user')->first();
            if ($quoteRequest?->user) {
                Mail::to($quoteRequest->user->email)
                    ->send(new OfferSentMail($quoteRequest->user, $offer->load('items'), app()->getLocale()));
            }
```

Replace it with:

```php
            $quoteRequest = $offer->quoteRequest()->first();
            if ($quoteRequest) {
                (new \App\Services\QuoteMailService())->send($quoteRequest, $offer->load('items'));
            }
```

- [ ] **Step 3: Remove now-unused OfferSentMail import if it is no longer used elsewhere**

Check if `OfferSentMail` is used elsewhere in the file. If the only usage was in the block above, remove the import line:
```php
use App\Mail\OfferSentMail;
```

- [ ] **Step 4: Verify routes and syntax**

```bash
cd /Users/wiacus/Work/wipro/wipro-laravel-backend
php artisan route:list | grep generate-offer
php -l app/Http/Controllers/Api/AdminQuoteRequestController.php
```
Expected: route listed, `No syntax errors detected`.

- [ ] **Step 5: Commit**

```bash
cd /Users/wiacus/Work/wipro
git add wipro-laravel-backend/app/Http/Controllers/Api/AdminQuoteRequestController.php
git commit -m "feat: generateOffer uses OfferService.buildPricedItems; updateOffer uses QuoteMailService"
```

---

## Task 8: Update QuoteRequestController::store() — auto offer v1 + mail

**Files:**
- Modify: `wipro-laravel-backend/app/Http/Controllers/Api/QuoteRequestController.php`

- [ ] **Step 1: Add new imports at the top of the file**

After the existing `use` statements add:

```php
use App\Models\Offer;
use App\Models\OfferItem;
use App\Services\OfferService;
use App\Services\QuoteMailService;
```

- [ ] **Step 2: Replace the try/catch mail block at the end of store()**

Find the current mail block:

```php
        try {
            Mail::to($user->email)->send(new QuoteSubmittedMail($user, $quoteRequest, app()->getLocale()));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to send email: ' . $e->getMessage());
        }
```

Replace it with:

```php
        // Auto-generate offer v1 and send with 5 attachments
        try {
            $version     = 1;
            $offerNumber = sprintf('%s/OF/%d', $quoteRequest->request_number, $version);

            $offer = Offer::create([
                'quote_request_id'    => $quoteRequest->id,
                'created_by_admin_id' => null,
                'offer_number'        => $offerNumber,
                'version'             => $version,
                'status'              => 'sent',
                'sent_at'             => now(),
                'total_price_net'     => 0,
                'total_price_gross'   => 0,
                'vat_rate'            => 23.00,
                'valid_until'         => now()->addDays(30)->toDateString(),
            ]);

            $offerService = new OfferService();
            $totalNet     = $offerService->buildPricedItems($quoteRequest, $offer);
            $totalGross   = round($totalNet * 1.23, 2);
            $offer->update(['total_price_net' => $totalNet, 'total_price_gross' => $totalGross]);

            $quoteRequest->update(['status' => 'offer_sent']);

            (new QuoteMailService())->send($quoteRequest, $offer->load('items'));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to generate/send auto-offer: ' . $e->getMessage());
        }
```

- [ ] **Step 3: Remove now-unused imports**

Remove these use statements if nothing else in the file references them:

```php
use App\Mail\QuoteSubmittedMail;
use Illuminate\Support\Facades\Mail;
```

- [ ] **Step 4: Verify syntax**

```bash
cd /Users/wiacus/Work/wipro/wipro-laravel-backend
php -l app/Http/Controllers/Api/QuoteRequestController.php
```
Expected: `No syntax errors detected`.

- [ ] **Step 5: Smoke test via tinker**

```bash
cd /Users/wiacus/Work/wipro/wipro-laravel-backend
php artisan tinker --execute="
\$qr = App\Models\QuoteRequest::latest()->first();
echo \$qr ? 'QR id='.\$qr->id : 'no QRs yet';
"
```

- [ ] **Step 6: Commit**

```bash
cd /Users/wiacus/Work/wipro
git add wipro-laravel-backend/app/Http/Controllers/Api/QuoteRequestController.php
git commit -m "feat: auto-generate offer v1 with 5-attachment email on configurator submission"
```

---

## Task 9: Frontend — GeneralTab company info + pricing

**Files:**
- Modify: `wipro-react-frontend/src/admin/app/protected/database/index.tsx`
- Modify: `wipro-react-frontend/src/admin/i18n/pl.ts`
- Modify: `wipro-react-frontend/src/admin/i18n/en.ts`

- [ ] **Step 1: Add translation keys to `src/admin/i18n/pl.ts`**

In the `settings:` object, after the line `saved: 'Zapisano',`, add:

```ts
    // Company info
    companyInfo: 'Dane firmy',
    companyName: 'Nazwa firmy',
    companyAddress: 'Adres siedziby',
    companyNip: 'NIP',
    companyRegon: 'REGON',
    companyKrs: 'KRS',
    companyLogo: 'Logo firmy',
    uploadLogo: 'Wgraj logo',
    changeLogo: 'Zmień logo',
    // Pricing
    pricingTitle: 'Cennik i marża',
    ei30Price: 'Cena drzwi EI30 (PLN netto / szt.)',
    ei60Price: 'Cena drzwi EI60 (PLN netto / szt.)',
    profitMargin: 'Marża zysku (%)',
    savePricing: 'Zapisz cennik',
    saveCompany: 'Zapisz dane firmy',
```

- [ ] **Step 2: Add translation keys to `src/admin/i18n/en.ts`**

In the `settings:` object, after `saved: 'Saved',`, add:

```ts
    // Company info
    companyInfo: 'Company data',
    companyName: 'Company name',
    companyAddress: 'Registered address',
    companyNip: 'Tax ID (NIP)',
    companyRegon: 'REGON',
    companyKrs: 'KRS',
    companyLogo: 'Company logo',
    uploadLogo: 'Upload logo',
    changeLogo: 'Change logo',
    // Pricing
    pricingTitle: 'Pricing & margin',
    ei30Price: 'EI30 door price (PLN net / unit)',
    ei60Price: 'EI60 door price (PLN net / unit)',
    profitMargin: 'Profit margin (%)',
    savePricing: 'Save pricing',
    saveCompany: 'Save company data',
```

- [ ] **Step 3: Replace GeneralTab component in `database/index.tsx`**

Find the full `const GeneralTab = () => { ... }` component (lines 629–668 approximately) and replace it with:

```tsx
// ─── General settings tab ─────────────────────────────────────────────────────
const apiBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api').replace(/\/$/, '')

const GeneralTab = () => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)

  // max_stops
  const [maxStops, setMaxStops] = useState(16)
  const [savingStops, setSavingStops] = useState(false)
  const [savedStops, setSavedStops] = useState(false)

  // company
  const [companyName, setCompanyName] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [companyNip, setCompanyNip] = useState('')
  const [companyRegon, setCompanyRegon] = useState('')
  const [companyKrs, setCompanyKrs] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [savingCompany, setSavingCompany] = useState(false)
  const [savedCompany, setSavedCompany] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // pricing
  const [ei30Price, setEi30Price] = useState('')
  const [ei60Price, setEi60Price] = useState('')
  const [profitMargin, setProfitMargin] = useState('')
  const [savingPricing, setSavingPricing] = useState(false)
  const [savedPricing, setSavedPricing] = useState(false)

  useEffect(() => {
    api.get('/admin/settings').then(r => {
      const d = r.data
      setMaxStops(parseInt(d.max_stops ?? '16'))
      setCompanyName(d.company_name ?? '')
      setCompanyAddress(d.company_address ?? '')
      setCompanyNip(d.company_nip ?? '')
      setCompanyRegon(d.company_regon ?? '')
      setCompanyKrs(d.company_krs ?? '')
      setEi30Price(d.door_ei30_price ?? '')
      setEi60Price(d.door_ei60_price ?? '')
      setProfitMargin(d.profit_margin_percent ?? '')
      if (d.company_logo_path) {
        // derive public URL: storage path starts with "public/"
        const rel = (d.company_logo_path as string).replace(/^public\//, '')
        setLogoUrl(`${apiBase.replace('/api', '')}/storage/${rel}`)
      }
    }).finally(() => setLoading(false))
  }, [])

  const saveStops = async () => {
    setSavingStops(true); setSavedStops(false)
    try {
      await api.patch('/admin/settings', { max_stops: maxStops })
      setSavedStops(true); setTimeout(() => setSavedStops(false), 2000)
    } finally { setSavingStops(false) }
  }

  const saveCompany = async () => {
    setSavingCompany(true); setSavedCompany(false)
    try {
      await api.patch('/admin/settings', {
        company_name: companyName,
        company_address: companyAddress,
        company_nip: companyNip,
        company_regon: companyRegon,
        company_krs: companyKrs,
      })
      setSavedCompany(true); setTimeout(() => setSavedCompany(false), 2000)
    } finally { setSavingCompany(false) }
  }

  const savePricing = async () => {
    setSavingPricing(true); setSavedPricing(false)
    try {
      await api.patch('/admin/settings', {
        door_ei30_price: parseFloat(ei30Price) || 0,
        door_ei60_price: parseFloat(ei60Price) || 0,
        profit_margin_percent: parseFloat(profitMargin) || 0,
      })
      setSavedPricing(true); setTimeout(() => setSavedPricing(false), 2000)
    } finally { setSavingPricing(false) }
  }

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const token = authStore.getState().token
      const fd = new FormData()
      fd.append('logo', file)
      const res = await fetch(`${apiBase}/admin/settings/logo`, {
        method: 'POST',
        headers: { Authorization: token ? `Bearer ${token}` : '', Accept: 'application/json' },
        body: fd,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setLogoUrl(data.logo_url)
      e.target.value = ''
    } catch { /* silent */ } finally { setUploadingLogo(false) }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300'

  if (loading) return <Card className="p-6"><SkeletonLoader count={3} /></Card>

  return (
    <div className="flex flex-col gap-4">

      {/* Max stops */}
      <Card className="p-6 gap-4">
        <h2 className="font-semibold text-gray-900">{t('settings.generalSettings')}</h2>
        <div className="flex items-end gap-4">
          <div className="flex-1 max-w-xs">
            <label className="text-xs text-gray-500 mb-1 block">{t('settings.maxStops')}</label>
            <input type="number" min={2} max={50} value={maxStops}
              onChange={e => setMaxStops(parseInt(e.target.value) || 16)} className={inputCls} />
            <p className="text-xs text-gray-400 mt-1">{t('settings.maxStopsHint')}</p>
          </div>
          <Button onClick={saveStops} disabled={savingStops} className="mb-6">
            {savingStops ? t('common.saving') : savedStops ? t('settings.saved') : t('settings.saveSettings')}
          </Button>
        </div>
      </Card>

      {/* Company info */}
      <Card className="p-6 gap-4">
        <h2 className="font-semibold text-gray-900">{t('settings.companyInfo')}</h2>

        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="w-24 h-16 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
            {logoUrl
              ? <img src={logoUrl} alt="logo" className="w-full h-full object-contain p-1" />
              : <span className="text-xs text-gray-400">{t('settings.companyLogo')}</span>
            }
          </div>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
            <span className="text-sm text-amber-600 hover:text-amber-700 font-medium">
              {uploadingLogo ? t('common.saving') + '...' : logoUrl ? t('settings.changeLogo') : t('settings.uploadLogo')}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">{t('settings.companyName')}</label>
            <input value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">{t('settings.companyAddress')}</label>
            <input value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('settings.companyNip')}</label>
            <input value={companyNip} onChange={e => setCompanyNip(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('settings.companyRegon')}</label>
            <input value={companyRegon} onChange={e => setCompanyRegon(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('settings.companyKrs')}</label>
            <input value={companyKrs} onChange={e => setCompanyKrs(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={saveCompany} disabled={savingCompany}>
            {savingCompany ? t('common.saving') : savedCompany ? t('settings.saved') : t('settings.saveCompany')}
          </Button>
        </div>
      </Card>

      {/* Pricing */}
      <Card className="p-6 gap-4">
        <h2 className="font-semibold text-gray-900">{t('settings.pricingTitle')}</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('settings.ei30Price')}</label>
            <input type="number" min={0} step={0.01} value={ei30Price}
              onChange={e => setEi30Price(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('settings.ei60Price')}</label>
            <input type="number" min={0} step={0.01} value={ei60Price}
              onChange={e => setEi60Price(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('settings.profitMargin')}</label>
            <input type="number" min={0} max={100} step={0.1} value={profitMargin}
              onChange={e => setProfitMargin(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={savePricing} disabled={savingPricing}>
            {savingPricing ? t('common.saving') : savedPricing ? t('settings.saved') : t('settings.savePricing')}
          </Button>
        </div>
      </Card>

    </div>
  )
}
```

Note: This replacement adds `import { authStore } from '@admin/store/zustand/authStore'` if not already present at the top of the file. Check the existing imports — `authStore` is already imported in this file (used by ImagePicker).

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/wiacus/Work/wipro/wipro-react-frontend
npm run build 2>&1 | tail -20
```
Expected: `built in X.XXs` with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/wiacus/Work/wipro
git add wipro-react-frontend/src/admin/app/protected/database/index.tsx \
        wipro-react-frontend/src/admin/i18n/pl.ts \
        wipro-react-frontend/src/admin/i18n/en.ts
git commit -m "feat: add company info and pricing sections to GeneralTab in database page"
```

---

## Self-review checklist (run before calling done)

- [ ] `php artisan route:list | grep settings/logo` — POST route exists
- [ ] Settings controller validates all 9 new keys without error
- [ ] `OfferService::parseConfiguratorNotes()` returns array from JSON embedded in notes
- [ ] `OfferService::buildPricedItems()` creates items with margin applied (verify via tinker: create a test QR with elevator, call buildPricedItems, check OfferItem prices)
- [ ] Submit configurator → Offer v1 is created in DB with status='sent'
- [ ] Admin generates offer → offers no longer have inlined pricing logic; EI30/EI60 items appear when settings are set and counts > 0
- [ ] Admin sends offer → QuoteMailService is called (check logs if mail server not configured)
- [ ] Frontend: Baza danych → Ogólne shows company info form, pricing form, logo upload
- [ ] Logo upload → file is stored in storage, `company_logo_path` setting updated

---

## Notes

- **DomPDF and external images**: `urlImageToBase64()` uses `@file_get_contents()` which may fail if the image host doesn't allow server-side fetching. In development with localhost storage URLs this will work. For production, ensure storage images are accessible from the server or use `Storage::get()` directly.
- **Mail configuration**: Set `MAIL_MAILER=smtp` + SMTP credentials in `.env` for actual email delivery. For local testing use `MAIL_MAILER=log` — emails appear in `storage/logs/laravel.log`.
- **Storage symlink**: For the logo URL to work in the browser, ensure `php artisan storage:link` has been run on the server so `public/storage` → `storage/app/public`.
