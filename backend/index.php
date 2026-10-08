<?php
declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

// ==========================================
// LOAD .ENV
// ==========================================
$envFile = __DIR__ . '/.env';

if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    foreach ($lines as $line) {
        $line = trim($line);

        // Bỏ qua comment
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }

        // Chỉ xử lý KEY=VALUE
        if (!str_contains($line, '=')) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);

        $key = trim($key);
        $value = trim($value);

        // Bỏ dấu quote nếu có
        $value = trim($value, "\"'");

        $_ENV[$key] = $value;
        putenv($key . '=' . $value);
    }
}

require_once __DIR__ . '/routes/Router.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$path = parse_url(
    $_SERVER['REQUEST_URI'],
    PHP_URL_PATH
) ?: '/';

error_log("INDEX PATH: " . $path);

/*
 * AUTH API
 */
if (str_starts_with($path, '/auth/')) {
    error_log("ROUTING TO AUTH.PHP");

    require __DIR__ . '/routes/auth.php';
    exit;
}

/*
 * CÁC ROUTE KHÁC
 */
$router = new Router();

require_once __DIR__ . '/routes/admin.php';
require_once __DIR__ . '/routes/client.php';

$basePath = '/New/backend/public';

if (str_starts_with($path, $basePath)) {
    $path = substr($path, strlen($basePath));
}

$path = '/' . ltrim($path, '/');

$router->dispatch(
    $_SERVER['REQUEST_METHOD'],
    $path
);