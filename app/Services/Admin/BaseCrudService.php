<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Helpers\DocumentSerializer;
use App\Repositories\BaseRepository;

abstract class BaseCrudService
{
    public function __construct(
        protected BaseRepository $repository
    ) {}

    abstract protected function codeField(): string;
    abstract protected function validate(array $data, bool $isUpdate = false): array;

    protected function projection(): array
    {
        return [];
    }

    protected function sort(): array
    {
        return ['_id' => -1];
    }

    protected function prepare(array $data, bool $isUpdate = false): array
    {
        return $data;
    }

    protected function afterSerialize(array $document): array
    {
        return $document;
    }

    protected function buildFilter(string $search, string $status): array
    {
        return [];
    }

    protected function regexFilter(string $search, array $fields): array
    {
        if ($search === '') {
            return [];
        }

        return [
            '$or' => array_map(
                fn ($field) => [
                    $field => [
                        '$regex' => preg_quote($search, '/'),
                        '$options' => 'i'
                    ]
                ],
                $fields
            )
        ];
    }

    public function list(
        int $page = 1,
        int $limit = 10,
        string $search = '',
        string $status = ''
    ): array {
        $filter = $this->buildFilter($search, $status);

        if ($this->codeField() === 'MaSP' && request()->filled('category')) {
            $filter['MaDM'] = (string) request()->query('category');
        }
        $total = $this->repository->count($filter);
        $page = min($page, max(1, (int) ceil($total / $limit)));
        $sort = $this->sort();
        $sort['_id'] ??= -1;
        $items = $this->repository->paginate(
            $filter,
            $page,
            $limit,
            $sort,
            $this->projection()
        );

        $items = array_map(
            fn ($item) => $this->afterSerialize(
                DocumentSerializer::document($item)
            ),
            $items
        );


        return [
            'items' => $items,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => max(1, (int) ceil($total / max(1, $limit)))
            ]
        ];
    }

    public function show(string $code): array
    {
        $item = $this->repository->findByCode(
            $code,
            $this->projection()
        );

        if ($item === null) {
            throw new \RuntimeException('Không tìm thấy dữ liệu');
        }

        return $this->afterSerialize(
            DocumentSerializer::document($item)
        );
    }

    public function create(array $input): array
    {
        $input = $this->editableFields($input);
        $input = $this->validateAccount($input);
        $this->validate($input);

        $code = strtoupper(
            trim((string) ($input[$this->codeField()] ?? ''))
        );
        if (!preg_match('/^[A-Z0-9_-]{1,50}$/', $code)) throw new \InvalidArgumentException('Mã chỉ gồm chữ, số, gạch ngang hoặc gạch dưới (tối đa 50 ký tự).');

        if ($this->repository->existsByCode($code)) {
            throw new \RuntimeException('Mã đã tồn tại');
        }

        $input[$this->codeField()] = $code;
        $data = $this->prepare($input, false);

        $result = $this->repository->insert($data);

        return [
            'id' => (string) $result->getInsertedId(),
            $this->codeField() => $code
        ];
    }

    public function update(string $code, array $input): void
    {
        $input = $this->editableFields($input);
        if (!$this->repository->existsByCode($code)) {
            throw new \RuntimeException('Dữ liệu không tồn tại');
        }

        $input = $this->validateAccount($input, $code);
        $this->validate($input, true);

        $data = $this->prepare($input, true);

        unset(
            $data[$this->codeField()],
            $data['_id']
        );

        $this->repository->updateByCode(
            $code,
            $data
        );
    }

    public function delete(string $code): void
    {
        if (!$this->repository->existsByCode($code)) {
            throw new \RuntimeException('Dữ liệu không tồn tại');
        }

        $db = \Illuminate\Support\Facades\DB::connection('mongodb')->getMongoDB();
        $relations = match (static::class) {
            CategoryService::class => ['SanPhams' => ['MaDM' => $code]],
            ProductService::class => [
                'DonHangs' => ['SanPhams.MaSP' => $code], 'GioHangs' => ['SanPhams.MaSP' => $code],
                'Gios' => ['SanPhams.MaSP' => $code], 'YeuThichs' => ['SanPhams.MaSP' => $code],
                'SanPhams' => ['MaSP' => $code, 'DanhGia.0' => ['$exists' => true]],
            ],
            CustomerService::class => [
                'DonHangs' => ['MaKH' => $code], 'GioHangs' => ['MaKH' => $code],
                'Gios' => ['MaKH' => $code], 'YeuThichs' => ['MaKH' => $code],
                'SanPhams' => ['DanhGia.MaKH' => $code],
            ],
            EmployeeService::class => ['DonHangs' => ['MaNV' => $code], 'SanPhams' => ['DanhGia.TraLoi.MaNV' => $code]],
            PromotionService::class => ['DonHangs' => ['$or' => [['MaKM' => $code], ['KhuyenMai.MaKM' => $code]]]],
            default => [],
        };
        foreach ($relations as $collection => $filter) {
            if ($db->selectCollection($collection)->countDocuments($filter, ['limit' => 1])) {
                throw new \RuntimeException('Dữ liệu đang được sử dụng. Hãy đổi trạng thái thay vì xóa.');
            }
        }
        $this->repository->deleteByCode($code);
    }

    private function validateAccount(array $data, ?string $code = null): array
    {
        if (!in_array(static::class, [CustomerService::class, EmployeeService::class], true)) return $data;
        $customer = static::class === CustomerService::class;
        \Illuminate\Support\Facades\Validator::make($data, [
            'HoTen' => 'required|string|max:150', 'SDT' => 'nullable|regex:/^[0-9+ .()-]{9,20}$/',
            'NgaySinh' => 'nullable|date|before_or_equal:today', 'DiaChi' => 'nullable|string|max:500',
            'TaiKhoan' => 'sometimes|array', 'TaiKhoan.Quyen.MaQ' => 'sometimes|string',
        ])->validate();
        $old = $code ? $this->repository->findByCode($code) : null;
        $email = trim((string) ($data['TaiKhoan']['Email'] ?? $data['Email'] ?? $old['TaiKhoan']['Email'] ?? ''));
        $password = $data['TaiKhoan']['MatKhau'] ?? '';
        \Illuminate\Support\Facades\Validator::make(['email' => $email, 'password' => $password, 'status' => $data['TrangThai'] ?? ''], [
            'email' => 'required|email|max:254',
            'password' => $code ? 'nullable|string|min:6' : 'required|string|min:6',
            'status' => $customer ? 'required|in:Hoạt động,Bị khóa' : 'required|in:Đang làm việc,Nghỉ việc,Bị khóa',
        ])->validate();
        $existing = (new \App\Repositories\UserRepository())->findByEmail($email);
        if ($existing && (!$old || (string) $existing['_id'] !== (string) $old['_id'])) {
            throw new \InvalidArgumentException('Email đã được sử dụng.');
        }
        $data['Email'] = $email;
        $role = $data['TaiKhoan']['Quyen']['MaQ'] ?? $old['TaiKhoan']['Quyen']['MaQ'] ?? ($customer ? 'KH' : 'NV');
        if (!in_array($role, $customer ? ['KH'] : ['MN', 'NV'], true)) throw new \InvalidArgumentException('Quyền tài khoản không hợp lệ.');
        // Dùng dotted paths để sửa email mà không xóa hash, quyền và mã tài khoản cũ.
        unset($data['TaiKhoan']);
        $data['TaiKhoan.Email'] = $email;
        $data['TaiKhoan.Quyen'] = ['MaQ' => $role, 'TenQ' => $role === 'MN' ? 'Quản trị viên' : ($customer ? 'Khách hàng' : 'Nhân viên')];
        if ($password !== '') $data['TaiKhoan.MatKhau'] = password_hash($password, PASSWORD_DEFAULT);
        if (!$code) {
            $data['TaiKhoan'] = ['Email' => $email, 'MatKhau' => $data['TaiKhoan.MatKhau'], 'Quyen' => $data['TaiKhoan.Quyen']];
            unset($data['TaiKhoan.Email'], $data['TaiKhoan.MatKhau'], $data['TaiKhoan.Quyen']);
            // prepare() của module sẽ hash mật khẩu một lần.
            $data['TaiKhoan']['MatKhau'] = $password;
        }
        return $data;
    }

    private function editableFields(array $data): array
    {
        $fields = match (static::class) {
            CustomerService::class => ['MaKH', 'HoTen', 'Email', 'SDT', 'NgaySinh', 'GioiTinh', 'DiaChi', 'TrangThai', 'TaiKhoan'],
            EmployeeService::class => ['MaNV', 'HoTen', 'Email', 'SDT', 'NgaySinh', 'NgayVaoLam', 'GioiTinh', 'DiaChi', 'ChucVu', 'TrangThai', 'TaiKhoan'],
            ProductService::class => ['MaSP', 'TenSP', 'MaDM', 'SoLuong', 'KichThuoc', 'HinhAnh', 'MoTa', 'TrangThai', 'NgayBan'],
            CategoryService::class => ['MaDM', 'TenDM', 'MoTa', 'NgayTao'],
            PromotionService::class => ['MaKM', 'TenKM', 'MoTa', 'LoaiKM', 'GiaTri', 'GiaTriToiDa', 'DonToiThieu', 'SoLuong', 'NgayBatDau', 'NgayKetThuc', 'TrangThai', 'PhamViApDung'],
            default => array_keys($data),
        };
        return array_intersect_key($data, array_flip($fields));
    }
}
