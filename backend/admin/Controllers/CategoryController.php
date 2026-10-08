<?php
declare(strict_types=1);
namespace Admin\Controllers;

use Admin\Services\CategoryService;

final class CategoryController extends BaseAdminController
{
    public function __construct()
    {
        parent::__construct(new CategoryService());
    }
}
