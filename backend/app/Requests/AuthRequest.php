<?php

class AuthRequest
{
    public static function validateRegister(array $data): array
    {
        $fullName = trim($data['fullName'] ?? '');
        $email = strtolower(trim($data['email'] ?? ''));
        $password = $data['password'] ?? '';

        if ($fullName === '') {
            throw new Exception('Vui lòng nhập họ và tên.');
        }

        if (mb_strlen($fullName) < 2) {
            throw new Exception('Họ và tên không hợp lệ.');
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
            throw new Exception(
                'Mật khẩu phải có ít nhất 6 ký tự.'
            );
        }

        return [
            'fullName' => $fullName,
            'email' => $email,
            'password' => $password
        ];
    }


    public static function validateLogin(array $data): array
    {
        $email = strtolower(trim($data['email'] ?? ''));
        $password = $data['password'] ?? '';

        if ($email === '' || $password === '') {
            throw new Exception(
                'Vui lòng nhập email và mật khẩu.'
            );
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Email không hợp lệ.');
        }

        return [
            'email' => $email,
            'password' => $password
        ];
    }


    public static function validateGoogle(array $data): array
    {
        $credential = trim($data['credential'] ?? '');

        if ($credential === '') {
            throw new Exception(
                'Không nhận được thông tin đăng nhập Google.'
            );
        }

        return [
            'credential' => $credential
        ];
    }


    public static function validateForgotPassword(array $data): array
    {
        $email = strtolower(trim($data['email'] ?? ''));

        if ($email === '') {
            throw new Exception('Vui lòng nhập email.');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Email không hợp lệ.');
        }

        return [
            'email' => $email
        ];
    }


    public static function validateResetPassword(array $data): array
    {
        $token = trim($data['token'] ?? '');
        $password = $data['password'] ?? '';
        $confirmPassword = $data['confirmPassword'] ?? '';

        if ($token === '') {
            throw new Exception(
                'Liên kết đặt lại mật khẩu không hợp lệ.'
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

        if ($password !== $confirmPassword) {
            throw new Exception(
                'Mật khẩu xác nhận không khớp.'
            );
        }

        return [
            'token' => $token,
            'password' => $password
        ];
    }
}