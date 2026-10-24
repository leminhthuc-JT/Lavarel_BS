<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\ProductRecommendationService;
use Illuminate\Http\Request;

final class ProductRecommendationController extends Controller
{
    public function index()
    {
        return view('admin.product-recommendations');
    }

    public function data(Request $request, ProductRecommendationService $service)
    {
        $input = $request->validate(['mode' => 'sometimes|required|in:real,synthetic']);
        try {
            return response()->json(['success' => true, 'data' => $service->fetch($input['mode'] ?? 'real')])
                ->header('Cache-Control', 'no-store');
        } catch (\Throwable $e) {
            report($e);
            return response()->json(['success' => false, 'message' => 'Không thể đọc dữ liệu gợi ý từ MongoDB. Vui lòng thử lại.'], 503)
                ->header('Cache-Control', 'no-store');
        }
    }
}
