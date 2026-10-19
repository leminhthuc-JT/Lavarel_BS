<?php
declare(strict_types=1);
namespace Admin\Requests;

final class PromotionRequest
{
    public static function validate(array $data, bool $isUpdate = false): array
    {
        Validation::required($data, [
            'MaKM' => $isUpdate ? null : 'Mã khuyến mãi',
            'TenKM' => 'Tên khuyến mãi',
            'LoaiKM' => 'Loại khuyến mãi',
            'GiaTri' => 'Giá trị',
            'NgayBatDau' => 'Ngày bắt đầu',
            'NgayKetThuc' => 'Ngày kết thúc'
        ]);

        Validation::nonNegative($data, [
            'GiaTri' => 'Giá trị',
            'GiaTriToiDa' => 'Giá trị tối đa',
            'DonToiThieu' => 'Đơn tối thiểu',
            'SoLuong' => 'Số lượng'
        ]);

        if (($data['LoaiKM'] ?? '') === 'Phần trăm' && (float) ($data['GiaTri'] ?? 0) > 100) {
            throw new \InvalidArgumentException('{"GiaTri":"Khuyến mãi phần trăm không được vượt quá 100%"}');
        }

        \Illuminate\Support\Facades\Validator::make($data, [
            'TenKM' => 'required|string|max:200', 'MoTa' => 'nullable|string|max:3000',
            'TrangThai' => 'required|in:Đang hoạt động,Ngừng hoạt động',
            'LoaiKM' => 'required|in:Tiền,Phần trăm',
            'NgayBatDau' => 'required|date', 'NgayKetThuc' => 'required|date|after_or_equal:NgayBatDau',
            'SoLuong' => 'nullable|integer|min:0',
        ])->validate();
        return $data;
    }
}
