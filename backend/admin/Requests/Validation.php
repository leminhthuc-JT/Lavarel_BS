<?php

declare(strict_types=1);

namespace Admin\Requests;

final class Validation
{
    public static function required(array $data, array $fields): void
    {
        $errors = [];

        foreach ($fields as $field => $label) {
            if ($label === null) {
                continue;
            }

            if (!isset($data[$field]) || trim((string) $data[$field]) === '') {
                $errors[$field] = "{$label} không được để trống";
            }
        }

        if ($errors !== []) {
            throw new \InvalidArgumentException(
                json_encode($errors, JSON_UNESCAPED_UNICODE)
            );
        }
    }

    public static function nonNegative(array $data, array $fields): void
    {
        $errors = [];

        foreach ($fields as $field => $label) {
            if (isset($data[$field]) && (!is_numeric($data[$field]) || $data[$field] < 0)) {
                $errors[$field] = "{$label} phải là số không âm";
            }
        }

        if ($errors !== []) {
            throw new \InvalidArgumentException(
                json_encode($errors, JSON_UNESCAPED_UNICODE)
            );
        }
    }
}
