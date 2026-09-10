FROM php:8.3-cli

WORKDIR /var/www

RUN apt-get update && apt-get install -y \
    libzip-dev zip unzip git curl libpng-dev libjpeg-dev libfreetype6-dev \
    libonig-dev libxml2-dev libpq-dev libsqlite3-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql pdo_sqlite mbstring bcmath gd zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

COPY . .

RUN mkdir -p storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 8000

CMD ["sh", "-c", "php artisan key:generate --force 2>/dev/null; touch database/database.sqlite 2>/dev/null; php artisan migrate --force; exec php -S 0.0.0.0:8000 router.php"]
