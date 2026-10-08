<?php

declare(strict_types=1);

namespace Shared\Helpers;

use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

final class DocumentSerializer
{
    public static function normalize(mixed $value): mixed
    {
        if ($value instanceof ObjectId) {
            return (string) $value;
        }

        if ($value instanceof UTCDateTime) {
            return $value->toDateTime()->format('Y-m-d\TH:i:sP');
        }

        if (is_array($value)) {
            $out = [];
            foreach ($value as $key => $item) {
                $out[$key] = self::normalize($item);
            }
            return $out;
        }

        if (is_object($value) && method_exists($value, 'getArrayCopy')) {
            return self::normalize($value->getArrayCopy());
        }

        return $value;
    }

    public static function document(mixed $document): array
    {
        if ($document === null) {
            return [];
        }

        if (is_object($document) && method_exists($document, 'getArrayCopy')) {
            $document = $document->getArrayCopy();
        }

        return self::normalize((array) $document);
    }
}
