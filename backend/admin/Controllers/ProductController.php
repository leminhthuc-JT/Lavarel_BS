<?php
declare(strict_types=1);
namespace Admin\Controllers;

use Admin\Services\ProductService;

final class ProductController extends BaseAdminController
{
    public function __construct()
    {
        parent::__construct(new ProductService());
    }
}
