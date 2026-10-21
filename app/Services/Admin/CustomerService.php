<?php
declare(strict_types=1);
namespace App\Services\Admin;

use App\Repositories\Admin\CustomerRepository;
use Admin\Requests\CustomerRequest;
use App\Helpers\MongoValue;

final class CustomerService extends BaseCrudService
{
    public function __construct()
    {
        parent::__construct(new CustomerRepository());
    }

    public function resetPassword(string $code): string
    {
        $customer = $this->repository->findByCode($code);
        if (!$customer) throw new \OutOfBoundsException('Không tìm thấy khách hàng.');
        $temporary = bin2hex(random_bytes(10));
        if (!$this->repository->resetCustomerPassword($customer, password_hash($temporary, PASSWORD_DEFAULT))) {
            throw new \LogicException('Mật khẩu vừa thay đổi ở phiên khác. Vui lòng thử lại.');
        }
        return $temporary;
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
