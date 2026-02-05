# Frontend – Odzież Używana

React + Vite + Tailwind CSS – sklep z odzieżą second-hand, korzystający z API Laravel.

## Uruchomienie

```bash
cd frontend
npm install
npm run dev
```

Aplikacja działa pod `http://localhost:5173`.

## Konfiguracja

Skopiuj `.env.example` do `.env` i ustaw:

```
VITE_API_URL=http://laravel-e-commerce.test/api
VITE_BACKEND_URL=http://laravel-e-commerce.test
VITE_STRIPE_KEY=pk_test_xxx
```

## Wymagania

- Backend Laravel uruchomiony (np. `http://laravel-e-commerce.test`)
- W backendzie w `.env`: `FRONTEND_URL=http://localhost:5173` (CORS)

## Struktura

- `src/lib/api.js` – klient API
- `src/context/AuthContext.jsx` – kontekst autentykacji
- `src/pages/` – strony (Produkty, Koszyk, Zamówienia, itd.)
- `src/components/Layout.jsx` – layout z nawigacją
