<?php

declare(strict_types=1);

namespace Client\Services;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

final class ContactService
{
    public function sendContact(array $data): void
    {
        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $phone = trim($data['phone'] ?? '');
        $subjectTag = trim($data['subject'] ?? 'Tư vấn & Liên hệ');
        $message = trim($data['message'] ?? '');

        if (empty($name) || empty($email) || empty($message)) {
            throw new \InvalidArgumentException('Vui lòng điền đầy đủ thông tin bắt buộc (*).');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException('Địa chỉ email không hợp lệ.');
        }

        $host = $_ENV['MAIL_HOST'] ?? getenv('MAIL_HOST') ?: 'smtp.gmail.com';
        $port = (int)($_ENV['MAIL_PORT'] ?? getenv('MAIL_PORT') ?: 587);
        $username = $_ENV['MAIL_USERNAME'] ?? getenv('MAIL_USERNAME') ?: 'leminhthuc1882005@gmail.com';
        $password = $_ENV['MAIL_PASSWORD'] ?? getenv('MAIL_PASSWORD') ?: '';
        $fromAddr = $_ENV['MAIL_FROM_ADDRESS'] ?? getenv('MAIL_FROM_ADDRESS') ?: $username;
        $fromName = $_ENV['MAIL_FROM_NAME'] ?? getenv('MAIL_FROM_NAME') ?: 'The Little Prince Pâtisserie';

        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();
            $mail->Host       = $host;
            $mail->SMTPAuth   = true;
            $mail->Username   = $username;
            $mail->Password   = $password;
            $mail->SMTPSecure = $port === 465 ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = $port;
            $mail->CharSet    = 'UTF-8';
            $mail->Timeout    = 15;
            $mail->SMTPOptions = [
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                ]
            ];

            $mail->setFrom($fromAddr, $fromName);
            $mail->addAddress($username, 'Ban Quản Trị Little Prince');
            $mail->addReplyTo($email, $name);

            $mail->isHTML(true);
            $mail->Subject = "=?UTF-8?B?" . base64_encode("Yêu Cầu Liên Hệ Mới: [{$subjectTag}] từ {$name}") . "?=";

            $safeName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
            $safeEmail = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
            $safePhone = htmlspecialchars($phone !== '' ? $phone : 'Chưa cung cấp', ENT_QUOTES, 'UTF-8');
            $safeSubject = htmlspecialchars($subjectTag, ENT_QUOTES, 'UTF-8');
            $safeMessage = nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8'));
            $sentTime = date('H:i:s d/m/Y');

            $mail->Body = "
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #FAF7F2; margin: 0; padding: 20px; color: #333333; }
                    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2ded8; }
                    .header { background: #92A398; color: #ffffff; padding: 24px; text-align: center; }
                    .header h2 { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 0.5px; }
                    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
                    .content { padding: 30px; }
                    .info-group { margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px dashed #eee; }
                    .label { font-size: 12px; font-weight: bold; color: #777; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
                    .val { font-size: 15px; color: #222; font-weight: 500; }
                    .msg-box { background: #FAF7F2; padding: 18px; border-radius: 8px; border-left: 4px solid #92A398; margin-top: 10px; font-size: 14px; line-height: 1.6; color: #444; }
                    .footer { background: #F3EFE9; padding: 16px; text-align: center; font-size: 12px; color: #888888; }
                </style>
            </head>
            <body>
                <div class='card'>
                    <div class='header'>
                        <h2>The Little Prince Pâtisserie</h2>
                        <p>Thông báo tin nhắn liên hệ mới từ Website</p>
                    </div>
                    <div class='content'>
                        <div class='info-group'>
                            <div class='label'>Họ & Tên người gửi:</div>
                            <div class='val'>{$safeName}</div>
                        </div>
                        <div class='info-group'>
                            <div class='label'>Địa chỉ Email:</div>
                            <div class='val'><a href='mailto:{$safeEmail}' style='color: #92A398; text-decoration: none;'>{$safeEmail}</a></div>
                        </div>
                        <div class='info-group'>
                            <div class='label'>Số điện thoại:</div>
                            <div class='val'>{$safePhone}</div>
                        </div>
                        <div class='info-group'>
                            <div class='label'>Chủ đề / Nhu cầu:</div>
                            <div class='val' style='color: #92A398; font-weight: bold;'>{$safeSubject}</div>
                        </div>
                        <div class='info-group' style='border-bottom: none;'>
                            <div class='label'>Nội dung tin nhắn:</div>
                            <div class='msg-box'>{$safeMessage}</div>
                        </div>
                    </div>
                    <div class='footer'>
                        Thư này được gửi tự động từ hệ thống Website vào lúc <strong>{$sentTime}</strong>.<br>
                        Vui lòng nhấn 'Reply' (Trả lời) thư này để trao đổi trực tiếp với khách hàng.
                    </div>
                </div>
            </body>
            </html>
            ";

            $mail->AltBody = "Tin nhắn từ {$name} ({$email}, SĐT: {$phone}) - Chủ đề: {$subjectTag}\n\nNội dung:\n{$message}";

            $mail->send();
        } catch (Exception $e) {
            error_log("PHPMailer Error: " . $mail->ErrorInfo);
            throw new \RuntimeException("Không thể gửi email: " . $mail->ErrorInfo);
        }
    }
}