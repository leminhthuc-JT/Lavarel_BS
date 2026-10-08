<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Services\Client\ProductService;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    protected ProductService $productService;

    public function __construct()
    {
        $this->productService = new ProductService();
    }

    public function menu()
    {
        return view('client.menu');
    }

    public function show($code = null)
    {
        return view('client.details', ['code' => $code]);
    }

    public function apiIndex()
    {
        try {
            $data = $this->productService->list();
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function apiShow(string $code)
    {
        try {
            $data = $this->productService->show($code);
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 404);
        }
    }

    public function toggleReviewLike(Request $request, string $code, string $reviewId)
    {
        $maKH = $request->input('MaKH');
        $liked = (bool) $request->input('liked', false);

        try {
            $result = $this->productService->toggleReviewLike($code, $reviewId, $maKH, $liked);
            return response()->json(['success' => true, 'data' => $result]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }
}
