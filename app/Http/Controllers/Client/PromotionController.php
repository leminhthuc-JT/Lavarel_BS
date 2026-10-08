<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Services\Client\PromotionService;
use Illuminate\Http\Request;

class PromotionController extends Controller
{
    protected PromotionService $promotionService;

    public function __construct()
    {
        $this->promotionService = new PromotionService();
    }

    public function apiIndex()
    {
        try {
            $data = method_exists($this->promotionService, 'active')
                ? $this->promotionService->active()
                : $this->promotionService->list();
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }
}
