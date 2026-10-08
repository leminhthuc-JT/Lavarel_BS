<?php
declare(strict_types=1);
namespace Client\Controllers;

use Client\Services\CartService;
use Shared\Helpers\Response;

final class CartController
{
    private CartService $service;

    public function __construct()
    {
        $this->service = new CartService();
    }

    /** GET /api/cart?maKH=... */
    public function index(): never
    {
        $maKH = $_GET['maKH'] ?? null;
        if ($maKH === null) {
            Response::error('Missing maKH', 400);
        }
        $data = $this->service->getByCustomer((string)$maKH);
        Response::success($data);
    }

    /** POST /api/cart */
    public function store(): never
    {
        $payload = json_decode(file_get_contents('php://input'), true);
        $maKH = $payload['maKH'] ?? null;
        $item = $payload['item'] ?? null;
        if (!$maKH || !$item) {
            Response::error('Missing maKH or item', 400);
        }
        $data = $this->service->upsertItem((string)$maKH, (array)$item);
        Response::success($data);
    }

    /** POST /api/cart/sync */
    public function sync(): never
    {
        $payload = json_decode(file_get_contents('php://input'), true);
        $maKH = $payload['maKH'] ?? null;
        $cart = $payload['cart'] ?? [];
        if (!$maKH || !is_array($cart)) {
            Response::error('Missing maKH or cart list', 400);
        }
        $data = $this->service->syncCart((string)$maKH, $cart);
        Response::success($data);
    }

    /** PUT /api/cart/{code} */
    public function update(): never
    {
        $matches = [];
        preg_match('#/api/cart/([^/]+)$#', $_SERVER['REQUEST_URI'], $matches);
        $code = $matches[1] ?? null;
        $payload = json_decode(file_get_contents('php://input'), true);
        $maKH = $payload['maKH'] ?? null;
        $soLuong = $payload['soLuong'] ?? null;
        $chon = isset($payload['chon']) ? (bool)$payload['chon'] : null;
        if (!$maKH || $code === null || $soLuong === null) {
            Response::error('Missing parameters', 400);
        }
        $data = $this->service->updateItem((string)$maKH, (string)$code, (int)$soLuong, $chon);
        Response::success($data);
    }

    /** DELETE /api/cart/{code} */
    public function destroy(): never
    {
        $matches = [];
        preg_match('#/api/cart/([^/]+)$#', $_SERVER['REQUEST_URI'], $matches);
        $code = $matches[1] ?? null;
        $payload = json_decode(file_get_contents('php://input'), true);
        $maKH = $payload['maKH'] ?? null;
        if (!$maKH || $code === null) {
            Response::error('Missing parameters', 400);
        }
        $data = $this->service->removeItem((string)$maKH, (string)$code);
        Response::success($data);
    }
}
