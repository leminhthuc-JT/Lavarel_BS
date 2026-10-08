<?php

declare(strict_types=1);

use Admin\Controllers\CartController;
use Admin\Controllers\CategoryController;
use Admin\Controllers\CustomerController;
use Admin\Controllers\DashboardController;
use Admin\Controllers\EmployeeController;
use Admin\Controllers\FavoriteController;
use Admin\Controllers\OrderController;
use Admin\Controllers\ProductController;
use Admin\Controllers\PromotionController;


/* =====================================================
   DASHBOARD
===================================================== */

$router->get(
    '/api/admin/dashboard',
    [
        DashboardController::class,
        'index'
    ]
);

$router->get(
    '/api/admin/dashboard/revenue',
    [
        DashboardController::class,
        'revenue'
    ]
);


/* =====================================================
   PRODUCT UPLOAD UPDATE
===================================================== */

/*
 * Riêng sản phẩm:
 *
 * Khi update có upload file,
 * frontend gửi multipart/form-data bằng POST
 *
 * POST /api/admin/products/{code}
 */
$router->post(
    '/api/admin/products/{code}',
    [
        ProductController::class,
        'update'
    ]
);


/* =====================================================
   CRUD MODULES
===================================================== */

$modules = [

    '/api/admin/products' =>
        ProductController::class,

    '/api/admin/categories' =>
        CategoryController::class,

    '/api/admin/orders' =>
        OrderController::class,

    '/api/admin/customers' =>
        CustomerController::class,

    '/api/admin/employees' =>
        EmployeeController::class,

    '/api/admin/promotions' =>
        PromotionController::class,

    '/api/admin/carts' =>
        CartController::class,

    '/api/admin/favorites' =>
        FavoriteController::class

];


foreach (
    $modules
    as $base => $controller
) {

    /* LIST */
    $router->get(
        $base,
        [
            $controller,
            'index'
        ]
    );


    /* DETAIL */
    $router->get(
        $base . '/{code}',
        [
            $controller,
            'show'
        ]
    );


    /* CREATE */
    $router->post(
        $base,
        [
            $controller,
            'store'
        ]
    );


    /*
     * UPDATE chuẩn JSON.
     *
     * Vẫn giữ PUT để các module khác:
     * category, employee, promotion...
     * hoạt động như cũ.
     */
    $router->put(
        $base . '/{code}',
        [
            $controller,
            'update'
        ]
    );


    /* DELETE */
    $router->delete(
        $base . '/{code}',
        [
            $controller,
            'destroy'
        ]
    );

}