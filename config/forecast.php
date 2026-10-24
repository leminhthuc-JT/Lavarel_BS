<?php

return [
    'url' => env('FORECAST_API_URL', 'http://127.0.0.1:8001'),
    'key' => env('FORECAST_API_KEY', ''),
    'timeout' => (int) env('FORECAST_API_TIMEOUT', 15),
];
