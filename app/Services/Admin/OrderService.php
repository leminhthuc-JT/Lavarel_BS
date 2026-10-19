<?php
declare(strict_types=1);
namespace App\Services\Admin;

use App\Repositories\Admin\OrderRepository;
use Admin\Requests\OrderRequest;
use App\Helpers\MongoValue;

final class OrderService extends BaseCrudService
{
    public function __construct()
    {
        parent::__construct(new OrderRepository());
    }

    protected function codeField(): string { return 'MaDH'; }

    public function list(int $page = 1, int $limit = 10, string $search = '', string $status = ''): array
    {
        $result = parent::list($page, $limit, $search, $status);
        $result['filters'] = $this->repository->filterOptions();
        return $result;
    }

    protected function validate(array $data, bool $isUpdate = false): array
    {
        return OrderRequest::validate($data, $isUpdate);
    }

    protected function sort(): array
    {
        return ['NgayDat' => -1];
    }

    protected function buildFilter(string $search, string $status): array
    {
        $filter = $this->regexFilter(
            $search,
            ['MaDH', 'MaKH', 'SDTNguoiNhan', 'DiaChiNhan']
        );

        if ($status !== '') {
            $filter['TrangThaiDonHang'] = $status;
        }
        $data = request()->validate(['payment_status' => 'nullable|string|max:100']);
        if (!empty($data['payment_status'])) $filter['TrangThaiThanhToan'] = $data['payment_status'];

        return $filter;
    }

    protected function prepare(array $data, bool $isUpdate = false): array
    {
        foreach (['TongTienHang', 'GiamGia', 'PhiVanChuyen', 'TongThanhToan'] as $field) {
            if (isset($data[$field])) {
                $data[$field] = (float) $data[$field];
            }
        }

        if (isset($data['NgayDat'])) {
            $data['NgayDat'] = MongoValue::date($data['NgayDat']);
        } elseif (!$isUpdate) {
            $data['NgayDat'] = new \MongoDB\BSON\UTCDateTime();
        }

        $data['NgayCapNhat'] = new \MongoDB\BSON\UTCDateTime();

        return $data;
    }
}
