<?php
declare(strict_types=1);
namespace Admin\Controllers;

use Admin\Services\FavoriteService;

final class FavoriteController extends BaseAdminController
{
    public function __construct()
    {
        parent::__construct(new FavoriteService());
    }
}
