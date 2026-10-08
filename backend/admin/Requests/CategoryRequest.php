<?php
declare(strict_types=1);
namespace Admin\Requests;

final class CategoryRequest
{
    public static function validate(array $data, bool $isUpdate = false): array
    {
        Validation::required($data, [
            'MaDM' => $isUpdate ? null : 'Mã danh mục',
            'TenDM' => 'Tên danh mục'
        ]);

        return $data;
    }
}
