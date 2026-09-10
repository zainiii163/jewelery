#!/bin/bash
set -euo pipefail

# TLS certificates via Let's Encrypt (webroot) + renewal cron + nginx restart.
# Run AFTER server-setup.sh and once the domain resolves to this server.
# Run as:  sudo bash deploy/server-tls.sh

if [ "$(id -u)" != "0" ]; then SUDO="sudo"; else SUDO=""; fi
APP=/opt/jewellery
DOMAIN=$(grep "^DOMAIN=" "$APP/.env" | head -1 | cut -d= -f2)
DOMAIN=${DOMAIN:-}

if [ -z "$DOMAIN" ] || [ "$DOMAIN" = "localhost" ]; then
  echo "ERROR: set DOMAIN in $APP/.env first (e.g. shop.example.com)."
  exit 1
fi

echo "==> Domain: $DOMAIN"
echo "==> Installing certbot"
if ! command -v certbot >/dev/null 2>&1; then
  $SUDO apt-get install -y certbot
fi

echo "==> Issuing certificate for $DOMAIN"
$SUDO mkdir -p "$APP/certbot/www"
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
  echo "   Certificate already exists - renewing instead."
  $SUDO certbot renew --webroot -w "$APP/certbot/www" --quiet || true
else
  read -rp "  Email for Let's Encrypt notices: " EMAIL
  $SUDO certbot certonly --webroot -w "$APP/certbot/www" \
    -d "$DOMAIN" --email "$EMAIL" --agree-tos --no-eff-email
fi

echo "==> Installing renewal cron"
( crontab -l 2>/dev/null | grep -v "certbot renew"; \
  echo "0 0 * * * certbot renew --webroot -w $APP/certbot/www --quiet" ) | $SUDO crontab -

echo "==> Restarting nginx (applies cert + renders DOMAIN)"
cd "$APP"
$SUDO docker compose up -d nginx

echo ""
echo "DONE. Verify:"
echo "  curl -I https://$DOMAIN/"
echo "  curl -I https://$DOMAIN/api/health"
echo "  curl -I https://$DOMAIN/admin/"