<?php
declare(strict_types=1);
namespace Admin\Services;

use Admin\Repositories\OrderRepository;
use Admin\Requests\OrderRequest;
use Shared\Helpers\MongoValue;

final class OrderService extends BaseCrudService
{
    public function __construct()
    {
        parent::__construct(new OrderRepository());
    }

    protected function codeField(): string { return 'MaDH'; }

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
