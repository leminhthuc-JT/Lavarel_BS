<?php

return [
    'default' => env('FILESYSTEM_DISK', 'local'),
    'disks' => [
        'local' => [
            'driver' => 'local',
            'root' => storage_path('app'),
            'throw' => false,
        ],
        'public' => [
            'driver' => 'local',
            'root' => public_path('assets'),
            'url' => env('APP_URL', 'http://localhost') . '/assets',
            'visibility' => 'public',
            'throw' => false,
        ],
    ],
];
