<?php

namespace App\Http\Controllers\Admin;

use App\Services\Admin\OrderService;

class OrderController extends BaseAdminController
{
    public function __construct()
    {
        parent::__construct(new OrderService());
    }

    public function apiUpdate(\Illuminate\Http\Request $request, string $code)
    {
        try {
            $this->service->update($code, $request->all());
            return response()->json(['success' => true, 'message' => 'Cập nhật trạng thái thành công.', 'data' => $this->service->show($code)]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage(), 'errors' => $e->errors()], 422);
        } catch (\OutOfBoundsException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 404);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (\LogicException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 409);
        } catch (\Throwable $e) {
            report($e);
            return response()->json(['success' => false, 'message' => 'Không thể cập nhật đơn hàng. Vui lòng thử lại.'], 500);
        }
    }

    public function index()
    {
        return view('admin.orders');
    }
}
