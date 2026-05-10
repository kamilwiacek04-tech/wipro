# WIPRO Wind — System konfiguracji wind

Monorepo zawierające trzy aplikacje składające się na system konfiguracji wind:

| Folder | Opis | Port / Ścieżka |
|---|---|---|
| `wipro-laravel-backend/` | API Laravel + panel Filament | 80/443 (DDEV) |
| `wipro-react-frontend/` | Panel administracyjny React | 3001, `/w-admin/` |
| `wipro-react-configurator/wipro-react-configurator/` | Konfigurator dla klienta React | 3000 |

---

## Wymagania

- [DDEV](https://ddev.readthedocs.io/en/stable/) ≥ 1.23
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) lub Orbstack
- Node.js ≥ 20 + npm (do admina i konfiguratora)
- Yarn (do konfiguratora — `npm install -g yarn`)

---

## 1. Backend Laravel (`wipro-laravel-backend`)

```bash
cd wipro-laravel-backend

# Uruchom środowisko DDEV (MariaDB + PHP 8.3 + Nginx)
ddev start

# Zainstaluj zależności PHP
ddev composer install

# Skopiuj i uzupełnij zmienne środowiskowe
cp .env.example .env
ddev exec php artisan key:generate

# Uruchom migracje i seedery
ddev exec php artisan migrate --seed

# (opcjonalnie) Utwórz konto admina Filament
ddev exec php artisan make:filament-user
```

Backend będzie dostępny pod adresem: **https://wipro-laravel-backend.ddev.site**  
Panel Filament: **https://wipro-laravel-backend.ddev.site/admin**

### Mailer (opcjonalnie)

Domyślnie `.env.example` ustawia MAIL_MAILER=smtp z lokalnym portem 1025.  
Możesz użyć [Mailpit](https://ddev.readthedocs.io/en/stable/users/extend/additional-services/#mailpit) (wbudowany w DDEV) lub zewnętrznego SMTPa (np. Brevo).

---

## 2. Panel admina (`wipro-react-frontend`)

```bash
cd wipro-react-frontend

# Zainstaluj zależności
npm install

# Skopiuj zmienne środowiskowe
cp .env.example .env
# Edytuj .env jeśli backend działa pod innym adresem

# Tryb deweloperski
npm run dev
```

Panel dostępny pod: **http://localhost:3001/w-admin/**

Zmienne środowiskowe (`.env`):
```
VITE_API_URL=https://wipro-laravel-backend.ddev.site/api
```

### Build produkcyjny

```bash
npm run build
# Wynik w: build/
```

---

## 3. Konfigurator klienta (`wipro-react-configurator`)

```bash
cd wipro-react-configurator/wipro-react-configurator

# Zainstaluj zależności
yarn install

# Skopiuj zmienne środowiskowe
cp .env.example .env
# Edytuj .env jeśli backend działa pod innym adresem

# Tryb deweloperski
yarn dev
```

Konfigurator dostępny pod: **http://localhost:3000**

Zmienne środowiskowe (`.env`):
```
VITE_PUBLIC_API_URL=https://wipro-laravel-backend.ddev.site/api/
```

### Build produkcyjny

```bash
yarn build
# Wynik w: dist/
```

---

## Kolejność uruchamiania

1. Uruchom backend DDEV (`ddev start` w `wipro-laravel-backend/`)
2. Uruchom panel admina (`npm run dev` w `wipro-react-frontend/`)
3. Uruchom konfigurator (`yarn dev` w `wipro-react-configurator/wipro-react-configurator/`)
