<?php
declare(strict_types=1);
namespace Admin\Controllers;

use Admin\Services\EmployeeService;

final class EmployeeController extends BaseAdminController
{
    public function __construct()
    {
        parent::__construct(new EmployeeService());
    }
}
