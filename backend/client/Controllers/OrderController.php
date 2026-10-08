<?php
declare(strict_types=1);
namespace Client\Controllers;

use Client\Services\OrderService;
use Shared\Helpers\Response;

final class OrderController
{
    private OrderService $service;

    public function __construct()
    {
        $this->service = new OrderService();
    }

    /** POST /api/orders */
    public function store(): never
    {
        $payload = json_decode(file_get_contents('php://input'), true);
        $maKH = $payload['maKH'] ?? null;
        $orderData = $payload['order'] ?? null;
        if (!$maKH || !is_array($orderData)) {
            Response::error('Missing maKH or order data', 400);
        }
        $data = $this->service->create($maKH, $orderData);
        Response::success($data);
    }

    /** GET /api/orders/my-orders?maKH=... */
    public function myOrders(): never
    {
        $maKH = $_GET['maKH'] ?? null;
        if ($maKH === null) {
            Response::error('Missing maKH', 400);
        }
        $data = $this->service->myOrders($maKH);
        Response::success($data);
    }

    /** GET /api/orders/{code} */
    public function show(): never
    {
        $matches = [];
        preg_match('#/api/orders/([^/]+)$#', $_SERVER['REQUEST_URI'], $matches);
        $code = $matches[1] ?? null;
        if ($code === null) {
            Response::error('Missing order code', 400);
        }
        $data = $this->service->get($code);
        Response::success($data);
    }

    /** POST /api/orders/{code}/confirm — Khách xác nhận đã nhận hàng */
    public function confirmReceived(): never
    {
        $matches = [];
        preg_match('#/api/orders/([^/]+)/confirm#', $_SERVER['REQUEST_URI'], $matches);
        $code = $matches[1] ?? null;
        if ($code === null) {
            Response::error('Missing order code', 400);
        }
        try {
            $data = $this->service->confirmReceived($code);
            Response::success($data, 'Đã xác nhận nhận hàng');
        } catch (\Throwable $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    /** POST /api/orders/{code}/rating — Gửi đánh giá cho từng sản phẩm (có lọc toxic) */
    public function submitRating(): never
    {
        $matches = [];
        preg_match('#/api/orders/([^/]+)/rating#', $_SERVER['REQUEST_URI'], $matches);
        $code = $matches[1] ?? null;
        if ($code === null) {
            Response::error('Missing order code', 400);
        }
        $payload = json_decode(file_get_contents('php://input'), true) ?? [];
        $maKH    = trim($payload['maKH'] ?? '');

        // Nhận danh sách đánh giá theo sản phẩm: 'reviews' => [ { MaSP, TenSP, SoSao, BinhLuan } ]
        $reviews = $payload['reviews'] ?? [];
        if (!is_array($reviews) || empty($reviews)) {
            // Fallback nếu gửi dạng đơn lẻ
            if (isset($payload['stars'])) {
                $reviews = [[
                    'MaSP'     => $payload['maSP'] ?? '',
                    'TenSP'    => $payload['tenSP'] ?? '',
                    'SoSao'    => (int)($payload['stars'] ?? 5),
                    'BinhLuan' => trim($payload['comment'] ?? ''),
                ]];
            } else {
                Response::error('Không có thông tin đánh giá', 400);
            }
        }

        // Duyệt từng sản phẩm để validate và lọc toxic
        foreach ($reviews as &$item) {
            $stars = (int)($item['SoSao'] ?? 5);
            if ($stars < 1 || $stars > 5) {
                $item['SoSao'] = 5;
            }
            $comment = trim($item['BinhLuan'] ?? '');
            $item['LoaiBL'] = 'Tích cực';

            /* ----- Kiểm tra toxic qua Python Flask ----- */
            if ($comment !== '') {
                $toxicResult = $this->callToxicCheck($comment);
                if ($toxicResult !== null) {
                    $isToxic = !empty($toxicResult['is_toxic']) || (($toxicResult['toxic'] ?? 0) >= 0.5);
                    if ($isToxic) {
                        $pct = round(($toxicResult['toxic'] ?? 0) * 100);
                        $productName = !empty($item['TenSP']) ? " của sản phẩm \"{$item['TenSP']}\"" : "";
                        Response::error(
                            "Bình luận{$productName} bị chặn vì chứa nội dung không phù hợp (điểm toxic: {$pct}%). Vui lòng chỉnh sửa lại.",
                            422
                        );
                    }
                    $item['LoaiBL'] = $toxicResult['LoaiBL'] ?? 'Tích cực';
                }
            }
        }
        unset($item);

        try {
            $data = $this->service->submitRating($code, $reviews, $maKH);
            Response::success($data, 'Đánh giá đã được ghi nhận');
        } catch (\Throwable $e) {
            Response::error($e->getMessage(), 400);
        }
    }


    /** Gọi Flask toxic classifier tại 127.0.0.1:5000/predict */
    private function callToxicCheck(string $text): ?array
    {
        $ch = curl_init('http://127.0.0.1:5000/predict');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS     => json_encode(['text' => $text]),
            CURLOPT_TIMEOUT        => 5,
        ]);
        $raw    = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if (!$raw || $status !== 200) return null;
        $result = json_decode($raw, true);
        return is_array($result) ? $result : null;
    }
}

