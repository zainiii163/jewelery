#!/bin/bash
set -euo pipefail

# One-time server setup for the Jewellery Shop (nginx + Laravel + Next.js + Vite).
# Idempotent: safe to re-run. Run as:  sudo bash deploy/server-setup.sh

if [ "$(id -u)" != "0" ]; then SUDO="sudo"; else SUDO=""; fi
APP=/opt/jewellery

echo "==> [1/6] Installing Docker + git (Ubuntu/Debian)"
if ! command -v docker >/dev/null 2>&1; then
  $SUDO apt-get update
  $SUDO apt-get install -y docker.io docker-compose-v2 git openssl sqlite3 curl
  $SUDO systemctl enable docker
  $SUDO systemctl start docker
fi
PROXY=""; [ "$SUDO" != "" ] && PROXY="sudo "
$PROXY docker compose version >/dev/null 2>&1 || { echo "ERROR: docker compose plugin missing. Run: sudo apt-get install -y docker-compose-v2"; exit 1; }

echo "==> [2/6] Getting the code"
if [ ! -d "$APP/.git" ]; then
  $SUDO mkdir -p "$APP"
  $SUDO git clone https://github.com/zainiii163/jewelery.git "$APP"
fi
cd "$APP"

echo "==> [3/6] Configuring .env (DOMAIN / SHOP_CODE / SITE_NAME / APP_KEY)"
if [ ! -f .env ]; then
  cp .env.example .env
fi
if ! grep -q "^DOMAIN=" .env || grep -q "DOMAIN=$" .env; then
  read -rp "  Domain (e.g. shop.example.com or tayyabshop.duckdns.org): " DOMAIN
  [ -n "$DOMAIN" ] && sed -i "s|^DOMAIN=.*|DOMAIN=$DOMAIN|" .env
fi
read -rp "  Shop code [MAIN]: " SHOP; [ -n "$SHOP" ] && sed -i "s|^SHOP_CODE=.*|SHOP_CODE=$SHOP|" .env
read -rp "  Site name [Tayyab Jewellers]: " SITE; [ -n "$SITE" ] && sed -i "s|^SITE_NAME=.*|SITE_NAME=$SITE|" .env
if ! grep -q "^APP_KEY=base64:" .env; then
  KEY=$($PROXY openssl rand -base64 32)
  sed -i "s|^APP_KEY=.*|APP_KEY=base64:$KEY|" .env
  echo "  Generated APP_KEY (keep it; also add as a GitHub Secret if you use CD)."
fi

echo "==> [4/6] Creating data folders"
$SUDO mkdir -p server/database server/storage certbot/www

echo "==> [5/6] Building images (first run takes several minutes)"
$SUDO docker compose build

echo "==> [6/6] Starting the stack"
$SUDO docker compose up -d
$SUDO docker compose ps

echo ""
echo "DONE. Next: issue TLS certificates:"
echo "  sudo bash $APP/deploy/server-tls.sh"
echo "Then verify:"
echo "  curl -I https://\$(grep '^DOMAIN=' $APP/.env | cut -d= -f2)/api/health"