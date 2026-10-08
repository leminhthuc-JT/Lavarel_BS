<?php
declare(strict_types=1);
namespace Admin\Services;

use Admin\Repositories\CategoryRepository;
use Admin\Requests\CategoryRequest;
use Shared\Helpers\MongoValue;

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
        return $this->regexFilter($search, ['MaDM', 'TenDM', 'MoTa']);
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
