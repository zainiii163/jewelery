<?php

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [env('FRONTEND_URL', '*')],
    'allowed_origins_patterns' => [
        '#^https://website-.*\.vercel\.app$#',
        '#^https://.*-zainiii163s-projects\.vercel\.app$#',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
