<?php

declare(strict_types=1);

namespace Shared\Helpers;

final class Response
{
    public static function json(array $payload, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function success(
        mixed $data = null,
        string $message = 'Thành công',
        int $status = 200
    ): never {
        self::json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], $status);
    }

    public static function error(
        string $message,
        int $status = 400,
        mixed $errors = null
    ): never {
        self::json([
            'success' => false,
            'message' => $message,
            'errors' => $errors
        ], $status);
    }
}
