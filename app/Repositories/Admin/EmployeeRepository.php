<?php

declare(strict_types=1);

namespace App\Repositories\Admin;

use App\Repositories\BaseRepository;

final class EmployeeRepository extends BaseRepository
{
    public function resetEmployeePassword(mixed $employee, string $hash): bool
    {
        return $this->collection->updateOne([
            '_id' => $employee['_id'],
            'TaiKhoan.MatKhau' => $employee['TaiKhoan']['MatKhau'] ?? null,
            'TaiKhoan.SessionVersion' => $employee['TaiKhoan']['SessionVersion'] ?? null,
        ], [
            '$set' => ['TaiKhoan.MatKhau' => $hash, 'TaiKhoan.MustChangePassword' => true,
                'updatedAt' => new \MongoDB\BSON\UTCDateTime()],
            '$inc' => ['TaiKhoan.SessionVersion' => 1],
            '$unset' => ['resetPasswordToken' => '', 'resetPasswordExpiresAt' => ''],
        ])->getModifiedCount() === 1;
    }

    public function setAccountLocked(mixed $employee, bool $locked): bool
    {
        return $this->collection->updateOne([
            '_id' => $employee['_id'], 'TaiKhoan.BiKhoa' => $employee['TaiKhoan']['BiKhoa'] ?? null,
            'TaiKhoan.SessionVersion' => $employee['TaiKhoan']['SessionVersion'] ?? null,
        ], [
            '$set' => ['TaiKhoan.BiKhoa' => $locked, 'updatedAt' => new \MongoDB\BSON\UTCDateTime()],
            '$inc' => ['TaiKhoan.SessionVersion' => 1],
        ])->getModifiedCount() === 1;
    }

    protected function collectionName(): string
    {
        return 'NhanViens';
    }

    protected function codeField(): string
    {
        return 'MaNV';
    }
}
