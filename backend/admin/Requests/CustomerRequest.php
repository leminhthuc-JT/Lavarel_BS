<?php
declare(strict_types=1);
namespace Admin\Requests;

final class CustomerRequest
{
    public static function validate(array $data, bool $isUpdate = false): array
    {
        Validation::required($data, [
            'MaKH' => $isUpdate ? null : 'Mã khách hàng',
            'HoTen' => 'Họ tên',
            'Email' => 'Email'
        ]);

        if (isset($data['Email']) && !filter_var($data['Email'], FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException('{"Email":"Email không hợp lệ"}');
        }

        return $data;
    }
}
