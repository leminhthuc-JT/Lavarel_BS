<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Client\HomeController;
use App\Http\Controllers\Client\AboutController;
use App\Http\Controllers\Client\ProductController;
use App\Http\Controllers\Client\CategoryController;
use App\Http\Controllers\Client\CartController;
use App\Http\Controllers\Client\OrderController;
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
| Web Routes (Client Pages)
|--------------------------------------------------------------------------
*/

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/about', [AboutController::class, 'index'])->name('about');
Route::get('/menu', [ProductController::class, 'menu'])->name('menu');
Route::get('/categories', [CategoryController::class, 'index'])->name('categories');
Route::get('/details/{code?}', [ProductController::class, 'show'])->name('details');
Route::get('/cart', [CartController::class, 'index'])->name('cart');
Route::get('/payment', [OrderController::class, 'payment'])->name('payment');
Route::get('/orders', [OrderController::class, 'index'])->name('orders');
Route::get('/add-rating', [OrderController::class, 'addRating'])->name('add-rating');
Route::get('/favorites', [FavoriteController::class, 'index'])->name('favorites');
Route::get('/account-info', [CustomerController::class, 'info'])->name('account-info');
Route::get('/contact', [ContactController::class, 'index'])->name('contact');

// Auth web pages
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
Route::get('/forgot-password', [AuthController::class, 'showForgotPassword'])->name('forgot-password');
Route::get('/reset-password', [AuthController::class, 'showResetPassword'])->name('reset-password');

Route::prefix('chatbot')->middleware(\App\Http\Middleware\ChatbotAccess::class)->group(function () {
    Route::post('/message', [\App\Http\Controllers\Client\ChatbotController::class, 'message'])->name('chatbot.message');
    Route::post('/reset', [\App\Http\Controllers\Client\ChatbotController::class, 'reset'])->name('chatbot.reset');
});

// Fallback POST auth routes for direct /auth requests
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/google', [AuthController::class, 'googleLogin']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
});

/*
|--------------------------------------------------------------------------
| Web Routes (Admin Pages)
|--------------------------------------------------------------------------
*/

Route::prefix('admin')->name('admin.')->middleware(\App\Http\Middleware\EnsureAccount::class . ':admin')->group(function () {
    Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard.index');
    Route::get('/forecast', [\App\Http\Controllers\Admin\ForecastController::class, 'index'])->name('forecast');
    Route::get('/product-recommendations', [\App\Http\Controllers\Admin\ProductRecommendationController::class, 'index'])->name('product-recommendations');
    Route::get('/products', [AdminProductController::class, 'index'])->name('products');
    Route::get('/categories', [AdminCategoryController::class, 'index'])->name('categories');
    Route::get('/orders', [AdminOrderController::class, 'index'])->name('orders');
    Route::get('/customers', [AdminCustomerController::class, 'index'])->name('customers');
    Route::get('/employees', [AdminEmployeeController::class, 'index'])->name('employees');
    Route::get('/promotions', [AdminPromotionController::class, 'index'])->name('promotions');
    Route::get('/carts', [AdminCartController::class, 'index'])->name('carts');
    Route::get('/favorites', [AdminFavoriteController::class, 'index'])->name('favorites');
});

// Bình luận: dùng phiên đăng nhập phía server để giới hạn quyền quản trị.
Route::prefix('admin/reviews')->middleware(\App\Http\Middleware\EnsureReviewAdmin::class)->group(function () {
    Route::get('/', [\App\Http\Controllers\Admin\ReviewController::class, 'index'])->name('admin.reviews');
    Route::get('/data', [\App\Http\Controllers\Admin\ReviewController::class, 'apiIndex']);
    Route::put('/{code}/{reviewId}/reply', [\App\Http\Controllers\Admin\ReviewController::class, 'reply'])
        ->middleware(\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class);
});
Route::post('/auth/logout', [AuthController::class, 'logout']);
