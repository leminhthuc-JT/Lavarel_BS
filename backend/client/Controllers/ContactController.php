<?php

declare(strict_types=1);

namespace Client\Controllers;

use Client\Services\ContactService;
use Shared\Helpers\Response;

final class ContactController
{
    private ContactService $service;

    public function __construct()
    {
        $this->service = new ContactService();
    }

    public function send(): never
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if (!is_array($input)) {
                $input = $_POST;
            }

            $this->service->sendContact($input);

            Response::success(
                null,
                'Cảm ơn bạn đã gửi liên hệ! Thông tin đã được gửi tới hòm thư tiệm bánh, chúng tôi sẽ phản hồi trong thời gian sớm nhất.'
            );
        } catch (\InvalidArgumentException $e) {
            Response::error($e->getMessage(), 400);
        } catch (\Throwable $e) {
            error_log("ContactController Error: " . $e->getMessage());
            Response::error($e->getMessage(), 500);
        }
    }
}