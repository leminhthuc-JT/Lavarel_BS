<?php
declare(strict_types=1);
namespace Admin\Controllers;

use Admin\Services\CartService;

final class CartController extends BaseAdminController
{
    public function __construct()
    {
        parent::__construct(new CartService());
    }
}
