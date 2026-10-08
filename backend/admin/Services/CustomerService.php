<?php
declare(strict_types=1);
namespace Admin\Services;

use Admin\Repositories\CustomerRepository;
use Admin\Requests\CustomerRequest;
use Shared\Helpers\MongoValue;

final class CustomerService extends BaseCrudService
{
    public function __construct()
    {
        parent::__construct(new CustomerRepository());
    }

    protected function codeField(): string { return 'MaKH'; }

    protected function validate(array $data, bool $isUpdate = false): array
    {
        return CustomerRequest::validate($data, $isUpdate);
    }

    protected function sort(): array
    {
        return ['NgayDangKy' => -1];
    }

    protected function projection(): array
    {
        return ['TaiKhoan.MatKhau' => 0];
    }

    protected function buildFilter(string $search, string $status): array
    {
        $filter = $this->regexFilter(
            $search,
            ['MaKH', 'HoTen', 'Email', 'SDT']
        );

        if ($status !== '') {
            $filter['TrangThai'] = $status;
        }

        return $filter;
    }

    protected function prepare(array $data, bool $isUpdate = false): array
    {
        foreach (['NgaySinh', 'NgayDangKy'] as $field) {
            if (isset($data[$field])) {
                $data[$field] = MongoValue::date($data[$field]);
            }
        }

        if (!$isUpdate && !isset($data['NgayDangKy'])) {
            $data['NgayDangKy'] = new \MongoDB\BSON\UTCDateTime();
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
