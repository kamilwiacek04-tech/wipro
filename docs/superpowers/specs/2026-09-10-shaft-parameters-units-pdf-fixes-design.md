# Poprawki klienta: krok 2 konfiguratora, jednostki cm, dopasowanie wind, specyfikacja PDF/DOCX

Data: 2026-09-10

## Kontekst

Klient zgłosił 6 poprawek dotyczących konfiguratora wind i generowanych dokumentów. Punkt 5 (nowe pole "Długość szybu") został odłożony na później na prośbę użytkownika — poza zakresem tego dokumentu. Poniżej punkty 1, 2, 3, 4, 6.

Ustalenia zweryfikowane bezpośrednio w kodzie i w danych (ddev + tinker, `SELECT` na `elevators` i `quote_requests`):

- `elevators.shaft_width/shaft_depth/pit_depth/overhead/cabin_width/cabin_depth/cabin_height/door_width/door_height` — kolumny `integer`, realnie przechowywane **w milimetrach** (jedyny rekord: `shaft_width=1250, shaft_depth=1350, pit_depth=1100, overhead=3400, cabin_width=780` — wartości sensowne tylko jako mm; `overhead=3400`mm=3,4m pasuje do realnego nadszybia). Panel admina (`admin/i18n/pl.ts`, `admin/app/protected/database/index.tsx`) konsekwentnie podpisuje je `[mm]`.
- `quote_requests.pit_depth/overhead` — te same nazwy kolumn, ale realnie **w centymetrach** (rekordy: `pit_depth=200, overhead=300` — sensowne tylko jako cm; frontend (`FinishesAndAccessories.tsx:110-111`) wysyła surowe `parseInt` z pól konfiguratora podpisanych `[cm]`, bez żadnej konwersji). Panel admina (`quoteRequests/detail.tsx:870-873`, `unit="mm"`) i wszystkie 3 generatory PDF/DOCX błędnie podpisują je jako mm/`[m]`.
- `quote_requests.shaft_width/shaft_depth` — zawsze `NULL`. Konfigurator zbiera `shaftLen`/`shaftDep` (etykiety PL: "Szerokość szybu" / "Głębokość szybu", dziś `[m]`) tylko do lokalnego wyszukiwania `/elevFinder` i nigdy nie wysyła ich do `POST /quote-requests`.
- `ElevFinderController::findByShaft` mnoży wpisane przez klienta metry przez 1000 i porównuje z `shaft_width/shaft_depth` (mm) — to jest dziś poprawne dla obecnych (metrowych) pól, ale wymaga zmiany razem z przejściem configuratora na cm.
- W specyfikacji PDF/DOCX (3 niezależne, prawie identyczne implementacje: `tech-spec-pdf.blade.php`, `offer-pdf.blade.php`, `OfferService::generateDocx()`) sekcja "Przeznaczenie" czyta pole `status` (rola zgłaszającego: inwestor/architekt/wykonawca/kosztorysant — `formData.status`, `constants/formData.ts`) przez zmyślony/pomylony słownik `$statusMap` (klucze `PASSENGER/ARCHITECT/CONTRACTOR/RESIDENTIAL/HOSPITAL/FREIGHT` — częściowa, błędna hybryda dwóch różnych enumów), stąd np. "Budowlany". Sekcja "Zespół napędowy → Typ" czyta `$qr->drive_type`, które w rzeczywistości przechowuje `liftPurpose` konfiguratora (`PASSENGER/FREIGHT_PASSENGER/HOSPITAL/FIRE` — `FinishesAndAccessories.tsx:112` ustawia `drive_type: shaftParameters.liftPurpose`), przepuszczone przez `$purposeLabels` — czyli pokazuje rodzaj windy (np. "Osobowy"), a nie faktyczny napęd.

## A. Krok 2 — walidacje (pkt 1, 2)

Plik: `wipro-react-frontend/src/configurator/validators/shaftParameters.ts`

1. **Liczba dojść ≥ liczba przystanków**: w `.when('stopDoorsCount', ...)` dla `accessCount` dodać `.min(stopDoorsCount, () => 'form.errors.minNumber|' + stopDoorsCount)` obok istniejącego `.max(stopDoorsCount * 2, ...)`.
2. **Nadszybie i podszybie — min. 270 cm**: zamienić `.min(1, ...)` na `.min(270, ...)` dla `pitDepth` i `headroom` (wartości będą w cm po zmianach z sekcji B).
3. **Ostrzeżenie 270–340 cm (niebllokujące)**: yup nie ma pojęcia "warning", więc w `ShaftParameters.tsx` dodać lokalny `useMemo`/warunek: jeśli wartość pola (po parsowaniu) mieści się w `[270, 340]`, wyświetlić pod polem żółty komunikat (wzorem istniejącego bloku `throughCabinNote`), niezależny od stanu błędu z yup i nieblokujący submit.

## B. Jednostki — ujednolicenie na cm (pkt 3)

**Zakres**: wymiary szybu (szerokość/głębokość), podszybie, nadszybie, kabina, drzwi — we wszystkich miejscach, gdzie są dziś wyświetlane lub wprowadzane: konfigurator, panel admina, PDF/DOCX. **Wysokość podnoszenia (`liftingHeight`) zostaje w metrach** — decyzja użytkownika, to osobna, addytywna wielkość, nie "wymiar szybu" w tym samym sensie.

**Zasada** (bez migracji, bez zmiany zapisanych wartości w SQL — zmienia się wyłącznie warstwa wyświetlania/wejścia):

