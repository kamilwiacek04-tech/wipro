# Design: Cennik EI30/EI60, Mail z załącznikami, Historia ofert

Data: 2026-05-12  
Projekt: Wipro — system zarządzania zapytaniami ofertowymi dla dźwigów

---

## Zakres

Trzy powiązane funkcjonalności:

1. **Ustawienia globalne** — ceny drzwi EI30/EI60, marża zysku, dane firmy WIPRO
2. **Mail z 5 załącznikami** — wysyłany automatycznie po złożeniu konfiguratora ORAZ manualnie gdy admin wyśle ofertę
3. **Historia ofert** — każda wygenerowana i wysłana oferta jest przechowywana jako osobna wersja

---

## Architektura

### Podejście: osobne serwisy per odpowiedzialność (Opcja B)

- `OfferPdfService` — generuje ofertę PDF (2 strony)
- `AestheticPdfService` — generuje PDF z wykończeniami
- `QuoteMailService` — orkiestruje zbieranie plików i wysyłkę maila
- `SettingController` — rozszerzony o nowe klucze i endpoint uploadu logo

---

## 1. Baza danych

### Brak nowych migracji

Wszystkie potrzebne dane z konfiguratora są już przechowywane:
- `additional_notes` w `quote_requests` — zawiera JSON z: `ei30DoorsCount`, `ei60DoorsCount`, `cabinModelId`, `panelId`, `signalId`, `ceilingId`, `mirrorId`, `handrailId`, `flooringId`, `extraIds[]` (pola pomijane gdy null)
- `elevator_id` — FK do wybranej windy (rysunki, DOCX)
- `raw_data` — pełny dump danych z konfiguratora

### Nowe klucze w tabeli `settings` (key/value, zero migracji)

| Klucz | Opis | Typ |
|---|---|---|
| `door_ei30_price` | Cena jednych drzwi EI30 (PLN netto) | decimal string |
| `door_ei60_price` | Cena jednych drzwi EI60 (PLN netto) | decimal string |
| `profit_margin_percent` | Marża zysku w % | decimal string |
| `company_name` | Nazwa firmy WIPRO | string |
| `company_address` | Adres siedziby | string |
| `company_nip` | NIP | string |
| `company_regon` | REGON | string |
| `company_krs` | KRS | string |
| `company_logo_path` | Ścieżka do wgranego logo | string (storage path) |

### Historia ofert

Tabela `offers` już ma `version`, `pdf_path`, `sent_at`, `status`. Historia = wszystkie rekordy `Offer` powiązane z `QuoteRequest`, zachowywane na stałe. Każda wersja ma własny PDF zapisany w `pdf_path`.

Reguły wersjonowania:
- v1 powstaje automatycznie gdy klient wysyła konfigurator (status: `sent`)
- Kolejne wersje: admin generuje z panelu (`draft`), potem wysyła (`sent`)
- Anulowane/odrzucone wersje też zostają w historii

---

## 2. Serwisy backend

### `OfferPdfService`

Generuje ofertę PDF (DomPDF, A4). Przyjmuje `QuoteRequest` + sparsowany JSON z `additional_notes`.

**Strona 1:**
- Logo firmy (z `company_logo_path`) + dane firmy: nazwa, adres, NIP, REGON, KRS
- Dane klienta: imię, firma, NIP, email, telefon, adres
- Dane inwestycji: nazwa, adres
- Tabela cenowa:
  - Cena bazowa windy: `elevator.base_price × (1 + margin/100)`
  - Drzwi EI30: `ei30DoorsCount × door_ei30_price × (1 + margin/100)` — tylko gdy count > 0
  - Drzwi EI60: `ei60DoorsCount × door_ei60_price × (1 + margin/100)` — tylko gdy count > 0
  - Suma netto, VAT 23%, suma brutto
- Pasek graficzny na dole: statyczny asset `public/images/PL-Pasek_FE-RGB-poziom.png`

**Strona 2:**
- Pełna specyfikacja techniczna (wszystkie pola QuoteRequest + dane z JSON: liftingHeight, accessCount, leftSideMechanic, typ drzwi EI)
- Zdjęcie wybranej kabiny (`CabinModel.image_url` dla `cabinModelId`)

Zapisuje PDF do `storage/app/offers/{offer_number}.pdf`, aktualizuje `offer.pdf_path`.

### `AestheticPdfService`

Generuje PDF z fotografiami wybranych wykończeń (DomPDF, A4).

1. Parsuje JSON z `additional_notes`
2. Zbiera ID: `panelId`, `signalId`, `ceilingId`, `mirrorId`, `handrailId`, `flooringId` + `extraIds[]`
3. Pobiera z bazy `CabinAccessory` dla każdego ID
4. Pobiera `CabinModel` dla `cabinModelId` — zdjęcie kabiny na początku PDF jako okładka/wyróżnienie
5. Układa zdjęcia akcesoriów w siatce (2 kolumny) — zdjęcie + nazwa akcesorium
6. Zwraca zawartość PDF jako string (nie zapisuje — dołączany tylko do maila)

### `QuoteMailService`

Orkiestruje wysyłkę maila. Używany w dwóch miejscach.

```
QuoteMailService::send(QuoteRequest $qr, Offer $offer):
  1. OfferPdfService::generate($qr, $offer) → pdf_path
  2. AestheticPdfService::generate($qr) → pdf content
  3. Zbiera pliki z elevator:
     - drawing_standard_pdf, drawing_throughway_pdf (jeśli istnieją)
     - drawing_standard_dwg, drawing_throughway_dwg (jeśli istnieją)
     - drawing_standard_doc (jeśli istnieje)
  4. Mail::to($qr->investor_email)->send(new QuoteMailWithAttachments(...))
```

