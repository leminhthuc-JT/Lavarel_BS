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

        \Illuminate\Support\Facades\Validator::make($data, [
            'ChucVu' => 'required|string|max:100', 'NgayVaoLam' => 'nullable|date',
        ])->validate();
        return $data;
    }
}
