<?php

namespace App\Services\Client;

use App\Repositories\UserRepository;
use App\Services\Client\MailService;
use MongoDB\BSON\UTCDateTime;
use Exception;
use Throwable;
use Google\Client as GoogleClient;

class AuthService
{
    private UserRepository $userRepository;
    private MailService $mailService;

    public function __construct()
    {
        $this->userRepository = new UserRepository();
        $this->mailService = new MailService();
    }

    public function register(array $data): array
    {
        $fullName = trim($data['fullName'] ?? '');
        $email = strtolower(trim($data['email'] ?? ''));
        $password = $data['password'] ?? '';

        if ($fullName === '') throw new Exception('Vui lòng nhập họ tên.');
        if ($email === '') throw new Exception('Vui lòng nhập email.');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) throw new Exception('Email không hợp lệ.');
        if ($password === '') throw new Exception('Vui lòng nhập mật khẩu.');
        if (strlen($password) < 6) throw new Exception('Mật khẩu phải có ít nhất 6 ký tự.');

        $existingUser = $this->userRepository->findByEmail($email);
        if ($existingUser) {
            throw new Exception('Email này đã được đăng ký.');
        }

        $maKH = $this->userRepository->generateNextMaKH();
        $maKHNumber = (int) substr($maKH, 2);
        $maTK = 'TK' . $maKHNumber;

        $user = [
            'MaKH' => $maKH,
            'HoTen' => $fullName,
            'Email' => $email,
            'TaiKhoan' => [
                'MaTK' => $maTK,
                'Email' => $email,
                'MatKhau' => password_hash($password, PASSWORD_DEFAULT),
                'Quyen' => [
                    'MaQ' => 'KH',
                    'TenQ' => 'Khách hàng'
                ]
            ],
            'TrangThai' => 'Hoạt động',
            'NgayDangKy' => new UTCDateTime()
        ];
        $id = $this->userRepository->create($user);

