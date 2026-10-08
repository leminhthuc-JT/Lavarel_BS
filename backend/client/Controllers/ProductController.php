<?php
declare(strict_types=1);
namespace Client\Controllers;

use Client\Services\ProductService;
use Shared\Helpers\Response;

final class ProductController
{
    public function index(): never
    {
        Response::success((new ProductService())->list());
    }

    public function show(string $code): never
    {
        try {
            Response::success((new ProductService())->show($code));
        } catch (\Throwable $e) {
            Response::error($e->getMessage(), 404);
        }
    }

    public function toggleReviewLike(string $code, string $reviewId): never
    {
        $payload = json_decode(file_get_contents('php://input'), true) ?? [];
        $maKH = $payload['MaKH'] ?? null;
        $liked = $payload['liked'] ?? false;

        try {
            $result = (new ProductService())->toggleReviewLike($code, $reviewId, $maKH, $liked);
            Response::success($result);
        } catch (\Throwable $e) {
            Response::error($e->getMessage(), 400);
        }
    }
}
