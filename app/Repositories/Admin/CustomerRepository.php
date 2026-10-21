<?php

declare(strict_types=1);

namespace App\Repositories\Admin;

use App\Repositories\BaseRepository;

final class CustomerRepository extends BaseRepository
{
    public function resetCustomerPassword(mixed $customer, string $hash): bool
    {
        return $this->collection->updateOne([
            '_id' => $customer['_id'],
            'TaiKhoan.MatKhau' => $customer['TaiKhoan']['MatKhau'] ?? null,
            'TaiKhoan.SessionVersion' => $customer['TaiKhoan']['SessionVersion'] ?? null,
        ], [
            '$set' => ['TaiKhoan.MatKhau' => $hash, 'TaiKhoan.MustChangePassword' => true,
                'updatedAt' => new \MongoDB\BSON\UTCDateTime()],
            '$inc' => ['TaiKhoan.SessionVersion' => 1],
            '$unset' => ['resetPasswordToken' => '', 'resetPasswordExpiresAt' => ''],
        ])->getModifiedCount() === 1;
    }

    protected function collectionName(): string
    {
        return 'KhachHangs';
    }

    protected function codeField(): string
    {
        return 'MaKH';
    }
}
