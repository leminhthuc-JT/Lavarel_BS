<?php
declare(strict_types=1);
namespace App\Services\Admin;

use App\Repositories\Admin\CategoryRepository;
use Admin\Requests\CategoryRequest;
use App\Helpers\MongoValue;

final class CategoryService extends BaseCrudService
{
    public function __construct()
    {
        parent::__construct(new CategoryRepository());
    }

    protected function codeField(): string { return 'MaDM'; }

    protected function validate(array $data, bool $isUpdate = false): array
    {
        return CategoryRequest::validate($data, $isUpdate);
    }

    protected function sort(): array
    {
        return ['MaDM' => 1];
    }

    protected function buildFilter(string $search, string $status): array
    {
        $dates = request()->validate([
            'created_from' => 'nullable|date_format:Y-m-d',
            'created_to' => 'nullable|date_format:Y-m-d' . (request()->filled('created_from') ? '|after_or_equal:created_from' : ''),
        ]);
        $filter = $this->regexFilter($search, ['MaDM', 'TenDM', 'MoTa']);
        if (!empty($dates['created_from'])) {
            $filter['NgayTao']['$gte'] = MongoValue::date($dates['created_from'] . ' 00:00:00');
        }
        if (!empty($dates['created_to'])) {
            $filter['NgayTao']['$lt'] = MongoValue::date(
                \Carbon\Carbon::parse($dates['created_to'])->addDay()->format('Y-m-d 00:00:00')
            );
        }
        return $filter;
    }

    protected function prepare(array $data, bool $isUpdate = false): array
    {
        if (isset($data['NgayTao'])) {
            $data['NgayTao'] = MongoValue::date($data['NgayTao']);
        } elseif (!$isUpdate) {
            $data['NgayTao'] = new \MongoDB\BSON\UTCDateTime();
        }

        return $data;
    }
}