- Kolumny w tabeli `elevators` (`shaft_width/shaft_depth/pit_depth/overhead/cabin_*/door_*`) fizycznie pozostają w mm. Każdy odczyt do wyświetlenia dzieli przez 10 (zaokrąglenie do liczby całkowitej cm). Każdy zapis z formularza admina (który od teraz przyjmuje i pokazuje cm) mnoży przez 10 przed zapisaniem do kolumny.
- Kolumny w tabeli `quote_requests` (`pit_depth/overhead`, docelowo też `shaft_width/shaft_depth` — patrz niżej) pozostają w cm, tak jak dziś — zero konwersji.
- Tam gdzie kod dziś łączy obie wartości przez `??` (np. `$qr->pit_depth ?? $el?->pit_depth`), trzeba to zastąpić helperem świadomym jednostek, np. `cmValue($qrRawCm, $elRawMm) => $qrRawCm ?? ($elRawMm !== null ? (int) round($elRawMm / 10) : null)` — inaczej wartość z `elevators` zostanie pokazana 10× za duża.

**Zmiany konkretne**:

- `configurator/components/multiStepWizard/ShaftParameters.tsx` + `validators/shaftParameters.ts`: etykiety `shaftLen`/`shaftDep` z `[m]` na `[cm]`; walidacja `.positive()` → `.min(100, ...)`.
- `ElevFinderController::findByShaft`: `$lenMm = $lenM * 1000` → `$lenCm * 10` (wejście z frontu będzie teraz w cm), porównanie z `shaft_width/shaft_depth` bez zmian (nadal mm w bazie).
- Naprawić gap: `FinishesAndAccessories.tsx` (`onSubmit`/`sendData`) ma zacząć wysyłać `shaft_width`/`shaft_depth` (z `shaftTempParameters.shaftLen`/`shaftDep`, w cm) do `POST /quote-requests` — dziś się gubią, `quote_requests.shaft_width/shaft_depth` jest zawsze `NULL`. Wymaga dodania tych pól do `QuoteRequestController::store` validate() body (są już akceptowane, patrz `store()` w kontrolerze — trzeba tylko upewnić się że nazwy się zgadzają) i do `StoreQuoteRequestBody` w `store/mainApi/response.ts`.
- Panel admina: `admin/i18n/pl.ts`, `database/index.tsx` (elevators), `quoteRequests/detail.tsx` — etykiety `[mm]`/`unit="mm"` → `[cm]`; formularz edycji/tworzenia windy w `database/index.tsx` konwertuje cm→mm przy zapisie (`num(form.shaft_width) * 10` itd.) i mm→cm przy wczytywaniu do formularza edycji.

## C. Dopasowanie wind po wymiarach szybu (pkt 4)

Plik: `ElevFinderController::findByShaft`. Usunąć blok "Fallback: closest by shaft dimensions regardless of fit" (linie 81-87 w obecnym kodzie) — mają być zwracane wyłącznie windy spełniające warunek `shaft_width <= podane*1.05 AND shaft_depth <= podane*1.05` (tolerancja montażowa 5% zostaje). Brak dopasowania → istniejący komunikat `status=1, info: 'Brak wind w bazie danych.'` (bez zmiany treści, chyba że po review okaże się to mylące).

Wyszukiwanie po udźwigu (`findByCapacity`) — bez zmian, klient potwierdził że działa dobrze.

## D. Specyfikacja PDF/DOCX (pkt 6)

Wydzielić wspólną funkcję budującą dane specyfikacji (np. nowa metoda `OfferService::buildSpecViewData(QuoteRequest $qr): array` albo osobna mała klasa), używaną przez wszystkie trzy generatory: `tech-spec-pdf.blade.php`, `offer-pdf.blade.php`, `OfferService::generateDocx()`. Zwraca m.in.:

- `purposeLabel` — z `$qr->drive_type` (realnie `liftPurpose`) przez `purposeLabels` (`PASSENGER→Osobowy, FREIGHT_PASSENGER→Pasażersko-towarowy, HOSPITAL→Szpitalny, FIRE→Pożarowy`) — używane w sekcji **"Przeznaczenie"** (zamiast dzisiejszego błędnego `$statusMap` na polu `status`).
- `driveTypeLabel` — wprost `$el?->drive_type` (bez żadnego mapowania) — używane w sekcji **"Zespół napędowy → Typ"** (zamiast dzisiejszego `$purposeLabels[$qr->drive_type]`).
- Znormalizowane do cm wymiary (`shaftW/shaftD/pitD/oh/cabW/cabD/cabH/doorW/doorH`) przez helper `cmValue()` z sekcji B, z poprawnymi etykietami `[cm]` (zamiast dzisiejszych błędnych `[m]`/`mm`).
- Pozostałe mapowania (`accessDiagramLabels` itp.) bez zmian znaczeniowych — tylko przeniesione do wspólnego miejsca, żeby uniknąć dryfu między trzema generatorami w przyszłości.

`pdf.blade.php` / `OfferService::generatePdf()` — potwierdzone jako nieużywane nigdzie w kodzie (martwy kod, `generatePdf()` nie jest wołane). Pozostaje bez zmian, poza zakresem.

## Poza zakresem

- Punkt 5 (nowe pole "Długość szybu") — odłożony przez użytkownika.
- Jakakolwiek migracja/zmiana istniejących wartości liczbowych w bazie danych — wyłącznie logika odczytu/zapisu i etykiety.
- `AestheticPdfService` / `aesthetic-pdf.blade.php` — nie zawiera wymiarów szybu/napędu, bez zmian.
