<?php

namespace App\Http\Controllers\Admin;

use App\Services\Admin\CustomerService;

class CustomerController extends BaseAdminController
{
    public function __construct()
    {
        parent::__construct(new CustomerService());
    }

    public function resetPassword(\Illuminate\Http\Request $request, string $code)
    {
        $request->validate(['confirmed' => 'required|accepted']);
        $account = $request->attributes->get('account');
        $limitKey = 'customer-password-reset:' . hash('sha256', (string) $account['_id']);
        if (\Illuminate\Support\Facades\RateLimiter::tooManyAttempts($limitKey, 5)) {
            return response()->json(['success' => false, 'message' => 'Bạn đã reset nhiều lần. Vui lòng thử lại sau một phút.'], 429);
        }
        \Illuminate\Support\Facades\RateLimiter::hit($limitKey, 60);
        try {
            $password = $this->service->resetPassword($code);
            return response()->json(['success' => true, 'message' => 'Đã reset mật khẩu. Khách hàng phải đổi mật khẩu khi đăng nhập.',
                'data' => ['temporaryPassword' => $password]], 200,
                ['Cache-Control' => 'no-store, private', 'Pragma' => 'no-cache']);
        } catch (\OutOfBoundsException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 404);
        } catch (\LogicException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 409);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Không thể reset mật khẩu. Vui lòng thử lại.'], 500);
        }
    }

    public function index()
    {
        return view('admin.customers');
    }
}
