<?php

namespace App\Http\Controllers\Admin;

use App\Services\Admin\CategoryService;

class CategoryController extends BaseAdminController
{
    public function __construct()
    {
        parent::__construct(new CategoryService());
    }

    public function index()
    {
        return view('admin.categories');
    }
}
