<?php

namespace App\Http\Controllers\Admin;

use App\Services\Admin\ProductService;

class ProductController extends BaseAdminController
{
    public function __construct()
    {
        parent::__construct(new ProductService());
    }

    public function index()
    {
        return view('admin.products');
    }
}