Mail zawiera wszystkie dostępne pliki jako załączniki. Jeśli elevator nie jest przypisany lub nie ma plików — dołącza tylko ofertę i opis estetyczny.

### `SettingController` — rozszerzenie

Nowe klucze w walidacji `update()`:
```php
'door_ei30_price'       => 'sometimes|numeric|min:0',
'door_ei60_price'       => 'sometimes|numeric|min:0',
'profit_margin_percent' => 'sometimes|numeric|min:0|max:100',
'company_name'          => 'sometimes|string|max:255',
'company_address'       => 'sometimes|string|max:500',
'company_nip'           => 'sometimes|string|max:20',
'company_regon'         => 'sometimes|string|max:20',
'company_krs'           => 'sometimes|string|max:20',
```

Nowy endpoint: `POST /admin/settings/logo` — upload pliku logo, zapis do `storage/app/public/company/logo.*`, aktualizacja klucza `company_logo_path`.

### `AdminQuoteRequestController::generateOffer()` — rozszerzenie

Obecna logika generowania pozycji oferty zostaje. Dodajemy:
- Odczyt `door_ei30_price`, `door_ei60_price`, `profit_margin_percent` z Settings
- Parsowanie JSON z `additional_notes` → `ei30DoorsCount`, `ei60DoorsCount`
- Aplikowanie marży do każdej ceny netto
- Dodanie pozycji drzwi EI30/EI60 do `offer_items` (gdy count > 0)

### `QuoteRequestController::store()` — rozszerzenie

Po zapisaniu `QuoteRequest`:
1. Tworzy `Offer` (version: 1, status: `sent`, sent_at: now)
2. Generuje pozycje oferty (jak w `generateOffer`)
3. Wywołuje `QuoteMailService::send($quoteRequest, $offer)`
4. QuoteRequest status → `offer_sent`

---

## 3. Frontend — panel admina

### Baza danych → Ogólne — dwie nowe sekcje w istniejącej karcie

**Dane firmy WIPRO:**
- Upload logo (podgląd miniaturki + przycisk "Zmień logo" → `POST /admin/settings/logo`)
- Pola: Nazwa firmy, Adres, NIP, REGON, KRS (inline-edit lub formularz z przyciskiem Zapisz)

**Cennik i marża:**
- Cena drzwi EI30 [PLN/szt.]
- Cena drzwi EI60 [PLN/szt.]
- Marża zysku [%]
- Przycisk "Zapisz" → `PATCH /admin/settings`

### Szczegóły zapytania — sekcja "Historia ofert"

Pod aktualną sekcją oferty pojawia się lista wszystkich wersji:

```
v1  01.05.2026  Wysłana automatycznie    [↓ PDF]
v2  10.05.2026  Wysłana przez: Jan K.   [↓ PDF]
v3  12.05.2026  Szkic (bieżąca)         [edycja + Wyślij]
```

- Wersje starsze niż bieżąca: tylko podgląd statusu + pobranie PDF
- Bieżąca (najnowsza) wersja: zachowuje dotychczasowy widok edycji

### Brak zmian w konfiguratorze

Konfigurator już zbiera i wysyła wszystkie potrzebne dane. Żadnych zmian.

---

## 4. Przepływ danych end-to-end

```
Klient wypełnia konfigurator
  → POST /api/quote-requests
  → QuoteRequest zapisany (dane + JSON w additional_notes)
  → Offer v1 wygenerowany (status: sent)
  → QuoteMailService::send() → mail z 5 plikami do klienta

Admin widzi zapytanie w panelu → edytuje dane
  → PATCH /api/admin/quote-requests/{id}

Admin generuje nową ofertę
  → POST /api/admin/quote-requests/{id}/generate-offer
  → Offer v2 (status: draft)

Admin wysyła ofertę
  → PATCH /api/admin/offers/{id} { status: 'sent' }
  → QuoteMailService::send() → mail z 5 plikami do klienta
  → Offer v2 (status: sent, sent_at: now)
  → Offer v1 zostaje w historii z własnym pdf_path
```

---

## 5. Obsługa błędów

- Jeśli elevator nie jest przypisany do QuoteRequest: oferta PDF generowana bez danych windy (pozycja "wycena indywidualna"), opis estetyczny i tak generowany z akcesoriów, rysunki i DOCX pomijane
- Jeśli `company_logo_path` nie ustawiony: PDF generowany bez logo (miejsce zostaje puste)
- Jeśli akcesorium z `additional_notes` nie istnieje w bazie: pomijane bez błędu
- Błąd wysyłki maila: logowany, QuoteRequest i Offer zachowane (tak jak teraz)

---

## Pliki do zmiany / utworzenia

### Nowe pliki
- `app/Services/OfferPdfService.php`
- `app/Services/AestheticPdfService.php`
- `app/Services/QuoteMailService.php`
- `app/Mail/QuoteMailWithAttachments.php`
- `resources/views/emails/quote-with-attachments.blade.php`
- `resources/views/offers/offer-pdf.blade.php` (nowy template z logo i 2 stronami)
- `resources/views/offers/aesthetic-pdf.blade.php`
- `public/images/PL-Pasek_FE-RGB-poziom.png` (skopiowany asset)

### Zmienione pliki (backend)
- `app/Http/Controllers/Api/SettingController.php`
- `app/Http/Controllers/Api/QuoteRequestController.php`
- `app/Http/Controllers/Api/AdminQuoteRequestController.php`
- `app/Services/OfferService.php` (opcjonalne — może zostać jako thin wrapper)
- `routes/api.php` (nowy endpoint logo)

### Zmienione pliki (frontend)
- `src/admin/app/protected/database/index.tsx` (nowe sekcje w Ogólne)
- `src/admin/app/protected/quoteRequests/detail.tsx` (sekcja historia ofert)
