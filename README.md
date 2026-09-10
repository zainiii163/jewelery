# Jewellery Shop — Offline-First Business Suite

A complete jewellery business ecosystem. The desktop POS works **fully offline**
(local SQLite primary); the cloud API is used only for sync, backup, and the
customer-facing website.

## Components

| App | Tech | Purpose |
|-----|------|---------|
| `jewellery_shop/` | Flutter (Windows desktop) | Offline-first POS: products, sales, invoices (PDF + barcode), purchases, customers, inventory, Sync engine |
| `server/` | Laravel 12 + SQLite + Sanctum | Sync & REST API: product publishing, website orders/appointments/requests, reports, CSV exports, backup |
| `website/` | Next.js 16 + Tailwind | Customer storefront with EN/Urdu (RTL), cart, checkout, appointment & custom-request booking |
| `admin/` | React + Vite + Tailwind | Back-office: dashboard & analytics, product/media CRUD, order/slot/request management, CSV export |

## Architecture

```
Flutter desktop app (offline-first) ──HTTPS──► Laravel API (server/) ──► SQLite
                                                       │
                                                       ├──► storefront (website/)
                                                       └──► admin panel  (admin/)
```

- Sync engine pushes dirty products/media and pulls website activity every 5 min.
- Media served from `/storage/...`; URLs rebuilt client-side.
- Reports & exports: KPIs, 30-day revenue, top products, status/payment
  breakdowns, low-stock, CSV exports.

## Running locally

```bash
# 1. API (port 8000)
cd server && start_server.bat

# 2. Website (port 3000)  needs website/.env.local with API URL + shop code
cd website && npm run dev

# 3. Admin (port 5173)   login MAIN / changeme
cd admin && npm run dev

# 4. Desktop app (Flutter, port-independent)
cd jewellery_shop && flutter run -d windows
```

## Deployment

See [DEPLOY.md](DEPLOY.md). One-VPS `docker compose` stack (Nginx + PHP-FPM +
Next standalone + Vite SPA), TLS via Let's Encrypt, CI/CD via GitHub Actions
(CI on push, CD on `v*` tags).

## Installer

`dist/JewelleryShop-Setup-1.0.0.exe` (Inno Setup) — build locally with:

```powershell
& "C:\Users\zainii\AppData\Local\Programs\Inno Setup 6\ISCC.exe" "dist\setup.iss"
```