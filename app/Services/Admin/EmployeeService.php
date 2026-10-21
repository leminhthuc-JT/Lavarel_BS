<?php
declare(strict_types=1);
namespace App\Services\Admin;

use App\Repositories\Admin\EmployeeRepository;
use Admin\Requests\EmployeeRequest;
use App\Helpers\MongoValue;

final class EmployeeService extends BaseCrudService
{
    public function __construct()
    {
        parent::__construct(new EmployeeRepository());
    }

    public function setAccountLocked(string $code, bool $locked, bool $expected): void
    {
        $employee = $this->repository->findByCode($code);
        if (!$employee) throw new \OutOfBoundsException('Không tìm thấy nhân viên.');
        $actor = request()->attributes->get('account');
        if ($locked && (string) $employee['_id'] === (string) ($actor['_id'] ?? '')) {
            throw new \InvalidArgumentException('Không thể tự khóa tài khoản đang đăng nhập.');
        }
        $current = !empty($employee['TaiKhoan']['BiKhoa']);
        if ($current !== $expected || $current === $locked) throw new \LogicException('Trạng thái tài khoản đã thay đổi. Vui lòng tải lại.');
        if (!$this->repository->setAccountLocked($employee, $locked)) throw new \LogicException('Tài khoản vừa thay đổi ở phiên khác. Vui lòng tải lại.');
    }

    public function resetPassword(string $code): string
    {
        $employee = $this->repository->findByCode($code);
        if (!$employee) throw new \OutOfBoundsException('Không tìm thấy nhân viên.');
        $temporary = bin2hex(random_bytes(10));
        if (!$this->repository->resetEmployeePassword($employee, password_hash($temporary, PASSWORD_DEFAULT))) {
            throw new \LogicException('Mật khẩu vừa thay đổi ở phiên khác. Vui lòng thử lại.');
        }
        return $temporary;
    }

    public function update(string $code, array $input): void
    {
        if (($input['TrangThai'] ?? '') === 'Bị khóa') {
            $employee = $this->repository->findByCode($code);
            $actor = request()->attributes->get('account');
            if ($employee && (string) $employee['_id'] === (string) ($actor['_id'] ?? '')) {
                throw new \InvalidArgumentException('Không thể tự khóa tài khoản đang đăng nhập.');
            }
        }
        parent::update($code, $input);
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

        $actor = request()->attributes->get('account');
        $document['CanLockAccount'] = (string) ($document['_id'] ?? '') !== (string) ($actor['_id'] ?? '');
        return $document;
    }
}
