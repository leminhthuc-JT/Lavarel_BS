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
        \Illuminate\Support\Facades\Validator::make($data, [
            'TenSP' => 'required|string|max:200', 'MaDM' => 'required|string|max:50',
            'MoTa' => 'nullable|string|max:10000', 'TrangThai' => 'required|in:Đang bán,Ngừng bán,Hết hàng',
            'MaSP' => $isUpdate ? 'sometimes|regex:/^[A-Za-z0-9_-]+$/' : 'required|regex:/^[A-Za-z0-9_-]+$/',
            'SoLuong' => 'required|integer|min:0', 'KichThuoc' => 'required|array|min:1',
            'KichThuoc.*.Ten' => 'required|string|max:100', 'KichThuoc.*.Gia' => 'required|numeric|min:0',
        ])->validate();
        if (!(new \App\Repositories\Admin\CategoryRepository())->existsByCode(strtoupper(trim($data['MaDM'])))) {
            throw new \InvalidArgumentException('Danh mục không tồn tại.');
        }

        if (isset($data['KichThuoc']) && !is_array($data['KichThuoc'])) {
            throw new \InvalidArgumentException('{"KichThuoc":"Kích thước phải là mảng"}');
        }

        return $data;
    }
}
