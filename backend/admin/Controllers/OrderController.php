<?php
declare(strict_types=1);
namespace Admin\Controllers;

use Admin\Services\OrderService;

final class OrderController extends BaseAdminController
{
    public function __construct()
    {
        parent::__construct(new OrderService());
    }
}
