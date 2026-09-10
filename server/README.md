# Jewellery Shop — Cloud Backup API (Laravel)

Server side of the offline-first Jewellery Shop Manager desktop app. It provides
shop authentication (Sanctum tokens) and versioned backup upload/download.

> **Note:** this project already contains a complete Laravel 12 application
> (scaffolded + Sanctum installed) merged with the custom files described below.
> With PHP >= 8.2 and Composer installed you can run it straight away:

```bash
cd server
composer install          # install dependencies (already done if vendor/ exists)
cp .env.example .env      # if .env missing
php artisan key:generate
php artisan migrate       # creates shops + personal_access_tokens tables
php artisan db:seed --class=ShopSeeder
php artisan serve         # → http://localhost:8000
```

## What the app expects

| Method | Path                 | Purpose                          |
|--------|----------------------|----------------------------------|
| POST   | `/api/auth/login`    | `{ "shop_code": "...", "password": "..." }` → `{ token, shop }` |
| GET    | `/api/ping`          | Auth check (`Authorization: Bearer <token>`) |
| POST   | `/api/backup/push`   | Multipart field `backup` = `.db` file |
| GET    | `/api/backup/latest` | Downloads the newest backup      |

Backups are stored per shop under `storage/app/private/backups/<SHOP_CODE>/`
(`latest.db` plus versioned copies) — the Laravel `local` disk root is
`storage/app/private` since Laravel 11.

## Custom files (dropped into the Laravel scaffold)

- `routes/api.php` — the four endpoints above
- `app/Http/Controllers/AuthController.php` — shop login, issues Sanctum tokens
- `app/Http/Controllers/BackupController.php` — ping / push / latest
- `app/Models/Shop.php` — token-capable `Authenticatable` shop model
- `database/migrations/..._create_shops_table.php`
- `database/seeders/ShopSeeder.php`

Default seeded shop: `shop_code: MAIN` / `password: changeme` (change it!).

## Pointing the desktop app at it

In the app: **☰ → Backup → Cloud Backup & Sync**:
1. `Server URL` = `http://localhost:8000`
2. `Shop Code` = `MAIN`
3. Click **Login** with password `changeme` (stores the token automatically)
4. **Backup to Cloud** uploads a consistent SQLite snapshot; **Restore from Cloud** pulls the latest.

Enable **Automatic cloud backup** to push on every app start when due.

## Production notes

- Put it behind HTTPS (e.g. Cloudflare / Caddy / Nginx).
- Backups are raw `.db` files — encrypt them at rest. For Cloudflare R2, either
  bridge storage via S3 (e.g. `league/flysystem-aws-s3-v3` + R2 endpoint) or
  point `storage/app/backups` at a mounted R2 bucket through your host.
- Delete old versioned copies periodically (e.g. keep last 30 per shop).