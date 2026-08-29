# Design: Poziomy scroll kolorów, domyślne opcje kroku 3, regulamin, zmiana hasła admina

Data: 2026-08-29
Projekt: Wipro — system zarządzania zapytaniami ofertowymi dla dźwigów

---

## Zakres

Cztery niezależne funkcjonalności:

1. **Poziomy scroll dla sekcji kolorów** w kroku 3 konfiguratora (dorównanie do reszty sekcji)
2. **Flaga "domyślny/standard"** dla każdej opcji (kabina, kolor kabiny, kolor drzwi, panel, sygnalizator, sufit, lustra, poręcze, wykładzina, extra) + automatyczne zaznaczanie domyślnej wartości przy wejściu w krok 3
3. **Regulamin** — pełna treść prawna na `/regulamin` (obecnie placeholder)
4. **Samodzielna zmiana hasła** przez zalogowanego admina w panelu

---

## 1. Poziomy scroll dla sekcji kolorów

### Stan obecny
Sekcje panel/sygnalizator/sufit/lustra/poręcze/wykładzina (`AccessorySelector.tsx`) oraz model kabiny (`CarouselaImage.tsx`) już scrollują się poziomo przy pomocy wzorca:
```tsx
<div className="conf-scroll overflow-x-auto pb-2">
    <div className="flex flex-row gap-3 min-w-max">
```
Jedynym wyjątkiem jest `ColorSelector.tsx` (kolor kabiny, kolor drzwi), który używa `flex flex-row flex-wrap gap-3` — elementy zawijają się zamiast scrollować.

### Zmiana
Przepisać `ColorSelector.tsx`, żeby stosował ten sam wzorzec `conf-scroll overflow-x-auto` + `min-w-max`, co `AccessorySelector`/`CarouselaImage`. Czysto prezentacyjna zmiana JSX/CSS, bez zmian w typach danych ani w API.

---

## 2. Flaga "domyślny/standard" + auto-zaznaczanie w kroku 3

### Model danych

Opcje w kroku 3 pochodzą z czterech tabel globalnych (nie z `ElevatorElement`, który jest osobnym systemem cenowym per-winda):

| Tabela | Sekcja w kroku 3 | Nowa kolumna | Grupa wykluczania |
|---|---|---|---|
| `cabin_models` | Model kabiny | `is_default` (bool, default false) | wszystkie wiersze tabeli |
| `cabin_colors` | Kolor kabiny | `is_default_cabin` (bool, default false) | wiersze z `visible_for_cabin = true` |
| `cabin_colors` | Kolor drzwi | `is_default_door` (bool, default false) | wiersze z `visible_for_door = true` |
| `cabin_accessories` | Panel/Sygnalizator/Sufit/Lustra/Poręcze/Wykładzina/Extra | `is_default` (bool, default false) | wiersze z tą samą wartością `category` |

Kolor kabiny i kolor drzwi mają **niezależne** domyślności mimo współdzielenia jednej tabeli — jeden wiersz może być jednocześnie domyślny dla kabiny i nie-domyślny dla drzwi (lub odwrotnie).

Migracje: 4 proste `ALTER TABLE ... ADD COLUMN` (jedna dla `cabin_models`, jedna dla `cabin_accessories`, jedna dla `cabin_colors` z dwiema kolumnami).

### Logika wykluczania (backend)

W `CabinModelController`, `CabinAccessoryController`, `CabinColorController` — metody `store`/`update`:
- Gdy request ustawia odpowiednią flagę na `true`, w jednej transakcji DB: (a) zapisz/zaktualizuj rekord, (b) `UPDATE ... SET <flaga> = false WHERE id != ? AND <warunek grupy>`.
- Walidacja: domyślność można ustawić tylko na aktywnym elemencie (`is_active = true`) — jeśli request próbuje ustawić `is_default*=true` przy `is_active=false`, zwróć błąd walidacji.
- Ustawienie flagi na `false` nie wymaga żadnej dodatkowej logiki (może być 0 lub 1 default w grupie, nigdy nie musi być dokładnie 1).

### Panel admina

`src/admin/app/protected/database/index.tsx` — dodać przełącznik/checkbox "Domyślny" w formularzach/tabelach dla:
- modeli kabin (1 kolumna)
- kolorów (2 kolumny: "Domyślny (kabina)", "Domyślny (drzwi)")
- akcesoriów (1 kolumna, per wiersz — działa niezależnie w obrębie każdej `category`)

Po zapisaniu zmiany — odświeżyć listę (invalidacja cache RTK/refetch), żeby zobaczyć że inne wiersze w grupie się odznaczyły.

### Konfigurator — auto-select w kroku 3

Przy wejściu w krok 3 (`FinishesAndAccessories.tsx`), gdy dane z API (`useGetCabinModelsQuery`, `useGetCabinColorsQuery`, `useGetCabinAccessoriesQuery`) są załadowane:
- Dla każdej sekcji: jeśli pole w formularzu (zustand `formStore`) jest jeszcze **puste** (nikt nic nie wybrał), a w danych z API istnieje element oznaczony jako domyślny dla tej sekcji — ustaw je jako wartość pola.
- Jeśli pole ma już wartość (klient wcześniej coś wybrał, np. wraca z kroku 4) — **nie nadpisywać**.
- Jeśli żaden element w danej sekcji/grupie nie jest oznaczony jako domyślny — nic nie zaznaczaj (pole zostaje puste, tak jak dziś).
- Logika uruchamia się raz na sekcję (guard przez sprawdzenie aktualnej wartości pola przed ustawieniem), niezależnie dla: model kabiny, kolor kabiny, kolor drzwi, panel, sygnalizator, sufit, lustra, poręcze, wykładzina, extra.

