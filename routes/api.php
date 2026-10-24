<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Client\ProductController;
use App\Http\Controllers\Client\CategoryController;
use App\Http\Controllers\Client\PromotionController;
use App\Http\Controllers\Client\CartController;
use App\Http\Controllers\Client\OrderController;
use App\Http\Controllers\Client\VoucherController;
use App\Http\Controllers\Client\FavoriteController;
use App\Http\Controllers\Client\CustomerController;
use App\Http\Controllers\Client\ContactController;
use App\Http\Controllers\Client\AuthController;

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\CustomerController as AdminCustomerController;
use App\Http\Controllers\Admin\EmployeeController as AdminEmployeeController;
use App\Http\Controllers\Admin\PromotionController as AdminPromotionController;
use App\Http\Controllers\Admin\CartController as AdminCartController;
use App\Http\Controllers\Admin\FavoriteController as AdminFavoriteController;

/*
|--------------------------------------------------------------------------
| API Routes (Client & Auth)
|--------------------------------------------------------------------------
*/

// Auth APIs
Route::prefix('auth')->middleware('web')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/google', [AuthController::class, 'googleLogin']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
});

// Products & Categories & Promotions APIs
Route::get('/products', [ProductController::class, 'apiIndex']);
Route::get('/products/{code}', [ProductController::class, 'apiShow']);
Route::put('/products/{code}/reviews/{reviewId}/like', [ProductController::class, 'toggleReviewLike']);

Route::get('/categories', [CategoryController::class, 'apiIndex']);
Route::get('/promotions', [PromotionController::class, 'apiIndex']);

// Cart APIs
Route::get('/cart', [CartController::class, 'apiIndex']);
Route::post('/cart/sync', [CartController::class, 'apiSync']);
Route::post('/cart', [CartController::class, 'apiStore']);
Route::put('/cart/{code}', [CartController::class, 'apiUpdate']);
Route::delete('/cart/{code}', [CartController::class, 'apiDestroy']);

// Orders APIs
Route::post('/orders', [OrderController::class, 'apiStore']);
Route::get('/orders/my-orders', [OrderController::class, 'apiMyOrders']);
Route::get('/orders/{code}', [OrderController::class, 'apiShow']);
Route::post('/orders/{code}/confirm', [OrderController::class, 'apiConfirmReceived']);
Route::post('/orders/{code}/rating', [OrderController::class, 'apiSubmitRating']);

// Vouchers APIs
Route::get('/vouchers/available', [VoucherController::class, 'available']);
Route::post('/vouchers/validate', [VoucherController::class, 'validateVoucher']);

// Favorites APIs
Route::get('/favorites', [FavoriteController::class, 'apiIndex']);
Route::post('/favorites', [FavoriteController::class, 'apiStore']);
Route::delete('/favorites/{maSP}', [FavoriteController::class, 'apiDestroy']);

// Customer & Contact APIs
Route::get('/account', [CustomerController::class, 'me']);
Route::put('/account', [CustomerController::class, 'updateMe']);
Route::get('/customers/{code}', [CustomerController::class, 'apiShow']);
Route::post('/contact', [ContactController::class, 'apiSend']);

/*
|--------------------------------------------------------------------------
| API Routes (Admin)
|--------------------------------------------------------------------------
*/

Route::prefix('admin')->middleware(\App\Http\Middleware\EnsureAccount::class . ':admin')->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'apiIndex']);
    Route::get('/dashboard/revenue', [AdminDashboardController::class, 'apiRevenue']);
    Route::get('/forecast', [\App\Http\Controllers\Admin\ForecastController::class, 'data']);
    Route::get('/forecast/metrics', [\App\Http\Controllers\Admin\ForecastController::class, 'metrics']);
    Route::get('/product-recommendations', [\App\Http\Controllers\Admin\ProductRecommendationController::class, 'data']);

    Route::post('/products/{code}', [AdminProductController::class, 'apiUpdateWithUpload']);
    Route::post('/customers/{code}/reset-password', [AdminCustomerController::class, 'resetPassword']);
    Route::post('/employees/{code}/reset-password', [AdminEmployeeController::class, 'resetPassword']);
    Route::patch('/employees/{code}/account-lock', [AdminEmployeeController::class, 'updateAccountLock']);

    Route::patch('/promotions/{code}/status', [AdminPromotionController::class, 'apiUpdateStatus']);

    $adminResources = [
        'products' => AdminProductController::class,
        'categories' => AdminCategoryController::class,
        'orders' => AdminOrderController::class,
        'customers' => AdminCustomerController::class,
        'employees' => AdminEmployeeController::class,
        'promotions' => AdminPromotionController::class,
        'carts' => AdminCartController::class,
        'favorites' => AdminFavoriteController::class,
    ];

    foreach ($adminResources as $resource => $controller) {
        Route::get("/{$resource}", [$controller, 'apiIndex']);
        Route::get("/{$resource}/{code}", [$controller, 'apiShow']);
        Route::post("/{$resource}", [$controller, 'apiStore']);
        Route::put("/{$resource}/{code}", [$controller, 'apiUpdate']);
        Route::delete("/{$resource}/{code}", [$controller, 'apiDestroy']);
    }
});
