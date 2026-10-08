<?php

declare(strict_types=1);

namespace Shared\Helpers;

use MongoDB\BSON\UTCDateTime;

final class MongoValue
{
    public static function date(?string $value): ?UTCDateTime
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        $timestamp = strtotime($value);

        if ($timestamp === false) {
            throw new \InvalidArgumentException("Ngày không hợp lệ: {$value}");
        }

        return new UTCDateTime($timestamp * 1000);
    }
}
