FROM php:8.3-cli-alpine

RUN apk add --no-cache \
    icu-dev \
    libzip-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libxml2-dev \
    oniguruma-dev \
    zip \
    unzip \
    curl \
    git \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        intl \
        zip \
        gd \
        pdo \
        pdo_mysql \
        mbstring \
        xml \
        opcache \
        fileinfo \
        pcntl

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

COPY php.ini /usr/local/etc/php/conf.d/uploads.ini

RUN composer install --optimize-autoloader --no-dev --no-interaction --no-scripts

RUN php artisan storage:link || true

EXPOSE 8080

CMD php artisan migrate --force && php artisan db:seed --force && php artisan serve --host=0.0.0.0 --port=${PORT:-8080}