---

## 3. Regulamin

### Stan obecny
`TermsPage.tsx` renderuje tylko placeholder (`t('terms.page.placeholder')`) pod ścieżką `/regulamin`, poza layoutem nawigacyjnym (pełnoekranowa podstrona). Strona ma i18n (pl/en), ale regulamin będzie **tylko po polsku** — hardcoded jako strukturalna treść JSX w komponencie (nie jako pojedynczy klucz i18n — tekst prawny jest zbyt długi/strukturalny na to).

### Treść (8 sekcji)

1. **Postanowienia ogólne** — Administratorem Konfiguratora i danych osobowych jest WINDY WIPRO SP. Z O.O., Kokotów 942, 32-002 Węgrzce Wielkie, NIP: 6832103529, REGON: 382308124, KRS: 0000765948, reprezentowana przez Janusza i Krzysztofa Kasperowskich.
2. **Definicje** — Konfigurator, Użytkownik, Zapytanie ofertowe, Oferta.
3. **Zasady korzystania z Konfiguratora** — proces: wypełnienie formularza wieloetapowego → wysłanie zapytania ofertowego → automatyczne przesłanie wstępnej oferty e-mailem; wycena ma charakter orientacyjny/niewiążący, ostateczna oferta wymaga kontaktu handlowego i weryfikacji technicznej.
4. **Odpowiedzialność** — Administrator nie gwarantuje ostatecznej ceny bez indywidualnej weryfikacji technicznej obiektu.
5. **Dane osobowe (RODO)** — cel przetwarzania (obsługa zapytania ofertowego i kontakt handlowy), podstawa prawna (art. 6 ust. 1 lit. b i f RODO), okres przechowywania (na czas realizacji zapytania i okres przedawnienia roszczeń), prawa osoby (dostęp, sprostowanie, usunięcie, ograniczenie przetwarzania, sprzeciw, przenoszenie danych, skarga do Prezesa UODO), kontakt w sprawach danych: projekty@windywipro.pl, brak profilowania, brak przekazywania danych do państw trzecich.
6. **Pliki cookies** — strona nie wykorzystuje obecnie plików cookies analitycznych/marketingowych; wyłącznie techniczne, niezbędne do działania konfiguratora.
7. **Reklamacje i kontakt** — zgłoszenia na projekty@windywipro.pl.
8. **Postanowienia końcowe** — możliwość zmiany regulaminu, prawo właściwe polskie, data wejścia w życie.

Kontakt (`projekty@windywipro.pl`) potwierdzony z istniejącego `Footer.tsx`.

---

## 4. Samodzielna zmiana hasła (panel admina)

### Backend
- Nowy endpoint `PATCH /api/auth/password`, middleware `auth:sanctum` (bez wymogu roli — dotyczy zalogowanego użytkownika niezależnie od roli, w praktyce używane tylko z panelu admina).
- Walidacja: `current_password` (required, musi przejść `Hash::check` względem hasła `$request->user()`), `password` (required, min:8, `confirmed` — czyli wymaga `password_confirmation`).
- Nowa metoda w `AuthController` (obok `login`/`logout`/`user`), zapis przez `Hash::make` (analogicznie do `AdminManagementController::update`).
- Błędne obecne hasło → 422 z komunikatem przypisanym do pola `current_password`.

### Frontend (admin)
- `NavigationBar.tsx` — blok avatar+nazwa (obecnie statyczny tekst, linie ~203-208) staje się klikalny (link/button) i nawiguje do nowej trasy `/profile`.
- `paths.tsx` — nowa trasa `/profile` wewnątrz `ProtectedLayout`.
- Nowa strona `ProfilePage` z formularzem (react-hook-form + yup, zgodnie z globalnymi zasadami projektu): pola `current_password`, `password`, `password_confirmation`.
- Błędy walidacji (yup) i błędy z API (w tym złe obecne hasło) wyświetlane pod odpowiednim polem. Sukces — toast/snackbar.

---

## Testowanie

Projekt nie ma rozbudowanego zaplecza testowego (tylko `ExampleTest.php` w `tests/Unit` i `tests/Feature`, brak testów frontendowych). Zakres weryfikacji:

- **Backend**: dodać ukierunkowane testy Feature dla (a) endpointu zmiany hasła (błędne obecne hasło odrzucone, poprawna zmiana, walidacja `confirmed`/min:8) oraz (b) logiki wykluczania domyślności (ustawienie `is_default` na jednym rekordzie czyści innych w tej samej grupie — dla modeli, kolorów i akcesoriów).
- **Frontend**: manualna weryfikacja w przeglądarce (dev server) — scroll kolorów, auto-zaznaczanie domyślnych wartości w kroku 3 (z pustym stanem i ze stanem już wypełnionym), treść `/regulamin`, formularz zmiany hasła w panelu admina (happy path + błędne obecne hasło + niezgodne potwierdzenie hasła).
