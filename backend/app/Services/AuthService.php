<?php

require_once __DIR__ . '/../Repositories/UserRepository.php';
require_once __DIR__ . '/MailService.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use MongoDB\BSON\UTCDateTime;

class AuthService
{
    private UserRepository $userRepository;
    private MailService $mailService;

    public function __construct()
    {
        $this->userRepository = new UserRepository();
        $this->mailService = new MailService();
    }


    // =========================================================
    // ĐĂNG KÝ TÀI KHOẢN KHÁCH HÀNG
    // =========================================================
    public function register(array $data): array
    {
        $fullName = trim($data['fullName'] ?? '');
        $email = strtolower(trim($data['email'] ?? ''));
        $password = $data['password'] ?? '';

        if ($fullName === '') {
            throw new Exception('Vui lòng nhập họ tên.');
        }

        if ($email === '') {
            throw new Exception('Vui lòng nhập email.');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Email không hợp lệ.');
        }

        if ($password === '') {
            throw new Exception('Vui lòng nhập mật khẩu.');
        }

        if (strlen($password) < 6) {
            throw new Exception('Mật khẩu phải có ít nhất 6 ký tự.');
        }

        // Kiểm tra email đã tồn tại
        $existingUser = $this->userRepository->findByEmail($email);

        if ($existingUser) {
            throw new Exception('Email này đã được đăng ký.');
        }


        // Tạo tài khoản khách hàng
        $maKH = $this->userRepository->generateNextMaKH();

        $maKHNumber = (int) substr($maKH, 2);

        // Mã tài khoản tương ứng
        $maTK = 'TK' . $maKHNumber;

    // Tạo tài khoản khách hàng
        $user = [
            'MaKH' => $maKH,

            //'MaKHNumber' => $maKHNumber,

            'HoTen' => $fullName,

            // Email bên ngoài
            'Email' => $email,

            'TaiKhoan' => [
                'MaTK' => $maTK,

                //'MaTKNumber' => $maKHNumber,

                'Email' => $email,

                'MatKhau' => password_hash(
                    $password,
                    PASSWORD_DEFAULT
                ),

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


    // =========================================================
    // ĐĂNG NHẬP
    // =========================================================
    // public function login(array $data): array
    // {
    //     $email = strtolower(trim($data['email'] ?? ''));
    //     $password = $data['password'] ?? '';

    //     if ($email === '') {
    //         throw new Exception('Vui lòng nhập email.');
    //     }

    //     if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    //         throw new Exception('Email không hợp lệ.');
    //     }

    //     if ($password === '') {
    //         throw new Exception('Vui lòng nhập mật khẩu.');
    //     }

    //     // Tìm tài khoản theo TaiKhoan.Email
    //     $user = $this->userRepository->findByEmail($email);

    //     // Không tìm thấy tài khoản
    //     if (!$user) {
    //         throw new Exception(
    //             'Email hoặc mật khẩu không chính xác.'
    //         );
    //     }

    //     // Kiểm tra mật khẩu
    //     $hashedPassword = $user['TaiKhoan']['MatKhau'] ?? null;

    //     if (
    //         empty($hashedPassword) ||
    //         !password_verify($password, $hashedPassword)
    //     ) {
    //         throw new Exception(
    //             'Email hoặc mật khẩu không chính xác.'
    //         );
    //     }

    //     // Kiểm tra trạng thái
    //     $status = $user['TrangThai'] ?? '';

    //     /*
    //      * Khách hàng:
    //      *   Hoạt động
    //      *
    //      * Nhân viên:
    //      *   Đang làm việc
    //      */
    //     if (!in_array(
    //         $status,
    //         ['Hoạt động', 'Đang làm việc'],
    //         true
    //     )) {
    //         throw new Exception(
    //             'Tài khoản của bạn hiện không hoạt động.'
    //         );
    //     }

    //     return $this->formatUser($user);
    // }

public function login(array $data): array
{
    $email = strtolower(trim($data['email'] ?? ''));
    $password = $data['password'] ?? '';

    error_log("========== LOGIN DEBUG ==========");
    error_log("EMAIL: " . $email);
    error_log("USER FOUND CHECK...");

    if ($email === '') {
        throw new Exception('Vui lòng nhập email.');
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Email không hợp lệ.');
    }

    if ($password === '') {
        throw new Exception('Vui lòng nhập mật khẩu.');
    }

    // Tìm trong KhachHangs và NhanViens
    $user = $this->userRepository->findByEmail($email);

    error_log("USER FOUND: " . ($user ? 'YES' : 'NO'));

    if ($user) {
        error_log("MAKH: " . ($user['MaKH'] ?? 'N/A'));
        error_log("MANV: " . ($user['MaNV'] ?? 'N/A'));

        $hash = $user['TaiKhoan']['MatKhau'] ?? '';

        error_log("HASH EXISTS: " . ($hash !== '' ? 'YES' : 'NO'));

        error_log(
            "PASSWORD VERIFY: " .
            (password_verify($password, $hash) ? 'YES' : 'NO')
        );
    }

    // Không tìm thấy tài khoản
    if (!$user) {
        throw new Exception(
            'Email hoặc mật khẩu không chính xác.'
        );
    }

    // Lấy mật khẩu đã hash
    $hashedPassword =
        $user['TaiKhoan']['MatKhau'] ?? null;

    // Kiểm tra mật khẩu
    if (
        empty($hashedPassword) ||
        !password_verify($password, $hashedPassword)
    ) {
        throw new Exception(
            'Email hoặc mật khẩu không chính xác.'
        );
    }

    // Kiểm tra trạng thái tài khoản
    $status = $user['TrangThai'] ?? '';

    if (!in_array(
        $status,
        ['Hoạt động', 'Đang làm việc'],
        true
    )) {
        throw new Exception(
            'Tài khoản của bạn hiện không hoạt động.'
        );
    }

    return $this->formatUser($user);
}
    // =========================================================
    // ĐĂNG NHẬP GOOGLE
    // =========================================================
    // public function googleLogin(string $credential): array
    // {
    //     if (trim($credential) === '') {
    //         throw new Exception(
    //             'Thông tin đăng nhập Google không hợp lệ.'
    //         );
    //     }

    //     $clientId =
    //         $_ENV['GOOGLE_CLIENT_ID']
    //         ?? getenv('GOOGLE_CLIENT_ID');

    //     if (!$clientId) {
    //         throw new Exception(
    //             'Google Client ID chưa được cấu hình.'
    //         );
    //     }

    //     $client = new Google\Client([
    //         'client_id' => $clientId
    //     ]);

    //     $payload = $client->verifyIdToken($credential);

    //     if (!$payload) {
    //         throw new Exception(
    //             'Đăng nhập Google không hợp lệ.'
    //         );
    //     }

    //     if (
    //         empty($payload['email']) ||
    //         empty($payload['sub'])
    //     ) {
    //         throw new Exception(
    //             'Google không cung cấp đủ thông tin tài khoản.'
    //         );
    //     }

    //     if (
    //         isset($payload['email_verified']) &&
    //         !$payload['email_verified']
    //     ) {
    //         throw new Exception(
    //             'Email Google chưa được xác minh.'
    //         );
    //     }

    //     $email = strtolower(
    //         trim($payload['email'])
    //     );

    //     $googleId = (string) $payload['sub'];

    //     $fullName = trim(
    //         $payload['name'] ?? 'Khách hàng'
    //     );

    //     $avatar = $payload['picture'] ?? null;

    //     // Tìm tài khoản theo TaiKhoan.Email
    //     $user = $this->userRepository->findByEmail($email);


    //     // -----------------------------------------------------
    //     // EMAIL ĐÃ TỒN TẠI
    //     // -----------------------------------------------------
    //     if ($user) {

    //         $status = $user['TrangThai'] ?? '';

    //         if (!in_array(
    //             $status,
    //             ['Hoạt động', 'Đang làm việc'],
    //             true
    //         )) {
    //             throw new Exception(
    //                 'Tài khoản của bạn hiện không hoạt động.'
    //             );
    //         }

    //         // Kiểm tra Google ID
    //         if (
    //             empty($user['googleId']) ||
    //             (string) $user['googleId'] !== $googleId
    //         ) {
    //             $this->userRepository->attachGoogleAccount(
    //                 $user['_id'],
    //                 $googleId,
    //                 $avatar
    //             );

    //             // Cập nhật lại dữ liệu hiện tại
    //             $user['googleId'] = $googleId;

    //             if ($avatar) {
    //                 $user['Avatar'] = $avatar;
    //             }
    //         }

    //         return $this->formatUser(
    //             $user,
    //             $avatar
    //         );
    //     }


    //     // -----------------------------------------------------
    //     // TẠO TÀI KHOẢN GOOGLE MỚI
    //     // -----------------------------------------------------
    //     // Tạo mã khách hàng tự động
    //     $maKH = $this->userRepository->generateNextMaKH();

    //     // Lấy số từ MaKH
    //     $maKHNumber = (int) substr($maKH, 2);

    //     // Tạo mã tài khoản tương ứng
    //     $maTK = 'TK' . $maKHNumber;

    //     $newUser = [
    //         'MaKH' => $maKH,

    //         'HoTen' => $fullName,

    //         // Email bên ngoài
    //         'Email' => $email,

    //         'TaiKhoan' => [
    //             'MaTK' => $maTK,

    //             // Email trong tài khoản
    //             'Email' => $email,

    //             // Google không sử dụng mật khẩu
    //             'MatKhau' => null,

    //             'Quyen' => [
    //                 'MaQ' => 'KH',
    //                 'TenQ' => 'Khách hàng'
    //             ]
    //         ],

    //         'TrangThai' => 'Hoạt động',

    //         'NgayDangKy' => new UTCDateTime(),

    //         'googleId' => $googleId
    //     ];

    //     if ($avatar) {
    //         $newUser['Avatar'] = $avatar;
    //     }

    //     $id = $this->userRepository->create($newUser);

    //     return [
    //         'id' => (string) $id,
    //         'MaKH' => $maKH,
    //         'MaTK' => $maTK,
    //         'fullName' => $fullName,
    //         'email' => $email,
    //         'role' => 'KH',
    //         'roleName' => 'Khách hàng',
    //         'avatar' => $avatar
    //     ];
    // }

    public function googleLogin(string $credential): array
{
    if (trim($credential) === '') {
        throw new Exception(
            'Thông tin đăng nhập Google không hợp lệ.'
        );
    }

    $clientId =
        $_ENV['GOOGLE_CLIENT_ID']
        ?? getenv('GOOGLE_CLIENT_ID');

    if (!$clientId) {
        throw new Exception(
            'Google Client ID chưa được cấu hình.'
        );
    }

    error_log("========== GOOGLE TOKEN DEBUG ==========");
    error_log("CLIENT ID: " . $clientId);
    error_log("CREDENTIAL LENGTH: " . strlen($credential));
    error_log(
        "CREDENTIAL START: " .
        substr($credential, 0, 20)
    );

    try {

        $client = new Google\Client([
            'client_id' => $clientId
        ]);

        $payload = $client->verifyIdToken($credential);

        if ($payload === false || $payload === null) {

            error_log(
                "VERIFY RESULT: NULL/FALSE"
            );

            throw new Exception(
                'verifyIdToken() trả về NULL.'
            );
        }

        error_log("VERIFY RESULT:");
        error_log(print_r($payload, true));

    } catch (Throwable $e) {

        error_log(
            "VERIFY EXCEPTION: " .
            $e->getMessage()
        );

        throw new Exception(
            'Không thể xác thực Google: ' .
            $e->getMessage()
        );
    }

    if (
        empty($payload['email']) ||
        empty($payload['sub'])
    ) {
        throw new Exception(
            'Google không cung cấp đủ thông tin tài khoản.'
        );
    }

    if (
        isset($payload['email_verified']) &&
        !$payload['email_verified']
    ) {
        throw new Exception(
            'Email Google chưa được xác minh.'
        );
    }

    $email = strtolower(
        trim($payload['email'])
    );

    $googleId = (string) $payload['sub'];

    $fullName = trim(
        $payload['name'] ?? 'Khách hàng'
    );

    $avatar = $payload['picture'] ?? null;

    $user = $this->userRepository->findByEmail(
        $email
    );

    /*
     * USER ĐÃ TỒN TẠI
     */
    if ($user) {

        $status = $user['TrangThai'] ?? '';

        if (
            !in_array(
                $status,
                ['Hoạt động', 'Đang làm việc'],
                true
            )
        ) {
            throw new Exception(
                'Tài khoản của bạn hiện không hoạt động.'
            );
        }

        if (
            empty($user['googleId']) ||
            (string) $user['googleId'] !== $googleId
        ) {

            $this->userRepository->attachGoogleAccount(
                $user['_id'],
                $googleId,
                $avatar
            );

            $user['googleId'] = $googleId;

            if ($avatar) {
                $user['Avatar'] = $avatar;
            }
        }

        return $this->formatUser(
            $user,
            $avatar
        );
    }

    /*
     * TẠO USER MỚI
     */
    $maKH =
        $this->userRepository->generateNextMaKH();

    $maKHNumber =
        (int) substr($maKH, 2);

    $maTK = 'TK' . $maKHNumber;

    $newUser = [
        'MaKH' => $maKH,

        'HoTen' => $fullName,

        'Email' => $email,

        'TaiKhoan' => [
            'MaTK' => $maTK,
            'Email' => $email,
            'MatKhau' => null,

            'Quyen' => [
                'MaQ' => 'KH',
                'TenQ' => 'Khách hàng'
            ]
        ],

        'TrangThai' => 'Hoạt động',

        'NgayDangKy' => new UTCDateTime(),

        'googleId' => $googleId
    ];

    if ($avatar) {
        $newUser['Avatar'] = $avatar;
    }

    $id = $this->userRepository->create(
        $newUser
    );

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


    // =========================================================
    // QUÊN MẬT KHẨU
    // =========================================================
    public function forgotPassword(string $email): void
    {
        $email = strtolower(trim($email));

        if ($email === '') {
            throw new Exception(
                'Vui lòng nhập email.'
            );
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception(
                'Email không hợp lệ.'
            );
        }

        $user = $this->userRepository->findByEmail(
            $email
        );

        /*
         * Không báo email không tồn tại để tránh
         * tiết lộ thông tin tài khoản.
         */
        if (!$user) {
            return;
        }

        $token = bin2hex(
            random_bytes(32)
        );

        $tokenHash = hash(
            'sha256',
            $token
        );

        // Token có hiệu lực 15 phút
        $expiresAt = new UTCDateTime(
            (time() + 15 * 60) * 1000
        );

        $this->userRepository->setResetPasswordToken(
            $user['_id'],
            $tokenHash,
            $expiresAt
        );

        $frontendUrl =
            $_ENV['FRONTEND_URL']
            ?? getenv('FRONTEND_URL')
            ?: 'http://localhost:8080/New/frontend';

        $resetUrl =
            rtrim($frontendUrl, '/')
            . '/page/auth/reset-password.html?token='
            . urlencode($token);

        // Email phải lấy từ TaiKhoan.Email
        $accountEmail =
            $user['TaiKhoan']['Email']
            ?? $email;

        $this->mailService->sendResetPasswordEmail(
            $accountEmail,
            $user['HoTen'] ?? 'Khách hàng',
            $resetUrl
        );
    }


    // =========================================================
    // ĐẶT LẠI MẬT KHẨU
    // =========================================================
    public function resetPassword(
        string $token,
        string $password
    ): void {

        $token = trim($token);

        if ($token === '') {
            throw new Exception(
                'Token không hợp lệ.'
            );
        }

        if ($password === '') {
            throw new Exception(
                'Vui lòng nhập mật khẩu mới.'
            );
        }

        if (strlen($password) < 6) {
            throw new Exception(
                'Mật khẩu phải có ít nhất 6 ký tự.'
            );
        }

        $tokenHash = hash(
            'sha256',
            $token
        );

        $user = $this->userRepository->findByResetToken(
            $tokenHash
        );

        if (!$user) {
            throw new Exception(
                'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.'
            );
        }

        $hashedPassword = password_hash(
            $password,
            PASSWORD_DEFAULT
        );

        $this->userRepository->updatePassword(
            $user['_id'],
            $hashedPassword
        );
    }


    // =========================================================
    // FORMAT USER TRẢ VỀ FRONTEND
    // =========================================================
    private function formatUser(
        $user,
        ?string $avatar = null
    ): array {

        $taiKhoan = $user['TaiKhoan'] ?? [];
        $quyen = $taiKhoan['Quyen'] ?? [];

        return [
            'id' => isset($user['_id'])
                ? (string) $user['_id']
                : null,

            'MaKH' => $user['MaKH'] ?? null,

            'MaNV' => $user['MaNV'] ?? null,

            'fullName' => $user['HoTen'] ?? '',

            'email' =>
                $taiKhoan['Email']
                ?? $user['Email']
                ?? '',

            'SDT' => $user['SDT'] ?? '',

            'DiaChi' => $user['DiaChi'] ?? '',

            'role' =>
                $quyen['MaQ']
                ?? 'KH',

            'roleName' =>
                $quyen['TenQ']
                ?? 'Khách hàng',

            'avatar' =>
                $avatar
                ?? $user['Avatar']
                ?? null
        ];
    }

    public function changePassword(
        string $email,
        string $currentPassword,
        string $newPassword,
        string $confirmPassword
    ): array {
        $email = strtolower(trim($email));

        if ($email === '') {
            throw new Exception('Email không hợp lệ.');
        }

        if ($currentPassword === '') {
            throw new Exception('Vui lòng nhập mật khẩu hiện tại.');
        }

        if ($newPassword === '') {
            throw new Exception('Vui lòng nhập mật khẩu mới.');
        }

        if (strlen($newPassword) < 6) {
            throw new Exception('Mật khẩu mới phải có ít nhất 6 ký tự.');
        }

        if ($newPassword !== $confirmPassword) {
            throw new Exception('Mật khẩu xác nhận không trùng khớp.');
        }

        if ($currentPassword === $newPassword) {
            throw new Exception('Mật khẩu mới phải khác mật khẩu hiện tại.');
        }

        $user = $this->userRepository->findByEmail($email);

        if (!$user) {
            throw new Exception('Không tìm thấy tài khoản.');
        }

        $status = $user['TrangThai'] ?? '';

        if (!in_array($status, ['Hoạt động', 'Đang làm việc'], true)) {
            throw new Exception('Tài khoản của bạn hiện không hoạt động.');
        }

        $hashedPassword = $user['TaiKhoan']['MatKhau'] ?? null;


        // Nếu tài khoản đã có mật khẩu
        if (!empty($hashedPassword)) {

            // Nếu tài khoản có mật khẩu thì yêu cầu nhập mật khẩu hiện tại
            if ($currentPassword === '') {
                throw new Exception(
                    'Vui lòng nhập mật khẩu hiện tại.'
                );
            }

            // Kiểm tra mật khẩu hiện tại
            if (!password_verify($currentPassword, $hashedPassword)) {
                throw new Exception(
                    'Mật khẩu hiện tại không chính xác.'
                );
            }

        } else {

            // Tài khoản Google chưa có mật khẩu
            // Cho phép thiết lập mật khẩu mới trực tiếp.
            // Không cần nhập mật khẩu hiện tại.
        }



        $newHashedPassword = password_hash(
            $newPassword,
            PASSWORD_DEFAULT
        );

        $this->userRepository->updatePassword(
            $user['_id'],
            $newHashedPassword
        );

        return [
            'success' => true,
            'message' => 'Đổi mật khẩu thành công.'
        ];
    }
}