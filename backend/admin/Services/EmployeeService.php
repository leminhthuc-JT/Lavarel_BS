<?php
declare(strict_types=1);
namespace Admin\Services;

use Admin\Repositories\EmployeeRepository;
use Admin\Requests\EmployeeRequest;
use Shared\Helpers\MongoValue;

final class EmployeeService extends BaseCrudService
{
    public function __construct()
    {
        parent::__construct(new EmployeeRepository());
    }

    protected function codeField(): string { return 'MaNV'; }

    protected function validate(array $data, bool $isUpdate = false): array
    {
        return EmployeeRequest::validate($data, $isUpdate);
    }

    protected function sort(): array
    {
        return ['NgayVaoLam' => -1];
    }

    protected function projection(): array
    {
        return ['TaiKhoan.MatKhau' => 0];
    }

    protected function buildFilter(string $search, string $status): array
    {
        $filter = $this->regexFilter(
            $search,
            ['MaNV', 'HoTen', 'ChucVu', 'SDT', 'TaiKhoan.Email']
        );

        if ($status !== '') {
            $filter['TrangThai'] = $status;
        }

        return $filter;
    }

    protected function prepare(array $data, bool $isUpdate = false): array
    {
        foreach (['NgaySinh', 'NgayVaoLam'] as $field) {
            if (isset($data[$field])) {
                $data[$field] = MongoValue::date($data[$field]);
            }
        }

        if (isset($data['TaiKhoan']['MatKhau']) && $data['TaiKhoan']['MatKhau'] !== '') {
            $data['TaiKhoan']['MatKhau'] = password_hash(
                (string) $data['TaiKhoan']['MatKhau'],
                PASSWORD_DEFAULT
            );
        } elseif (isset($data['TaiKhoan']['MatKhau'])) {
            unset($data['TaiKhoan']['MatKhau']);
        }

        return $data;
    }

    protected function afterSerialize(array $document): array
    {
        if (isset($document['TaiKhoan']['MatKhau'])) {
            unset($document['TaiKhoan']['MatKhau']);
        }

        return $document;
    }
}
