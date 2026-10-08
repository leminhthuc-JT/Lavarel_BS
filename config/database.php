<?php

return [
    'default' => env('DB_CONNECTION', 'mongodb'),

    'connections' => [
        'mongodb' => [
            'driver'   => 'mongodb',
            'dsn'      => env('MONGODB_URI', 'mongodb://127.0.0.1:27017'),
            'database' => env('MONGODB_DATABASE', 'QL_CakeShop'),
        ],
    ],

    'migrations' => 'migrations',

    'redis' => [
        'client' => env('REDIS_CLIENT', 'phpredis'),
        'options' => [
            'cluster' => env('REDIS_CLUSTER', 'redis'),
            'prefix' => env('REDIS_PREFIX', ''),
        ],
    ],
];
