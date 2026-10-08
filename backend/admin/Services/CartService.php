<?php
declare(strict_types=1);
namespace Admin\Services;

use Admin\Repositories\CartRepository;
use Admin\Requests\CartRequest;

final class CartService extends BaseCrudService
{
    public function __construct()
    {
        parent::__construct(new CartRepository());
    }

    protected function codeField(): string { return 'MaKH'; }

    protected function validate(array $data, bool $isUpdate = false): array
    {
        return CartRequest::validate($data, $isUpdate);
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
        if (isset($data['TongTien'])) {
            $data['TongTien'] = (float) $data['TongTien'];
        }

        $data['NgayCapNhat'] = new \MongoDB\BSON\UTCDateTime();

        return $data;
    }
}
