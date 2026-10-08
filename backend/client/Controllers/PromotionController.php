<?php
declare(strict_types=1);
namespace Client\Controllers;

use Client\Services\PromotionService;
use Shared\Helpers\Response;

final class PromotionController
{
    public function index(): never
    {
        Response::success((new PromotionService())->active());
    }
}
