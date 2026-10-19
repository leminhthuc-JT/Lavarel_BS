<?php
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$public = realpath(dirname(__DIR__) . '/public');
$file = realpath($public . $path);
if ($file && str_starts_with($file, $public . DIRECTORY_SEPARATOR) && is_file($file) && pathinfo($file, PATHINFO_EXTENSION) !== 'php') {
    $types = ['js' => 'text/javascript', 'css' => 'text/css', 'png' => 'image/png', 'jpg' => 'image/jpeg'];
    header('Content-Type: ' . ($types[pathinfo($file, PATHINFO_EXTENSION)] ?? 'application/octet-stream'));
    readfile($file); return;
}
$app = require __DIR__ . '/bootstrap.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$request = Illuminate\Http\Request::capture();
$response = $kernel->handle($request);
$response->send();
$kernel->terminate($request, $response);
