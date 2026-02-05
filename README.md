# Laravel E-commerce

Projekt sklepu internetowego z odzieżą używaną – pełny stos: backend Laravel 11 (REST API) i frontend React z Tailwind CSS. Obsługuje produkty, koszyk, zamówienia, płatności (Stripe, Tpay, przelew) oraz autentykację z logowaniem przez Google.

## 🚀 Funkcjonalności

### Backend
- **Zarządzanie produktami** – CRUD z kategoriami, stanem magazynowym, zdjęciami
- **Koszyk zakupowy** – Dodawanie, edycja, usuwanie; walidacja dostępności (out of stock)
- **System zamówień** – Automatyczna numeracja, śledzenie statusu
- **Płatności** – Stripe (karta), Tpay (BLIK, karta, przelew online), przelew bankowy
- **System rabatowy** – Kody rabatowe (procentowe i stałe) z walidacją
- **Stan magazynowy** – Rezerwacja, blokady pesymistyczne, potwierdzenie zamówienia
- **Autentykacja** – Laravel Breeze API, logowanie przez Google (Socialite), profil użytkownika
- **Webhooks** – Stripe i Tpay – obsługa potwierdzenia płatności
- **Generowanie faktur PDF** – Asynchronicznie przez kolejki (Dompdf)
- **REST API** – Pełne API z zasobami (API Resources)

### Frontend (React + Tailwind CSS)
- Lista produktów z filtrowaniem (kategoria, wyszukiwanie)
- Koszyk z blokadą produktów niedostępnych
- Kasa – dane wysyłki, wybór metody płatności (Stripe/Tpay/przelew)
- Strona konta – edycja danych (pre-fill przy checkout)
- Toast notifications – komunikaty zamiast `alert()`
- Responsywny interfejs

## 🛠 Technologie

### Backend
- **Laravel 11.x** – Framework PHP
- **PHP 8.3** – Język programowania
- **MySQL 8.0** – Baza danych
- **Laravel Sanctum** – Autoryzacja API (tokeny)
- **Laravel Breeze** – Scaffolding autentykacji API
- **Laravel Cashier** – Integracja Stripe
- **Laravel Socialite** – Logowanie Google OAuth
- **Tpay OpenAPI PHP** – Płatności Tpay
- **Dompdf** – Generowanie faktur PDF

### Frontend
- **React 19** – Biblioteka UI
- **Vite** – Build tool
- **React Router** – Routing
- **Tailwind CSS 4** – Stylowanie
- **Axios** – Klient HTTP
- **Stripe.js** – Płatności Stripe
- **React Hot Toast** – Powiadomienia

### Środowisko
- **Laravel Herd** – Lokalne środowisko PHP (Nginx, PHP, Node.js)
- **Composer** / **npm** – Menadżery zależności

## 📋 Wymagania

