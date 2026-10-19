<?php
require dirname(__DIR__) . '/vendor/autoload.php';
$app = require dirname(__DIR__) . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$testDatabase = getenv('CODEX_TEST_DATABASE');
if (!is_string($testDatabase) || !preg_match('/^codex_test_[a-f0-9]{16}$/', $testDatabase)) {
    throw new RuntimeException('An isolated test database name is required.');
}
config(['database.connections.mongodb.database' => $testDatabase,
    'session.files' => sys_get_temp_dir() . '/' . $testDatabase,
    'session.lottery' => [0, 100], 'app.debug' => false]);
if (!is_dir(config('session.files'))) mkdir(config('session.files'), 0700, true);
Illuminate\Support\Facades\DB::purge('mongodb');
return $app;
