<?php
declare(strict_types=1);
namespace Admin\Controllers;

use Admin\Services\CustomerService;

final class CustomerController extends BaseAdminController
{
    public function __construct()
    {
        parent::__construct(new CustomerService());
    }
}
