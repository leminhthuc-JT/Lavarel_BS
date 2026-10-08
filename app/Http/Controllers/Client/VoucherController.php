<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Repositories\Client\PromotionRepository;
use App\Helpers\DocumentSerializer;
use Illuminate\Http\Request;

class VoucherController extends Controller
{
    public function available()
    {
        try {
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

            return response()->json(['success' => true, 'data' => $list]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function validateVoucher(Request $request)
    {
        try {
            $code = trim(strtoupper($request->input('code', '')));
            $orderTotal = (float)$request->input('orderTotal', $request->input('total', 0));

            if ($code === '') {
                return response()->json(['success' => false, 'message' => 'Vui lòng cung cấp mã giảm giá.'], 400);
            }

            $repo = new PromotionRepository();
            $doc  = $repo->findByCode($code);

            if ($doc === null) {
                $altCodes = [];
                if (preg_match('/^KM0*(\d+)$/', $code, $m)) {
                    $num = (int)$m[1];
                    $altCodes[] = sprintf('KM%02d', $num);
                    $altCodes[] = sprintf('KM%03d', $num);
                    $altCodes[] = 'KM' . $num;
                }

                foreach ($altCodes as $alt) {
                    if ($alt !== $code) {
                        $doc = $repo->findByCode($alt);
                        if ($doc !== null) break;
                    }
                }
            }

            if ($doc === null) {
                return response()->json(['success' => false, 'message' => 'Mã giảm giá không tồn tại.'], 404);
            }

            $voucher = DocumentSerializer::document($doc);

            $trangThai = trim($voucher['TrangThai'] ?? '');
            if ($trangThai !== 'Đang hoạt động') {
                return response()->json(['success' => false, 'message' => 'Mã giảm giá đã hết hiệu lực.'], 400);
            }

            $donToiThieu = (float)($voucher['DonToiThieu'] ?? 0);
            if ($orderTotal < $donToiThieu) {
                $minFormatted = number_format($donToiThieu, 0, ',', '.');
                return response()->json([
                    'success' => false,
                    'message' => "Đơn hàng tối thiểu {$minFormatted} ₫ mới được áp dụng mã này."
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => 'Mã giảm giá hợp lệ.',
                'data' => [
                    'MaKM'        => $voucher['MaKM']   ?? $code,
                    'TenKM'       => $voucher['TenKM']  ?? '',
                    'LoaiKM'      => $voucher['LoaiKM'] ?? 'Tiền',
                    'GiaTri'      => (float)($voucher['GiaTri'] ?? 0),
                    'DonToiThieu' => $donToiThieu,
                    'MoTa'        => $voucher['MoTa'] ?? '',
                ]
            ]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }
}
