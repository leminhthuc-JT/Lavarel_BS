<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Services\Client\CartService;
use Illuminate\Http\Request;

class CartController extends Controller
{
    protected CartService $cartService;

    public function __construct()
    {
        $this->cartService = new CartService();
    }

    public function index()
    {
        return view('client.cart');
    }

    public function apiIndex(Request $request)
    {
        try {
            $maKH = $request->query('maKH', '');
            if (!$maKH) {
                return response()->json(['success' => true, 'data' => []]);
            }
            $data = $this->cartService->getByCustomer((string)$maKH);
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function apiSync(Request $request)
    {
        try {
            $maKH = $request->input('maKH', '');
            $cart = $request->input('cart', []);
            $data = $this->cartService->syncCart((string)$maKH, (array)$cart);
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
            $data = $this->cartService->upsertItem((string)$maKH, (array)$item);
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function apiUpdate(Request $request, string $code)
    {
        try {
            $maKH = $request->input('maKH', '');
            $soLuong = (int) $request->input('soLuong', 1);
            $chon = $request->has('chon') ? (bool) $request->input('chon') : null;
            $data = $this->cartService->updateItem((string)$maKH, $code, $soLuong, $chon);
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function apiDestroy(Request $request, string $code)
    {
        try {
            $maKH = $request->input('maKH', '');
            $data = $this->cartService->removeItem((string)$maKH, $code);
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }
}
