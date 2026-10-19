<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Repositories\UserRepository;

final class EnsureReviewAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $identity = $request->session()->get('review_user');
        if (!$identity) {
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => 'Vui lòng đăng nhập lại bằng tài khoản quản trị.'], 401)
                : redirect()->route('login');
        }
        try {
            $user = (new UserRepository())->findByEmail($identity['email'] ?? '');
        } catch (\Throwable $e) {
            report($e);
            return response()->json(['success' => false, 'message' => 'Không thể xác minh tài khoản. Vui lòng thử lại.'], 503);
        }
        if (!$user || (string) ($user['_id'] ?? '') !== (string) ($identity['id'] ?? '')
            || ($user['TaiKhoan']['Quyen']['MaQ'] ?? '') !== 'MN'
            || !in_array($user['TrangThai'] ?? '', ['Hoạt động', 'Đang làm việc'], true)) {
            abort(403, 'Chức năng này chỉ dành cho tài khoản quản trị đang hoạt động.');
        }
        $request->attributes->set('review_admin', [
            'MaNV' => (string) ($user['MaNV'] ?? ''), 'HoTen' => (string) ($user['HoTen'] ?? 'Admin'),
        ]);
        return $next($request);
    }
}
