<?php

namespace App\Http\Controllers\Admin;

use App\Services\Admin\FavoriteService;

class FavoriteController extends BaseAdminController
{
    public function __construct()
    {
        parent::__construct(new FavoriteService());
    }

    public function index()
    {
        return view('admin.favorites');
    }
}
