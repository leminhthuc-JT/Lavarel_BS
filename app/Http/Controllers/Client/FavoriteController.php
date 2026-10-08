<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Services\Client\FavoriteService;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    protected FavoriteService $favoriteService;

    public function __construct()
    {
        $this->favoriteService = new FavoriteService();
    }

    public function index()
    {
        return view('client.like');
    }

    public function apiIndex(Request $request)
    {
        try {
            $maKH = $request->query('maKH', '');
            if (!$maKH) {
                return response()->json(['success' => true, 'data' => []]);
            }
            $data = $this->favoriteService->list((string)$maKH);
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function apiStore(Request $request)
    {
        try {
            $maKH = $request->input('maKH', '');
            $item = $request->input('item', []);
            $data = $this->favoriteService->add((string)$maKH, (array)$item);
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function apiDestroy(Request $request, string $maSP)
    {
        try {
            $maKH = $request->input('maKH', '');
            $data = $this->favoriteService->remove((string)$maKH, $maSP);
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }
}
