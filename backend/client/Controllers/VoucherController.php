<?php
declare(strict_types=1);
namespace Client\Controllers;

use Client\Repositories\PromotionRepository;
use Shared\Helpers\DocumentSerializer;
use Shared\Helpers\Response;

/**
 * VoucherController – Xác thực và lấy danh sách mã khuyến mãi (KhuyenMais)
 */
final class VoucherController
{
    /**
     * POST /api/vouchers/validate
     * Body: { "code": "KM001", "orderTotal": 150000 }
     */
    public function validate(): never
    {
        $body = json_decode(file_get_contents('php://input'), true);

        if (!is_array($body)) {
            $body = [];
        }

        $code = trim(strtoupper($body['code'] ?? ''));
        $orderTotal = (float)($body['orderTotal'] ?? 0);

        if ($code === '') {
            Response::error('Vui lòng cung cấp mã giảm giá.', 400);
        }

        $repo = new PromotionRepository();
        $doc  = $repo->findByCode($code);

        // Alias fallback linh hoạt (KM003 <-> KM03, KM001 <-> KM01, KM002 <-> KM02)
        if ($doc === null) {
            $altCodes = [];
            if (preg_match('/^KM0*(\d+)$/', $code, $m)) {
                $num = (int)$m[1];
                $altCodes[] = sprintf('KM%02d', $num);  // KM01, KM02, KM03
                $altCodes[] = sprintf('KM%03d', $num); // KM001, KM002, KM003
                $altCodes[] = 'KM' . $num;              // KM1, KM2, KM3
            }

            foreach ($altCodes as $alt) {
                if ($alt !== $code) {
                    $doc = $repo->findByCode($alt);
                    if ($doc !== null) {
                        break;
                    }
                }
            }
        }

        if ($doc === null) {
            Response::error('Mã giảm giá không tồn tại.', 404);
        }

        $voucher = DocumentSerializer::document($doc);

        // Kiểm tra trạng thái
        $trangThai = trim($voucher['TrangThai'] ?? '');
        if ($trangThai !== 'Đang hoạt động') {
            Response::error('Mã giảm giá đã hết hiệu lực.', 400);
        }

        // Kiểm tra đơn tối thiểu
        $donToiThieu = (float)($voucher['DonToiThieu'] ?? 0);
        if ($orderTotal < $donToiThieu) {
            $minFormatted = number_format($donToiThieu, 0, ',', '.');
            Response::error(
                "Đơn hàng tối thiểu {$minFormatted} ₫ mới được áp dụng mã này (đơn hiện tại: " . number_format($orderTotal, 0, ',', '.') . " ₫).",
                400
            );
        }

        // Trả về thông tin voucher hợp lệ
        Response::success([
            'MaKM'        => $voucher['MaKM']   ?? $code,
            'TenKM'       => $voucher['TenKM']  ?? '',
            'LoaiKM'      => $voucher['LoaiKM'] ?? 'Tiền',
            'GiaTri'      => (float)($voucher['GiaTri'] ?? 0),
            'DonToiThieu' => $donToiThieu,
            'MoTa'        => $voucher['MoTa'] ?? '',
        ], 'Mã giảm giá hợp lệ.');
    }

    /**
     * GET /api/vouchers/available
     * Lấy danh sách các mã giảm giá đang hoạt động
     */
    public function available(): never
    {
        $repo = new PromotionRepository();
        $docs = $repo->find(['TrangThai' => 'Đang hoạt động']);

        $list = [];
        foreach ($docs as $doc) {
            $v = DocumentSerializer::document($doc);
            $list[] = [
                'MaKM'        => $v['MaKM'] ?? '',
                'TenKM'       => $v['TenKM'] ?? '',
                'LoaiKM'      => $v['LoaiKM'] ?? 'Tiền',
                'GiaTri'      => (float)($v['GiaTri'] ?? 0),
                'DonToiThieu' => (float)($v['DonToiThieu'] ?? 0),
                'MoTa'        => $v['MoTa'] ?? '',
            ];
        }

        Response::success($list);
    }
}
