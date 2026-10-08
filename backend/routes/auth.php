<?php
declare(strict_types=1);

error_log("========== AUTH.PHP LOADED ==========");

/*
 * =========================================================
 * CORS
 * =========================================================
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}


/*
 * =========================================================
 * AUTOLOAD + ENV
 * =========================================================
 */

require_once __DIR__ . '/../vendor/autoload.php';

try {

    $dotenv = Dotenv\Dotenv::createImmutable(
        __DIR__ . '/..'
    );

    $dotenv->safeLoad();

    error_log("ENV LOADED");

} catch (Throwable $e) {

    error_log(
        "DOTENV ERROR: " .
        $e->getMessage()
    );
}


require_once __DIR__ . '/../app/Requests/AuthRequest.php';
require_once __DIR__ . '/../app/Services/AuthService.php';


/*
 * =========================================================
 * MAIN
 * =========================================================
 */

try {

    error_log("========== AUTH.PHP TRY ==========");

    $authService = new AuthService();

    error_log("AUTH SERVICE CREATED");


    /*
     * =====================================================
     * REQUEST INFORMATION
     * =====================================================
     */

    $method = strtoupper(
        $_SERVER['REQUEST_METHOD'] ?? 'GET'
    );

    $requestUri =
        $_SERVER['REQUEST_URI'] ?? '/';

    $path = parse_url(
        $requestUri,
        PHP_URL_PATH
    ) ?: '/';


    /*
     * Loại bỏ query string / slash dư
     */

    $path = '/' . trim(
        $path,
        '/'
    );

    error_log(
        "METHOD: " . $method
    );

    error_log(
        "REQUEST URI: " . $requestUri
    );

    error_log(
        "PATH: " . $path
    );


    /*
     * =====================================================
     * REQUEST BODY
     * =====================================================
     */

    $rawBody = file_get_contents(
        'php://input'
    );

    error_log(
        "RAW BODY: " . $rawBody
    );

    $body = json_decode(
        $rawBody,
        true
    );

    if (!is_array($body)) {
        $body = [];
    }


    /*
     * =====================================================
     * LOGIN
     * =====================================================
     */

    if (
        $method === 'POST' &&
        preg_match(
            '#/auth/login$#',
            $path
        )
    ) {

        error_log(
            "========== LOGIN ROUTE FOUND =========="
        );

        $email =
            trim($body['email'] ?? '');

        $password =
            $body['password'] ?? '';

        error_log(
            "EMAIL: " .
            ($email !== '' ? $email : 'NO EMAIL')
        );

        error_log(
            "PASSWORD RECEIVED: " .
            ($password !== '' ? 'YES' : 'NO')
        );


        $user = $authService->login([
            'email' => $email,
            'password' => $password
        ]);


        echo json_encode([
            'success' => true,
            'message' => 'Đăng nhập thành công.',
            'user' => $user
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }


    /*
     * =====================================================
     * REGISTER
     * =====================================================
     */

    if (
        $method === 'POST' &&
        preg_match(
            '#/auth/register$#',
            $path
        )
    ) {

        error_log(
            "========== REGISTER ROUTE FOUND =========="
        );


        $data =
            AuthRequest::validateRegister(
                $body
            );


        $user =
            $authService->register(
                $data
            );


        http_response_code(201);

        echo json_encode([
            'success' => true,
            'message' => 'Đăng ký thành công.',
            'user' => $user
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }


    /*
     * =====================================================
     * GOOGLE LOGIN
     * =====================================================
     */

    if (
        $method === 'POST' &&
        preg_match(
            '#/auth/google$#',
            $path
        )
    ) {

        error_log(
            "========== GOOGLE LOGIN ROUTE FOUND =========="
        );


        $credential =
            $body['credential'] ?? '';


        if ($credential === '') {

            throw new Exception(
                'Thiếu thông tin đăng nhập Google.'
            );
        }


        $user =
            $authService->googleLogin(
                $credential
            );


        echo json_encode([
            'success' => true,
            'message' =>
                'Đăng nhập Google thành công.',
            'user' => $user
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }


    /*
     * =====================================================
     * FORGOT PASSWORD
     * =====================================================
     */

    if (
        $method === 'POST' &&
        preg_match(
            '#/auth/forgot-password$#',
            $path
        )
    ) {

        error_log(
            "========== FORGOT PASSWORD ROUTE FOUND =========="
        );


        $email =
            trim($body['email'] ?? '');


        error_log(
            "FORGOT EMAIL: " .
            ($email !== ''
                ? $email
                : 'NO EMAIL')
        );


        if ($email === '') {

            throw new Exception(
                'Vui lòng nhập email.'
            );
        }


        error_log(
            "CALL AUTH SERVICE FORGOT PASSWORD"
        );


        $result =
            $authService->forgotPassword(
                $email
            );


        error_log(
            "AUTH SERVICE FORGOT PASSWORD SUCCESS"
        );


        /*
         * AuthService có thể trả về:
         *
         * string
         * hoặc
         * ['message' => '...']
         */

        if (is_array($result)) {

            $message =
                $result['message']
                ?? 'Đã gửi yêu cầu đặt lại mật khẩu.';

        } else {

            $message =
                (string) $result;

            if ($message === '') {

                $message =
                    'Đã gửi yêu cầu đặt lại mật khẩu.';
            }
        }


        echo json_encode([
            'success' => true,
            'message' => $message
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }


    /*
     * =====================================================
     * RESET PASSWORD
     * =====================================================
     */

    if (
        $method === 'POST' &&
        preg_match(
            '#/auth/reset-password$#',
            $path
        )
    ) {

        error_log(
            "========== RESET PASSWORD ROUTE FOUND =========="
        );


        $token =
            trim($body['token'] ?? '');

        $password =
            $body['password'] ?? '';

        $confirmPassword =
            $body['confirmPassword'] ?? '';


        if ($token === '') {

            throw new Exception(
                'Token đặt lại mật khẩu không hợp lệ.'
            );
        }


        if ($password === '') {

            throw new Exception(
                'Vui lòng nhập mật khẩu mới.'
            );
        }


        if ($password !== $confirmPassword) {

            throw new Exception(
                'Mật khẩu xác nhận không khớp.'
            );
        }


        if (strlen($password) < 6) {

            throw new Exception(
                'Mật khẩu phải có ít nhất 6 ký tự.'
            );
        }


        error_log(
            "CALL AUTH SERVICE RESET PASSWORD"
        );


        $result =
            $authService->resetPassword(
                $token,
                $password,
                $confirmPassword
            );


        error_log(
            "AUTH SERVICE RESET PASSWORD SUCCESS"
        );


        if (is_array($result)) {

            $message =
                $result['message']
                ?? 'Đặt lại mật khẩu thành công.';

        } else {

            $message =
                (string) $result;

            if ($message === '') {

                $message =
                    'Đặt lại mật khẩu thành công.';
            }
        }


        echo json_encode([
            'success' => true,
            'message' => $message
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }


    /*
     * =====================================================
     * API KHÔNG TỒN TẠI
     * =====================================================
     */

    error_log(
        "========== API NOT FOUND =========="
    );

    error_log(
        "METHOD: " . $method
    );

    error_log(
        "PATH: " . $path
    );


    http_response_code(404);

    echo json_encode([
        'success' => false,
        'message' => 'API không tồn tại.'
    ], JSON_UNESCAPED_UNICODE);

    exit;


} catch (Throwable $e) {

    error_log(
        "========== AUTH ERROR =========="
    );

    error_log(
        "MESSAGE: " .
        $e->getMessage()
    );

    error_log(
        "FILE: " .
        $e->getFile()
    );

    error_log(
        "LINE: " .
        $e->getLine()
    );


    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}