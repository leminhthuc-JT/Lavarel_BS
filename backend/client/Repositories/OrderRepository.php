<?php

declare(strict_types=1);

namespace Client\Repositories;

use Shared\Repositories\BaseRepository;

final class OrderRepository extends BaseRepository
{
    protected function collectionName(): string
    {
        return 'DonHangs';
    }

    protected function codeField(): string
    {
        return 'MaDH';
    }

    /** Lấy tất cả đơn hàng theo bộ lọc (ví dụ: ['MaKH' => $maKH]) */
    public function find(array $filter = [], array $sort = ['NgayDat' => -1]): array
    {
        return $this->collection->find($filter, ['sort' => $sort])->toArray();
    }
}
