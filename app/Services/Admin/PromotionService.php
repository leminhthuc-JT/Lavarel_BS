<?php
declare(strict_types=1);
namespace App\Services\Admin;

use App\Repositories\Admin\PromotionRepository;
use Admin\Requests\PromotionRequest;
use App\Helpers\MongoValue;

final class PromotionService extends BaseCrudService
{
    public function __construct()
    {
        parent::__construct(new PromotionRepository());
    }

    public function updateStatus(string $code, string $status): void
    {
        if (!in_array($status, ['Đang hoạt động', 'Ngừng hoạt động'], true)) {
            throw new \InvalidArgumentException('Trạng thái khuyến mãi không hợp lệ.');
        }

        $result = $this->repository->updateByCode($code, ['TrangThai' => $status]);
        if ($result->getMatchedCount() === 0) {
            throw new \OutOfBoundsException('Không tìm thấy khuyến mãi.');
        }
    }

    protected function codeField(): string { return 'MaKM'; }

    protected function validate(array $data, bool $isUpdate = false): array
    {
        return PromotionRequest::validate($data, $isUpdate);
    }

    protected function sort(): array
    {
        return ['NgayBatDau' => -1];
    }

    protected function buildFilter(string $search, string $status): array
    {
        $filter = $this->regexFilter(
            $search,
            ['MaKM', 'TenKM', 'MoTa']
        );

        if ($status !== '') {
            $filter['TrangThai'] = $status;
        }
        if (request()->filled('type')) $filter['LoaiKM'] = (string) request()->query('type');

        return $filter;
    }

    protected function prepare(array $data, bool $isUpdate = false): array
    {
        foreach (['GiaTri', 'GiaTriToiDa', 'DonToiThieu'] as $field) {
            if (array_key_exists($field, $data) && $data[$field] !== '' && $data[$field] !== null) {
                $data[$field] = (float) $data[$field];
            }
        }

        if (isset($data['SoLuong'])) {
            $data['SoLuong'] = (int) $data['SoLuong'];
        }

        if (isset($data['NgayBatDau'])) {
            $data['NgayBatDau'] = MongoValue::date($data['NgayBatDau']);
        }

        if (isset($data['NgayKetThuc'])) {
            $data['NgayKetThuc'] = MongoValue::date($data['NgayKetThuc']);
        }

        return $data;
    }
}
