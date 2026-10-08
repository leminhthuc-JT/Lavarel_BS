<?php

namespace App\Services\Client;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class MailService
{
    public function sendResetPasswordEmail(string $toEmail, string $toName, string $resetUrl): void
    {
        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();
            $mail->Host       = env('MAIL_HOST', 'smtp.gmail.com');
            $mail->SMTPAuth   = true;
            $mail->Username   = env('MAIL_USERNAME', '');
            $mail->Password   = env('MAIL_PASSWORD', '');
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = env('MAIL_PORT', 587);
            $mail->CharSet    = 'UTF-8';
            $mail->Timeout    = 15;
            $mail->SMTPOptions = [
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                ]
            ];

            $mail->setFrom(
                env('MAIL_FROM_ADDRESS', 'leminhthuc1882005@gmail.com'),
                env('MAIL_FROM_NAME', 'The Little Prince Pâtisserie')
            );
            $mail->addAddress($toEmail, $toName);

            $mail->isHTML(true);
            $mail->Subject = 'Yêu cầu đặt lại mật khẩu - The Little Prince Pâtisserie';
            $mail->Body    = "
                <h3>Xin chào {$toName},</h3>
                <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                <p>Nhấp vào liên kết bên dưới để đặt lại mật khẩu (có hiệu lực trong 15 phút):</p>
                <p><a href='{$resetUrl}' style='padding: 10px 20px; background-color: #8b5cf6; color: #fff; text-decoration: none; border-radius: 5px;'>Đặt lại mật khẩu</a></p>
                <p>Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email.</p>
                <br>
                <p>Trân trọng,<br><strong>The Little Prince Pâtisserie</strong></p>
            ";

            $mail->send();
        } catch (Exception $e) {
            \Log::error("Mailer Error: {$mail->ErrorInfo}");
            throw new \Exception("Không thể gửi email: {$mail->ErrorInfo}");
        }
    }
}
