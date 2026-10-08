<?php
declare(strict_types=1);
namespace Admin\Requests;

final class OrderRequest
{
    public static function validate(array $data, bool $isUpdate = false): array
    {
        if (!$isUpdate) {
            Validation::required($data, [
                'MaDH' => 'Mã đơn hàng',
                'MaKH' => 'Mã khách hàng'
            ]);
        }

        Validation::nonNegative($data, [
            'TongTienHang' => 'Tổng tiền hàng',
            'GiamGia' => 'Giảm giá',
            'PhiVanChuyen' => 'Phí vận chuyển',
            'TongThanhToan' => 'Tổng thanh toán'
        ]);

        return $data;
    }
}