- **Laravel Herd** – [herd.laravel.com](https://herd.laravel.com)
- **MySQL** – Lokalnie lub przez Herd Pro
- **Node.js** – Do uruchomienia frontendu (np. 18+)
- **PHP 8.3** – Zapewniany przez Herd

## 🚀 Instalacja

### 1. Sklonuj repozytorium

```bash
git clone https://github.com/gmaxsoft/Laravel_E_commerce.git
cd Laravel_E_commerce
```

### 2. Inicjalizacja Laravel Herd

```bash
herd init
```

Herd skopiuje `.env.example` do `.env`, skonfiguruje domenę (np. `http://laravel-e-commerce.test`).

### 3. Backend

```bash
composer install
php artisan key:generate
```

W `.env` ustaw bazę danych:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=laravel
DB_USERNAME=root
DB_PASSWORD=twoje_haslo
APP_URL=http://laravel-e-commerce.test
FRONTEND_URL=http://localhost:5173
```

```bash
php artisan migrate
php artisan db:seed
```

### 4. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

W `frontend/.env`:

```env
VITE_API_URL=/api
VITE_BACKEND_URL=http://laravel-e-commerce.test
VITE_STRIPE_KEY=pk_test_...
```

### 5. Konfiguracja zewnętrzna (opcjonalnie)

**Stripe** – [dashboard.stripe.com](https://dashboard.stripe.com):

```env
STRIPE_KEY=pk_test_...
STRIPE_SECRET=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CASHIER_CURRENCY=pln
```

**Tpay** – [register.sandbox.tpay.com](https://register.sandbox.tpay.com):

```env
TPAY_CLIENT_ID=...
TPAY_CLIENT_SECRET=...
TPAY_PRODUCTION=false
```

**Przelew bankowy**:

```env
BANK_TRANSFER_BANK_NAME="Nazwa banku"
BANK_TRANSFER_ACCOUNT="00 0000 0000 0000 0000 0000 0000"
BANK_TRANSFER_RECIPIENT="Nazwa odbiorcy"
BANK_TRANSFER_TITLE="Zamówienie nr %s"
```

**Google OAuth** – [console.cloud.google.com](https://console.cloud.google.com):

1. Utwórz projekt, włącz Google+ API
2. Credentials → Create OAuth client ID (Web application)
3. Authorized redirect URI: `http://laravel-e-commerce.test/api/auth/google/callback`
4. Skopiuj Client ID i Client Secret

```env
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REDIRECT_URI="${APP_URL}/api/auth/google/callback"
```

### 6. Uruchomienie

- Backend: Laravel Herd – **http://laravel-e-commerce.test**
- Frontend: `npm run dev` – **http://localhost:5173**
- Kolejki (faktury PDF): `php artisan queue:work`

## 📁 Struktura projektu

```
Laravel_E_commerce/
├── app/
│   ├── Http/Controllers/Api/   # Product, Cart, Order, Coupon, User, Webhook, TpayWebhook
│   ├── Http/Controllers/Auth/  # Login, Register, SocialAuth
│   ├── Services/               # InventoryService, TpayService
│   ├── Events/, Jobs/, Models/
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── components/         # Layout
│   │   ├── context/            # AuthContext
│   │   ├── lib/                # api.js
│   │   └── pages/              # Products, Cart, Checkout, CheckoutPayment, Account, Orders, Login, Register
│   └── ...
├── config/                     # services (Stripe, Tpay, Google, bank_transfer)
├── routes/api.php              # Trasy API
├── herd.yml                    # Konfiguracja Laravel Herd
└── ...
```

## 🔌 API Endpoints

### Autentykacja
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/google/redirect
GET    /api/auth/google/callback
GET    /api/user
PUT    /api/user
```

### Produkty
```
GET    /api/products
GET    /api/products/{id}
```

### Koszyk
```
GET    /api/cart
POST   /api/cart/items
PUT    /api/cart/items/{id}
DELETE /api/cart/items/{id}
DELETE /api/cart
```

### Zamówienia
```
GET    /api/orders
POST   /api/orders
POST   /api/orders/{id}/pay    # Inicjacja płatności (stripe/tpay/bank_transfer)
GET    /api/orders/{id}
```

### Kody rabatowe
```
GET    /api/coupons
GET    /api/coupons/{code}
POST   /api/coupons/validate
```

### Webhooks
```
POST   /api/webhooks/stripe
POST   /api/webhooks/tpay
```

## 🔄 Przepływ płatności

1. Użytkownik wypełnia dane wysyłki i klika **„Przejdź do płatności”**
2. Zamówienie jest zapisywane (bez inicjacji płatności)
3. Wybór metody: **Stripe** / **Tpay** / **Przelew bankowy**
4. Kliknięcie **„Zamów i zapłać”**:
   - **Stripe** – formularz Stripe (PaymentElement)
   - **Tpay** – przekierowanie na stronę płatności Tpay
   - **Przelew** – wyświetlenie danych do przelewu
5. Webhook potwierdza płatność (Stripe/Tpay)
6. Generowanie faktury PDF (kolejka)

## 🧪 Testy

### Backend

Projekt używa SQLite in-memory w testach:

```bash
php artisan test
```

### Frontend

Testy jednostkowe używają Vitest i React Testing Library:

```bash
cd frontend
npm test              # Uruchom wszystkie testy
npm run test:ui       # Uruchom testy z UI
npm run test:coverage # Uruchom testy z pokryciem kodu
```

## 🔄 CI/CD (GitHub Actions)

Projekt wykorzystuje GitHub Actions do automatycznego uruchamiania testów i walidacji kodu przy każdym push i pull request:

- **Laravel (Backend)** – Uruchamia testy PHP z SQLite in-memory
- **Laravel Pint** – Sprawdza formatowanie kodu zgodnie ze standardami Laravel
- **Frontend (React)** – Uruchamia ESLint i build aplikacji React

Workflow jest zdefiniowany w `.github/workflows/ci.yml` i automatycznie uruchamia się dla branchy `main` i `master`.

## 📝 Przydatne komendy

```bash
herd init                    # Inicjalizacja w Herd
php artisan migrate          # Migracje
php artisan db:seed          # Seedery
php artisan queue:work       # Kolejki (faktury)
php artisan config:clear     # Czyszczenie cache
./vendor/bin/pint            # Formatowanie kodu
```

## 🐛 Rozwiązywanie problemów

**Błąd sesji przy Google OAuth** – trasy OAuth używają middleware `web` (sesja).

**Pusta strona produktów** – sprawdź CORS i `FRONTEND_URL` w `.env`.

**Brak tabeli cache/jobs** – uruchom `php artisan migrate`.

**Stripe/Tpay nie działają** – dodaj klucze w `.env` (Stripe/Tpay).

## 📚 Dokumentacja

- [Laravel](https://laravel.com/docs)
- [Laravel Herd](https://herd.laravel.com/docs)
- [Laravel Sanctum](https://laravel.com/docs/sanctum)
- [Stripe API](https://stripe.com/docs/api)
- [Tpay OpenAPI](https://openapi.tpay.com)

## 📄 Licencja

Projekt otwartoźródłowy (MIT).

## 🔗 Repozytorium

[GitHub – Laravel_E_commerce](https://github.com/gmaxsoft/Laravel_E_commerce)
