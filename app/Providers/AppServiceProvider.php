<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Các request validator hiện có được dùng chung với backend cũ.
        $loader = require base_path('vendor/autoload.php');
        $loader->addPsr4('Admin\\Requests\\', base_path('backend/admin/Requests'));
    }

    public function boot(): void
    {
    }
}
