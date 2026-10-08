<?php
declare(strict_types=1);
namespace Admin\Requests;

final class CartRequest
{
    public static function validate(array $data, bool $isUpdate = false): array
    {
        Validation::required($data, [
            'MaKH' => $isUpdate ? null : 'Mã khách hàng'
        ]);

        if (isset($data['SanPhams']) && !is_array($data['SanPhams'])) {
            throw new \InvalidArgumentException('{"SanPhams":"Danh sách sản phẩm phải là mảng"}');
        }

        return $data;
    }
}
