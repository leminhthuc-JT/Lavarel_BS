<?php

namespace App\Http\Controllers\Admin;

use App\Services\Admin\PromotionService;
use Illuminate\Http\Request;

class PromotionController extends BaseAdminController
{
    public function __construct()
    {
        parent::__construct(new PromotionService());
    }

    public function apiUpdateStatus(Request $request, string $code)
    {
        $data = $request->validate([
            'TrangThai' => 'required|string|in:Đang hoạt động,Ngừng hoạt động',
        ]);

        try {
            $this->service->updateStatus($code, $data['TrangThai']);
            return response()->json([
                'success' => true,
                'message' => 'Cập nhật trạng thái thành công.',
                'data' => ['MaKM' => $code, 'TrangThai' => $data['TrangThai']],
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (\OutOfBoundsException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 404);
        } catch (\Throwable $e) {
            report($e);
            return response()->json([
                'success' => false,
                'message' => 'Không thể lưu trạng thái khuyến mãi. Vui lòng thử lại.',
            ], 500);
        }
    }

    public function index()
    {
        return view('admin.promotions');
    }
}
