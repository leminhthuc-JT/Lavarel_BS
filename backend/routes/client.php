<?php
declare(strict_types=1);

use Client\Controllers\CategoryController;
use Client\Controllers\CustomerController;
use Client\Controllers\ProductController;
use Client\Controllers\PromotionController;

$router->get(
    '/api/products',
    [ProductController::class, 'index']
);

$router->get(
    '/api/products/{code}',
    [ProductController::class, 'show']
);

$router->get(
    '/api/categories',
    [CategoryController::class, 'index']
);

$router->get(
    '/api/promotions',
    [PromotionController::class, 'index']
);

// Cart routes
$router->get('/api/cart', [Client\Controllers\CartController::class, 'index']);
$router->post('/api/cart/sync', [Client\Controllers\CartController::class, 'sync']);
$router->post('/api/cart', [Client\Controllers\CartController::class, 'store']);
$router->put('/api/cart/{code}', [Client\Controllers\CartController::class, 'update']);
$router->delete('/api/cart/{code}', [Client\Controllers\CartController::class, 'destroy']);

// Order routes
$router->post('/api/orders', [Client\Controllers\OrderController::class, 'store']);
$router->get('/api/orders/my-orders', [Client\Controllers\OrderController::class, 'myOrders']);
$router->get('/api/orders/{code}', [Client\Controllers\OrderController::class, 'show']);
$router->post('/api/orders/{code}/confirm', [Client\Controllers\OrderController::class, 'confirmReceived']);
$router->post('/api/orders/{code}/rating', [Client\Controllers\OrderController::class, 'submitRating']);

// Voucher routes
$router->get('/api/vouchers/available', [Client\Controllers\VoucherController::class, 'available']);
$router->post('/api/vouchers/validate', [Client\Controllers\VoucherController::class, 'validate']);


// Favorite routes
$router->get('/api/favorites', [Client\Controllers\FavoriteController::class, 'index']);
$router->post('/api/favorites', [Client\Controllers\FavoriteController::class, 'store']);
$router->delete('/api/favorites/{maSP}', [Client\Controllers\FavoriteController::class, 'destroy']);

$router->put('/api/products/{code}/reviews/{reviewId}/like', [
    Client\Controllers\ProductController::class,
    'toggleReviewLike'
]);

$router->get('/api/customers/{code}', [Client\Controllers\CustomerController::class, 'show']);

$router->post('/api/auth/change-password', function () {

    require_once __DIR__ . '/../app/Services/AuthService.php';

    $body = json_decode(
        file_get_contents('php://input'),
        true
    );

    if (!is_array($body)) {
        $body = [];
    }

    $email = trim($body['email'] ?? '');
    $currentPassword = $body['currentPassword'] ?? '';
    $newPassword = $body['newPassword'] ?? '';
    $confirmPassword = $body['confirmPassword'] ?? '';

    try {

        $authService = new AuthService();

        $result = $authService->changePassword(
            $email,
            $currentPassword,
            $newPassword,
            $confirmPassword
        );

        http_response_code(200);

        header(
            'Content-Type: application/json; charset=UTF-8'
        );

        echo json_encode(
            [
                'success' => true,
                'message' => $result['message']
                    ?? 'Đổi mật khẩu thành công.'
            ],
            JSON_UNESCAPED_UNICODE
        );

    } catch (Throwable $e) {

        error_log(
            'CHANGE PASSWORD ERROR: '
            . $e->getMessage()
        );

        http_response_code(400);

        header(
            'Content-Type: application/json; charset=UTF-8'
        );

        echo json_encode(
            [
                'success' => false,
                'message' => $e->getMessage()
            ],
            JSON_UNESCAPED_UNICODE
        );
    }

    exit;
});

// Contact form route
$router->post('/api/contact', [Client\Controllers\ContactController::class, 'send']);