<?php
declare(strict_types=1);
namespace Client\Controllers;

use Client\Services\CategoryService;
use Shared\Helpers\Response;

final class CategoryController
{
    public function index(): never
    {
        Response::success((new CategoryService())->list());
    }
}
