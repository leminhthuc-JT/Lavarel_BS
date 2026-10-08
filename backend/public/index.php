<?php
declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../routes/Router.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$router = new Router();

require_once __DIR__ . '/../routes/admin.php';
require_once __DIR__ . '/../routes/client.php';

$uri = parse_url(
    $_SERVER['REQUEST_URI'],
    PHP_URL_PATH
) ?: '/';

$basePath = '/New/backend/public';

if (str_starts_with($uri, $basePath)) {
    $uri = substr($uri, strlen($basePath));
}

$uri = '/' . ltrim($uri, '/');


$router->dispatch(
    $_SERVER['REQUEST_METHOD'],
    $uri
);
