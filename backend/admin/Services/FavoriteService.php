<?php
declare(strict_types=1);
namespace Admin\Services;

use Admin\Repositories\FavoriteRepository;
use Admin\Requests\FavoriteRequest;
use Shared\Helpers\MongoValue;

final class FavoriteService extends BaseCrudService
{
    public function __construct()
    {
        parent::__construct(new FavoriteRepository());
    }

    protected function codeField(): string { return 'MaKH'; }

    protected function validate(array $data, bool $isUpdate = false): array
    {
        return FavoriteRequest::validate($data, $isUpdate);
    }

    protected function sort(): array
    {
        return ['NgayCapNhat' => -1];
    }

    protected function buildFilter(string $search, string $status): array
    {
        return $this->regexFilter($search, ['MaKH']);
    }

    protected function prepare(array $data, bool $isUpdate = false): array
    {
        if (isset($data['SanPhams']) && is_array($data['SanPhams'])) {
            $data['SanPhams'] = array_map(
                function ($item) {
                    return [
                        'MaSP' => (string) ($item['MaSP'] ?? ''),
                        'NgayThem' => !empty($item['NgayThem'])
                            ? MongoValue::date($item['NgayThem'])
                            : new \MongoDB\BSON\UTCDateTime()
                    ];
                },
                $data['SanPhams']
            );
        }

        $data['NgayCapNhat'] = new \MongoDB\BSON\UTCDateTime();

        return $data;
    }
}
