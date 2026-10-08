<?php
declare(strict_types=1);
namespace Admin\Controllers;

use Admin\Services\PromotionService;

final class PromotionController extends BaseAdminController
{
    public function __construct()
    {
        parent::__construct(new PromotionService());
    }
}
