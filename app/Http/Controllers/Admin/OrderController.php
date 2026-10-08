<?php

namespace App\Http\Controllers\Admin;

use App\Services\Admin\OrderService;

class OrderController extends BaseAdminController
{
    public function __construct()
    {
        parent::__construct(new OrderService());
    }

    public function index()
    {
        return view('admin.orders');
    }
}
