<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Repositories\UserRepository;

final class EnsureAccount
{
    public function handle(Request $request, Closure $next, string $required = 'optional')
    {
        $privateApi = $request->is('api/account', 'api/customers/*', 'api/cart', 'api/cart/*', 'api/orders', 'api/orders/*', 'api/favorites', 'api/favorites/*')
            || ($request->is('api/products/*') && !$request->isMethod('GET'));
        if ($privateApi && $required === 'optional') $required = 'user';
        $identity = $request->session()->get('review_user');
        $user = $request->attributes->get('account');
        if ($identity && !$user) {
            try {
                $user = (new UserRepository())->findByEmail($identity['email'] ?? '');
            } catch (\Throwable $e) {
                report($e);
                return response()->json(['success' => false, 'message' => 'Không thể xác minh tài khoản.'], 503);
            }
            if (!$user || (string) $user['_id'] !== (string) ($identity['id'] ?? '')
                || !in_array($user['TrangThai'] ?? '', ['Hoạt động', 'Đang làm việc'], true)) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
                return response()->json(['success' => false, 'message' => 'Tài khoản không hoạt động. Vui lòng đăng nhập lại.'], 401);
            }
            $request->attributes->set('account', $user);
        }
        if (!$user && $required !== 'optional') {
            return $request->is('api/*') || $request->expectsJson()
                ? response()->json(['success' => false, 'message' => 'Vui lòng đăng nhập.'], 401)
                : redirect()->route('login');
        }
        if ($required === 'admin' && ($user['TaiKhoan']['Quyen']['MaQ'] ?? '') !== 'MN') {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền quản trị.'], 403);
        }
        if ($privateApi && $user) {
            $code = (string) ($user['MaKH'] ?? '');
            foreach (['maKH', 'MaKH'] as $key) {
                if ($request->has($key) && (string) $request->input($key) !== $code) {
                    return response()->json(['success' => false, 'message' => 'Không được truy cập dữ liệu tài khoản khác.'], 403);
                }
            }
            if ($request->is('api/orders/*') && $request->route('code')) {
                $order = (new \App\Repositories\Client\OrderRepository())->findByCode($request->route('code'));
                if (!$order || ($order['MaKH'] ?? '') !== $code) abort(403);
            }
            $request->merge(['maKH' => $code, 'MaKH' => $code]);
        }
        return $next($request);
    }
}
