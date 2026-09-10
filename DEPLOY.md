# Deployment

The ecosystem consists of four deployable units:

| Unit | Tech | Container |
|------|------|-----------|
| Laravel API (`server/`) | PHP 8.3 + SQLite | `api` (php-fpm) |
| Next.js website (`website/`) | Next 16 standalone | `web` (node) |
| Admin panel (`admin/`) | Vite SPA | `admin` (nginx static) |
| Nginx reverse proxy | nginx + Let's Encrypt | `nginx` |

Everything runs on a single VPS with `docker compose`. The Flutter desktop
app is distributed as a Windows installer (built locally) and phones home to
the same API over HTTPS.

## Stack layout

```
Client (Flutter desktop app, offline-first)
        │  HTTPS /api/*
        ▼
Nginx (:80/:443) ──► /api/*       ──► api  (php-fpm, /var/www)
                 ──► /storage/*   ──► api  (static media)
                 ──► /admin/*     ──► admin (nginx, vite SPA)
                 ──► /            ──► web  (next standalone :3000)
```

## Prerequisites (on the server)

- Docker + docker compose plugin (`docker compose version`)
- A domain name pointed at the server (A record)
- Ports 80/443 open

## One-time setup

```bash
# 1. Clone or upload the repo
git clone <repo> /opt/jewellery && cd /opt/jewellery

# 2. Configure
cp .env.example .env        # edit DOMAIN, SHOP_CODE, SITE_NAME
nano .env                   # set APP_KEY (run `php artisan key:generate --show`)
cp server/.env.example server/.env

# 3. Initialize storage + SQLite DB
mkdir -p server/storage server/database
cd server && php artisan migrate --force && php artisan storage:link && cd ..

# 4. Bring up the stack
docker compose build
docker compose up -d
```

`APP_KEY` in `.env` is injected into the `api` container. The `api`
container also runs `php artisan migrate --force` on every start, so future
migrations apply automatically on redeploy.

## TLS (Let's Encrypt)

The proxy has an ACME challenge endpoint prewired. On the host:

```bash
apt install certbot
certbot certonly --webroot -w /opt/jewellery/certbot/www \
  -d <DOMAIN> --email you@example.com --agree-tos --no-eff-email
echo "0 0 * * * certbot renew --webroot -w /opt/jewellery/certbot/www --quiet" | crontab -
docker compose restart nginx
```

The nginx image renders `nginx/templates/default.conf.template` with
`envsubst`, substituting the `DOMAIN` env var (from `.env`). No manual sed is
needed. If you change `DOMAIN`, restart nginx:
`docker compose up -d nginx`.

## Automatic deployment (GitHub Actions)

- **CI** (`.github/workflows/ci.yml`) runs on every push/PR: Laravel tests +
  config cache, Next.js build, Flutter analyze/test + Windows release build
  (uploaded as artifact).
- **CD** (`.github/workflows/cd.yml`) runs when you tag `vX.Y.Z`: builds `api`
  and `web` images, pushes to GHCR, SSHs into the server and redeploys.

Secrets required for CD:

| Secret | Meaning |
|--------|---------|
| `DEPLOY_HOST` | Server IP |
| `DEPLOY_USER` | SSH user |
| `DEPLOY_KEY` | Private SSH key |
| `DOMAIN` | Public domain |
| `APP_KEY` | Laravel app key (from step 2) |
| `SHOP_CODE`, `SITE_NAME` | Website branding |
| `NEXT_PUBLIC_API_URL` | `https://<DOMAIN>` |

## Local development

```bash
# Infra dev variants (hot reload)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up api-dev web-dev
```

Otherwise the existing local tooling is unchanged:
- API: `server/start_server.bat` (php artisan serve → :8000)
- Website: `cd website && npm run dev` (→ :3000)
- Admin: `cd admin && npm run dev` (→ :5173)

## Backup

SQLite lives in `server/database/database.sqlite` and uploads in
`server/storage/app/public`. Back up both:

```bash
tar czf backup-$(date +%F).tar.gz server/database server/storage
```

For a crash-consistent SQLite copy while the stack runs, prefer:

```bash
sqlite3 server/database/database.sqlite ".backup 'backup-$(date +%F).sqlite'"
```

Restore by placing the files back and restarting the `api` container.