        return [
            'id' => (string) $id,
            'MaKH' => $maKH,
            'fullName' => $fullName,
            'email' => $email,
            'role' => 'KH',
            'roleName' => 'Khách hàng'
        ];
    }

    public function login(array $data): array
    {
        $email = strtolower(trim((string)($data['email'] ?? '')));
        $password = (string)($data['password'] ?? '');

        if ($email === '') throw new Exception('Vui lòng nhập email.');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) throw new Exception('Email không hợp lệ.');

        $user = $this->userRepository->findByEmail($email);
        if (!$user) {
            throw new Exception('Email hoặc mật khẩu không chính xác.');
        }

        $hashedPassword = $user['TaiKhoan']['MatKhau'] ?? null;

        // Nếu tài khoản không có mật khẩu (hoặc để trống): cho phép đăng nhập
        if (empty($hashedPassword)) {
            // Cho phép đăng nhập
        } else {
            if ($password === '' || !password_verify($password, $hashedPassword)) {
                throw new Exception('Email hoặc mật khẩu không chính xác.');
            }
        }

        $status = $user['TrangThai'] ?? '';
        if (!in_array($status, ['Hoạt động', 'Đang làm việc'], true)) {
            throw new Exception('Tài khoản của bạn hiện không hoạt động.');
        }

        return $this->formatUser($user);
    }

    public function googleLogin(string $credential): array
    {
        if (trim($credential) === '') {
            throw new Exception('Thông tin đăng nhập Google không hợp lệ.');
        }

        $clientId = env('GOOGLE_CLIENT_ID');
        if (!$clientId) {
            throw new Exception('Google Client ID chưa được cấu hình.');
        }

        try {
            $client = new GoogleClient(['client_id' => $clientId]);
            $payload = $client->verifyIdToken($credential);
            if (!$payload) {
                throw new Exception('verifyIdToken() thất bại.');
            }
        } catch (Throwable $e) {
            throw new Exception('Không thể xác thực Google: ' . $e->getMessage());
        }

        if (empty($payload['email']) || empty($payload['sub'])) {
            throw new Exception('Google không cung cấp đủ thông tin tài khoản.');
        }

        $email = strtolower(trim($payload['email']));
        $googleId = (string) $payload['sub'];
        $fullName = trim($payload['name'] ?? 'Khách hàng');
        $avatar = $payload['picture'] ?? null;

        $user = $this->userRepository->findByEmail($email);
        if ($user) {
            $status = $user['TrangThai'] ?? '';
            if (!in_array($status, ['Hoạt động', 'Đang làm việc'], true)) {
                throw new Exception('Tài khoản của bạn hiện không hoạt động.');
            }
            if (empty($user['googleId']) || (string) $user['googleId'] !== $googleId) {
                $this->userRepository->attachGoogleAccount($user['_id'], $googleId, $avatar);
                $user['googleId'] = $googleId;
                if ($avatar) $user['Avatar'] = $avatar;
            }
            return $this->formatUser($user, $avatar);
        }

        $maKH = $this->userRepository->generateNextMaKH();
        $maKHNumber = (int) substr($maKH, 2);
        $maTK = 'TK' . $maKHNumber;

        $newUser = [
            'MaKH' => $maKH,
            'HoTen' => $fullName,
            'Email' => $email,
            'TaiKhoan' => [
                'MaTK' => $maTK,
                'Email' => $email,
                'MatKhau' => null,
                'Quyen' => ['MaQ' => 'KH', 'TenQ' => 'Khách hàng']
            ],
            'TrangThai' => 'Hoạt động',
            'NgayDangKy' => new UTCDateTime(),
            'googleId' => $googleId
        ];
        if ($avatar) $newUser['Avatar'] = $avatar;

        $id = $this->userRepository->create($newUser);

        return [
            'id' => (string) $id,
            'MaKH' => $maKH,
            'MaTK' => $maTK,
            'fullName' => $fullName,
            'email' => $email,
            'role' => 'KH',
            'roleName' => 'Khách hàng',
            'avatar' => $avatar
        ];
    }

    public function forgotPassword(string $email): array
    {
        $email = strtolower(trim($email));
        if ($email === '') throw new Exception('Vui lòng nhập email.');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) throw new Exception('Email không hợp lệ.');

        $user = $this->userRepository->findByEmail($email);
        if (!$user) {
            return ['message' => 'Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi.'];
        }

        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        $expiresAt = new UTCDateTime((time() + 15 * 60) * 1000);

        $this->userRepository->setResetPasswordToken($user['_id'], $tokenHash, $expiresAt);

        $resetUrl = route('reset-password') . '?token=' . urlencode($token);
        $accountEmail = $user['TaiKhoan']['Email'] ?? $email;

        $this->mailService->sendResetPasswordEmail($accountEmail, $user['HoTen'] ?? 'Khách hàng', $resetUrl);

        return ['message' => 'Đã gửi liên kết đặt lại mật khẩu đến email của bạn.'];
    }

    public function resetPassword(string $token, string $password, string $confirmPassword): array
    {
        $token = trim($token);
        if (!$token) throw new Exception('Token không hợp lệ.');
        if (!$password) throw new Exception('Vui lòng nhập mật khẩu mới.');
        if ($password !== $confirmPassword) throw new Exception('Mật khẩu xác nhận không khớp.');
        if (strlen($password) < 6) throw new Exception('Mật khẩu phải có ít nhất 6 ký tự.');

        $tokenHash = hash('sha256', $token);
        $user = $this->userRepository->findByResetToken($tokenHash);
        if (!$user) {
            throw new Exception('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $this->userRepository->updatePassword($user['_id'], $hashedPassword);

        return ['message' => 'Đặt lại mật khẩu thành công.'];
    }

    public function changePassword(string $email, ?string $currentPassword = '', ?string $newPassword = '', ?string $confirmPassword = ''): array
    {
        $email = strtolower(trim($email));
        $currentPassword = trim((string)($currentPassword ?? ''));
        $newPassword = trim((string)($newPassword ?? ''));
        $confirmPassword = trim((string)($confirmPassword ?? ''));

        if (!$email) throw new Exception('Email không hợp lệ.');

        $user = $this->userRepository->findByEmail($email);
        if (!$user) throw new Exception('Tài khoản không tồn tại.');

        $status = $user['TrangThai'] ?? '';
        if (!in_array($status, ['Hoạt động', 'Đang làm việc'], true)) {
            throw new Exception('Tài khoản của bạn hiện không hoạt động.');
        }

        $hashedPassword = $user['TaiKhoan']['MatKhau'] ?? null;
        if (!empty($hashedPassword) && $currentPassword !== '') {
            if (!password_verify($currentPassword, $hashedPassword)) {
                throw new Exception('Mật khẩu hiện tại không chính xác.');
            }
        }

        if ($newPassword !== '') {
            if ($newPassword !== $confirmPassword) {
                throw new Exception('Mật khẩu xác nhận không trùng khớp.');
            }
            if (strlen($newPassword) < 6) {
                throw new Exception('Mật khẩu mới phải có ít nhất 6 ký tự.');
            }
            if ($currentPassword !== '' && $currentPassword === $newPassword) {
                throw new Exception('Mật khẩu mới phải khác mật khẩu hiện tại.');
            }
            $newHashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        } else {
            // Cho phép đặt mật khẩu trống
            $newHashedPassword = null;
        }

        $this->userRepository->updatePassword($user['_id'], $newHashedPassword);

        return ['success' => true, 'message' => 'Đổi mật khẩu thành công.'];
    }

    private function formatUser($user, ?string $avatar = null): array
    {
        $taiKhoan = $user['TaiKhoan'] ?? [];
        $quyen = $taiKhoan['Quyen'] ?? [];

        return [
            'id' => isset($user['_id']) ? (string) $user['_id'] : null,
            'MaKH' => $user['MaKH'] ?? null,
            'MaNV' => $user['MaNV'] ?? null,
            'fullName' => $user['HoTen'] ?? '',
            'email' => $taiKhoan['Email'] ?? $user['Email'] ?? '',
            'SDT' => $user['SDT'] ?? '',
            'DiaChi' => $user['DiaChi'] ?? '',
            'role' => $quyen['MaQ'] ?? 'KH',
            'roleName' => $quyen['TenQ'] ?? 'Khách hàng',
            'avatar' => $avatar ?? $user['Avatar'] ?? null
        ];
    }
}
