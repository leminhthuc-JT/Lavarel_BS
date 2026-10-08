<?php

namespace App\Http\Controllers\Admin;

use App\Services\Admin\PromotionService;

class PromotionController extends BaseAdminController
{
    public function __construct()
    {
        parent::__construct(new PromotionService());
    }

    public function index()
    {
        return view('admin.promotions');
    }
}
