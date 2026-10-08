<?php

namespace App\Http\Controllers\Admin;

use App\Services\Admin\CartService;

class CartController extends BaseAdminController
{
    public function __construct()
    {
        parent::__construct(new CartService());
    }

    public function index()
    {
        return view('admin.carts');
    }
}
