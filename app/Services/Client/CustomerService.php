<?php

declare(strict_types=1);

namespace App\Services\Client;

use App\Repositories\Client\CustomerRepository;
use App\Helpers\DocumentSerializer;

final class CustomerService
{
    private CustomerRepository $repo;

    public function __construct()
    {
        $this->repo = new CustomerRepository();
    }

    public function show(string $code): array
    {
        $customer = $this->repo->findByCode($code);

        if ($customer === null) {
            throw new \RuntimeException('Khách hàng không tồn tại.');
        }

        $data = DocumentSerializer::document($customer);

        if (isset($data['TaiKhoan']['MatKhau'])) {
            unset($data['TaiKhoan']['MatKhau']);
        }

        return $data;
    }
}
