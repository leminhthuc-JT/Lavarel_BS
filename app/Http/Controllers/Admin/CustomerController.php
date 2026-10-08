<?php

namespace App\Http\Controllers\Admin;

use App\Services\Admin\CustomerService;

class CustomerController extends BaseAdminController
{
    public function __construct()
    {
        parent::__construct(new CustomerService());
    }

    public function index()
    {
        return view('admin.customers');
    }
}
