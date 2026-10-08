<?php

require_once __DIR__ . '/../../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailException;

class MailService
{
    public function sendResetPasswordEmail(
        string $email,
        string $fullName,
        string $resetUrl
    ): void {

        $mail = new PHPMailer(true);

        try {

            /*
             * =========================
             * ĐỌC CẤU HÌNH EMAIL
             * =========================
             */

            $mailHost = $_ENV['MAIL_HOST']
                ?? $_SERVER['MAIL_HOST']
                ?? '';

            $mailPort = $_ENV['MAIL_PORT']
                ?? $_SERVER['MAIL_PORT']
                ?? '587';

            $mailUsername = $_ENV['MAIL_USERNAME']
                ?? $_SERVER['MAIL_USERNAME']
                ?? '';

            $mailPassword = $_ENV['MAIL_PASSWORD']
                ?? $_SERVER['MAIL_PASSWORD']
                ?? '';

            $mailFromAddress = $_ENV['MAIL_FROM_ADDRESS']
                ?? $_SERVER['MAIL_FROM_ADDRESS']
                ?? '';

            $mailFromName = $_ENV['MAIL_FROM_NAME']
                ?? $_SERVER['MAIL_FROM_NAME']
                ?? 'The Little Prince Pâtisserie';


            /*
             * =========================
             * KIỂM TRA CẤU HÌNH
             * =========================
             */

            if ($mailHost === '') {
                throw new Exception(
                    'MAIL_HOST chưa được cấu hình.'
                );
            }

            if ($mailUsername === '') {
                throw new Exception(
                    'MAIL_USERNAME chưa được cấu hình.'
                );
            }

            if ($mailPassword === '') {
                throw new Exception(
                    'MAIL_PASSWORD chưa được cấu hình.'
                );
            }

            if ($mailFromAddress === '') {
                throw new Exception(
                    'MAIL_FROM_ADDRESS chưa được cấu hình.'
                );
            }


            /*
             * =========================
             * DEBUG LOG
             * =========================
             */

            error_log(
                'MAIL HOST: ' . $mailHost
            );

            error_log(
                'MAIL PORT: ' . $mailPort
            );

            error_log(
                'MAIL USERNAME: ' . $mailUsername
            );

            error_log(
                'MAIL FROM: ' . $mailFromAddress
            );


            /*
             * =========================
             * SMTP
             * =========================
             */

            $mail->isSMTP();

            $mail->Host = $mailHost;

            $mail->SMTPAuth = true;

            $mail->Username = $mailUsername;

            $mail->Password = $mailPassword;

            $mail->SMTPSecure =
                PHPMailer::ENCRYPTION_STARTTLS;

            $mail->Port = (int) $mailPort;

            $mail->Timeout = 15;


            /*
             * BẬT DEBUG SMTP
             *
             * 2 = client/server messages
             */

            $mail->SMTPDebug = 2;

            $mail->Debugoutput = function ($str, $level) {
                error_log(
                    'SMTP DEBUG: ' . trim($str)
                );
            };


            /*
             * =========================
             * EMAIL HEADER
             * =========================
             */

            $mail->CharSet = 'UTF-8';

            $mail->setFrom(
                $mailFromAddress,
                $mailFromName
            );

            $mail->addAddress(
                $email,
                $fullName
            );


            /*
             * =========================
             * EMAIL CONTENT
             * =========================
             */

            $mail->isHTML(true);

            $mail->Subject =
                'Đặt lại mật khẩu | The Little Prince Pâtisserie';

            $safeName = htmlspecialchars(
                $fullName,
                ENT_QUOTES,
                'UTF-8'
            );

            $safeUrl = htmlspecialchars(
                $resetUrl,
                ENT_QUOTES,
                'UTF-8'
            );

            $mail->Body = <<<HTML

<div style="
    font-family:Arial,sans-serif;
    max-width:600px;
    margin:auto;
    padding:40px;
    color:#453b3b;
">

    <h2 style="
        font-family:Georgia,serif;
        font-weight:normal;
        color:#6f5558;
    ">
        The Little Prince Pâtisserie
    </h2>

    <p>
        Xin chào {$safeName},
    </p>

    <p>
        Chúng tôi nhận được yêu cầu đặt lại mật khẩu
        cho tài khoản của bạn.
    </p>

    <p>
        Nhấn vào nút bên dưới để tạo mật khẩu mới.
    </p>

    <p style="margin:35px 0;">

        <a
            href="{$safeUrl}"
            style="
                display:inline-block;
                background:#8d6f73;
                color:#ffffff;
                padding:14px 26px;
                text-decoration:none;
                border-radius:6px;
            "
        >
            Đặt lại mật khẩu
        </a>

    </p>

    <p>
        Liên kết này có hiệu lực trong
        <strong>15 phút</strong>.
    </p>

    <p>
        Nếu bạn không yêu cầu thay đổi mật khẩu,
        bạn có thể bỏ qua email này.
    </p>

    <hr style="
        border:0;
        border-top:1px solid #eee;
        margin:30px 0;
    ">

    <small style="color:#999;">
        The Little Prince Pâtisserie
    </small>

</div>

HTML;

            $mail->AltBody =
                "Xin chào {$fullName}.\n\n" .
                "Đặt lại mật khẩu tại:\n" .
                $resetUrl .
                "\n\n" .
                "Liên kết có hiệu lực trong 15 phút.";


            /*
             * =========================
             * GỬI
             * =========================
             */

            $mail->send();

            error_log(
                'RESET PASSWORD EMAIL SENT TO: ' .
                $email
            );

        } catch (MailException $e) {

            error_log(
                'PHPMailer ERROR: ' .
                $e->getMessage()
            );

            error_log(
                'PHPMailer ERROR INFO: ' .
                $mail->ErrorInfo
            );

            throw new Exception(
                'Không thể gửi email. Vui lòng kiểm tra cấu hình email.'
            );

        } catch (Throwable $e) {

            error_log(
                'MAIL ERROR: ' .
                $e->getMessage()
            );

            throw new Exception(
                'Không thể gửi email. Vui lòng kiểm tra cấu hình email.'
            );
        }
    }
}