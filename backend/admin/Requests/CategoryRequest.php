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

        \Illuminate\Support\Facades\Validator::make($data, [
            'TenDM' => 'required|string|max:200', 'MoTa' => 'nullable|string|max:3000',
        ])->validate();
        return $data;
    }
}
