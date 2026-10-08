<?php

namespace App\Http\Controllers\Admin;

use App\Services\Admin\EmployeeService;

class EmployeeController extends BaseAdminController
{
    public function __construct()
    {
        parent::__construct(new EmployeeService());
    }

    public function index()
    {
        return view('admin.employees');
    }
}
