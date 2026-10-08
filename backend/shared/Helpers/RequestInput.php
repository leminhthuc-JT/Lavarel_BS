<?php

declare(strict_types=1);

namespace Shared\Helpers;

final class RequestInput
{
    public static function json(): array
    {
        $raw = file_get_contents('php://input');

        if ($raw === false || trim($raw) === '') {
            return [];
        }

        $data = json_decode($raw, true);

        if (!is_array($data)) {
            throw new \InvalidArgumentException('JSON body không hợp lệ');
        }

        return $data;
    }
}
