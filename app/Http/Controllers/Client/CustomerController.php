<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Services\Client\CustomerService;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    protected CustomerService $customerService;

    public function __construct()
    {
        $this->customerService = new CustomerService();
    }

    public function info()
    {
        return view('client.info');
    }

    public function apiShow(Request $request, string $code)
    {
        $account = $request->attributes->get('account');
        if (!$account) abort(401);
        if (($account['MaKH'] ?? '') !== $code) abort(403);
        try {
            $data = $this->customerService->show($code);
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 404);
        }
    }

    public function me(Request $request)
    {
        $account = $request->attributes->get('account');
        if (!$account) abort(401);
        $data = \App\Helpers\DocumentSerializer::document($account);
        unset($data['TaiKhoan']['MatKhau'], $data['resetPasswordToken'], $data['resetPasswordExpiresAt']);
        return response()->json(['success' => true, 'data' => $data]);
    }

    public function updateMe(Request $request)
    {
        $account = $request->attributes->get('account');
        if (!$account) abort(401);
        $data = $request->validate([
            'HoTen' => 'required|string|max:150', 'SDT' => 'nullable|regex:/^[0-9+ .()-]{9,20}$/',
            'NgaySinh' => 'nullable|date|before_or_equal:today',
            'GioiTinh' => 'nullable|in:Nam,Nữ,Khác', 'DiaChi' => 'nullable|string|max:500',
        ]);
        if (!empty($data['NgaySinh'])) $data['NgaySinh'] = \App\Helpers\MongoValue::date($data['NgaySinh']);
        (new \App\Repositories\UserRepository())->updateProfile($account['_id'], $data);
        return response()->json(['success' => true, 'message' => 'Đã cập nhật thông tin.']);
    }
}
