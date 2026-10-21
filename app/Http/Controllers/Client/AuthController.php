<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Services\Client\AuthService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    protected AuthService $authService;

    public function __construct()
    {
        $this->authService = new AuthService();
    }

    private function rememberReviewUser(Request $request, array $user): void
    {
        if (!$request->hasSession()) return;
        $request->session()->regenerate();
        $request->session()->put('review_user', [
            'id' => $user['id'] ?? '', 'email' => $user['email'] ?? '',
            'password_version' => (int) ($user['sessionVersion'] ?? 0),
        ]);
    }

    public function logout(Request $request)
    {
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return response()->json(['success' => true]);
    }

    public function showLogin()
    {
        return view('auth.login');
    }

    public function showRegister()
    {
        return view('auth.register');
    }

    public function showForgotPassword()
    {
        return view('auth.forgot-password');
    }

    public function showResetPassword()
    {
        return view('auth.reset-password');
    }

    public function login(Request $request)
    {
        try {
            $user = $this->authService->login([
                'email' => trim((string) ($request->input('email') ?? '')),
                'password' => (string) ($request->input('password') ?? ''),
            ]);
            $this->rememberReviewUser($request, $user);
            return response()->json([
                'success' => true,
                'message' => 'Đăng nhập thành công.',
                'user' => $user
            ]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function register(Request $request)
    {
        try {
            $user = $this->authService->register($request->all());
            $this->rememberReviewUser($request, $user);
            return response()->json([
                'success' => true,
                'message' => 'Đăng ký thành công.',
                'user' => $user
            ], 201);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function googleLogin(Request $request)
    {
        try {
            $credential = $request->input('credential', '');
            if (!$credential) {
                throw new \Exception('Thiếu thông tin đăng nhập Google.');
            }
            $user = $this->authService->googleLogin($credential);
            $this->rememberReviewUser($request, $user);
            return response()->json([
                'success' => true,
                'message' => 'Đăng nhập Google thành công.',
                'user' => $user
            ]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function forgotPassword(Request $request)
    {
        try {
            $email = trim($request->input('email', ''));
            if (!$email) {
                throw new \Exception('Vui lòng nhập email.');
            }
            $result = $this->authService->forgotPassword($email);
            $message = is_array($result) ? ($result['message'] ?? 'Đã gửi yêu cầu đặt lại mật khẩu.') : (string) $result;
            return response()->json(['success' => true, 'message' => $message]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function resetPassword(Request $request)
    {
        try {
            $token = trim($request->input('token', ''));
            $password = $request->input('password', '');
            $confirmPassword = $request->input('confirmPassword', '');

            if (!$token) throw new \Exception('Token đặt lại mật khẩu không hợp lệ.');
            if (!$password) throw new \Exception('Vui lòng nhập mật khẩu mới.');
            if ($password !== $confirmPassword) throw new \Exception('Mật khẩu xác nhận không khớp.');
            if (strlen($password) < 6) throw new \Exception('Mật khẩu phải có ít nhất 6 ký tự.');

            $result = $this->authService->resetPassword($token, $password, $confirmPassword);
            $message = is_array($result) ? ($result['message'] ?? 'Đặt lại mật khẩu thành công.') : (string) $result;
            return response()->json(['success' => true, 'message' => $message]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function changePassword(Request $request)
    {
        $account = $request->attributes->get('account');
        if (!$account) return response()->json(['success' => false, 'message' => 'Vui lòng đăng nhập.'], 401);
        try {
            $email = (string) ($account['TaiKhoan']['Email'] ?? $account['Email'] ?? '');
            $currentPassword = (string) ($request->input('currentPassword') ?? '');
            $newPassword = (string) ($request->input('newPassword') ?? '');
            $confirmPassword = (string) ($request->input('confirmPassword') ?? '');

            $result = $this->authService->changePassword($email, $currentPassword, $newPassword, $confirmPassword);
            $this->rememberReviewUser($request, ['id' => (string) $account['_id'], 'email' => $email, 'sessionVersion' => (int) ($account['TaiKhoan']['SessionVersion'] ?? 0) + 1]);
            return response()->json(['success' => true, 'message' => $result['message'] ?? 'Đổi mật khẩu thành công.']);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }
}
