<?php
declare(strict_types=1);
namespace Admin\Requests;

final class ProductRequest
{
    public static function validate(array $data, bool $isUpdate = false): array
    {
        Validation::required($data, [
            'MaSP' => $isUpdate ? null : 'Mã sản phẩm',
            'TenSP' => 'Tên sản phẩm',
            'MaDM' => 'Mã danh mục'
        ]);

        Validation::nonNegative($data, [
            'SoLuong' => 'Số lượng'
        ]);

        if (isset($data['KichThuoc']) && !is_array($data['KichThuoc'])) {
            throw new \InvalidArgumentException('{"KichThuoc":"Kích thước phải là mảng"}');
        }

        return $data;
    }
}
