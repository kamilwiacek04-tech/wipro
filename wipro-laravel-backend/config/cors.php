<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:4173',
        'https://wipro-laravel-backend.ddev.site',
        'https://wipro-wind.pl',
        'https://www.wipro-wind.pl',
        'https://konfigurator.wipro-wind.pl',
        env('CLIENT_URL', 'https://wipro-sable.vercel.app'),
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
