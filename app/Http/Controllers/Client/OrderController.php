<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Services\Client\OrderService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    protected OrderService $orderService;

    public function __construct()
    {
        $this->orderService = new OrderService();
    }

    public function index()
    {
        return view('client.orders');
    }

    public function payment()
    {
        return view('client.payment');
    }

    public function addRating()
    {
        return view('client.add_rating');
    }

    public function apiStore(Request $request)
    {
        try {
            $maKH = $request->input('maKH', '');
            $orderData = $request->input('order', $request->all());
            if (!$maKH || !is_array($orderData)) {
                return response()->json(['success' => false, 'message' => 'Thiếu maKH hoặc dữ liệu đơn hàng'], 400);
            }
            $data = $this->orderService->create((string)$maKH, (array)$orderData);
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function apiMyOrders(Request $request)
    {
        try {
            $maKH = (string)$request->query('maKH', '');
            if (!$maKH) {
                return response()->json(['success' => false, 'message' => 'Thiếu maKH'], 400);
            }
            $data = $this->orderService->myOrders($maKH);
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function apiShow(string $code)
    {
        try {
            $data = $this->orderService->get($code);
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 404);
        }
    }

    public function apiConfirmReceived(string $code)
    {
        try {
            $data = $this->orderService->confirmReceived($code);
            return response()->json(['success' => true, 'message' => 'Đã xác nhận nhận hàng', 'data' => $data]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function apiSubmitRating(Request $request, string $code)
    {
        try {
            $payload = $request->all();
            $maKH = trim((string)($payload['maKH'] ?? ''));
            $reviews = $payload['reviews'] ?? [];

            if (!is_array($reviews) || empty($reviews)) {
                if (isset($payload['stars'])) {
                    $reviews = [[
                        'MaSP'     => $payload['maSP'] ?? '',
                        'TenSP'    => $payload['tenSP'] ?? '',
                        'SoSao'    => (int)($payload['stars'] ?? 5),
                        'BinhLuan' => trim($payload['comment'] ?? ''),
                    ]];
                } else {
                    return response()->json(['success' => false, 'message' => 'Không có thông tin đánh giá'], 400);
                }
            }

            foreach ($reviews as &$item) {
                $stars = (int)($item['SoSao'] ?? 5);
                if ($stars < 1 || $stars > 5) {
                    $item['SoSao'] = 5;
                }
                $comment = trim($item['BinhLuan'] ?? '');
                $item['LoaiBL'] = $item['LoaiBL'] ?? 'Tích cực';

                /* ----- Kiểm tra toxic qua Python Flask ----- */
                if ($comment !== '') {
                    $toxicResult = $this->callToxicCheck($comment);
                    if ($toxicResult !== null) {
                        $isToxic = !empty($toxicResult['is_toxic']) || (($toxicResult['toxic'] ?? 0) >= 0.5);
                        if ($isToxic) {
                            $pct = round(($toxicResult['toxic'] ?? 0) * 100);
                            $productName = !empty($item['TenSP']) ? " của sản phẩm \"{$item['TenSP']}\"" : "";
                            return response()->json([
                                'success' => false,
                                'message' => "Bình luận{$productName} bị chặn vì chứa nội dung không phù hợp (điểm toxic: {$pct}%). Vui lòng chỉnh sửa lại."
                            ], 422);
                        }
                        $item['LoaiBL'] = $toxicResult['LoaiBL'] ?? ($item['LoaiBL'] ?? 'Tích cực');
                    }
                }
            }
            unset($item);

            $data = $this->orderService->submitRating($code, $reviews, $maKH);
            return response()->json(['success' => true, 'message' => 'Đánh giá đã được ghi nhận', 'data' => $data]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    /** Gọi Flask toxic classifier tại 127.0.0.1:5000/predict */
    private function callToxicCheck(string $text): ?array
    {
        $ch = curl_init('http://127.0.0.1:5000/predict');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json; charset=utf-8'],
            CURLOPT_POSTFIELDS     => json_encode(['text' => $text], JSON_UNESCAPED_UNICODE),
            CURLOPT_TIMEOUT        => 3,
        ]);
        $raw    = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if (!$raw || $status !== 200) return null;
        $result = json_decode($raw, true);
        return is_array($result) ? $result : null;
    }
}
