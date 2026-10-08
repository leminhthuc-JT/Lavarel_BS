<?php
declare(strict_types=1);

namespace Client\Controllers;

use Client\Services\FavoriteService;
use Shared\Helpers\Response;

final class FavoriteController
{
    private FavoriteService $service;

    public function __construct()
    {
        $this->service = new FavoriteService();
    }

    public function index(): never
    {
        $maKH = $_GET['maKH'] ?? null;

        if ($maKH === null || $maKH === '') {
            Response::error(
                'Missing maKH',
                400
            );
        }

        $data = $this->service->list(
            (string) $maKH
        );

        Response::success($data);
    }

    public function store(): never
    {
        $payload = json_decode(
            file_get_contents('php://input'),
            true
        );

        if (!is_array($payload)) {
            Response::error(
                'Invalid JSON payload',
                400
            );
        }

        $maKH = $payload['maKH'] ?? null;
        $item = $payload['item'] ?? null;

        if (!$maKH || !$item) {
            Response::error(
                'Missing maKH or item',
                400
            );
        }

        $data = $this->service->add(
            (string) $maKH,
            $item
        );

        Response::success($data);
    }

    public function destroy(
        string $maSP
    ): never {

        $payload = json_decode(
            file_get_contents('php://input'),
            true
        );

        if (!is_array($payload)) {
            Response::error(
                'Invalid JSON payload',
                400
            );
        }

        $maKH = $payload['maKH'] ?? null;

        if (!$maKH || $maSP === '') {
            Response::error(
                'Missing parameters',
                400
            );
        }

        $data = $this->service->remove(
            (string) $maKH,
            $maSP
        );

        Response::success($data);
    }
}
