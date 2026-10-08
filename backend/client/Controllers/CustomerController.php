<?php

declare(strict_types=1);

namespace Client\Controllers;

use Client\Services\CustomerService;
use Shared\Helpers\Response;

final class CustomerController
{
    private CustomerService $service;

    public function __construct()
    {
        $this->service = new CustomerService();
    }

    public function show(string $code): never
    {
        try {
            Response::success($this->service->show($code));
        } catch (\Throwable $e) {
            Response::error($e->getMessage(), 404);
        }
    }
}
