<?php
declare(strict_types=1);
namespace Admin\Requests;

final class EmployeeRequest
{
    public static function validate(array $data, bool $isUpdate = false): array
    {
        Validation::required($data, [
            'MaNV' => $isUpdate ? null : 'Mã nhân viên',
            'HoTen' => 'Họ tên',
            'ChucVu' => 'Chức vụ'
        ]);

        return $data;
    }
}
