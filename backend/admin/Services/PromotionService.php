<?php
declare(strict_types=1);
namespace Admin\Services;

use Admin\Repositories\PromotionRepository;
use Admin\Requests\PromotionRequest;
use Shared\Helpers\MongoValue;

final class PromotionService extends BaseCrudService
{
    public function __construct()
    {
        parent::__construct(new PromotionRepository());
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
