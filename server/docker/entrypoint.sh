#!/bin/sh
set -e

# Prepare writable storage structure for Laravel.
mkdir -p storage/app/public \
  storage/framework/cache/data \
  storage/framework/sessions \
  storage/framework/views \
  storage/logs

# Ensure the SQLite database file exists and is writable by php-fpm.
mkdir -p database
touch database/database.sqlite
chown -R www-data:www-data database storage || true
chmod -R 775 database storage || true

# Idempotent migrations + storage symlink on every container start.
php artisan migrate --force
php artisan storage:link --force || true
php artisan config:cache || true

exec "$@"