<?php

declare(strict_types=1);

namespace App\Repositories\Admin;

use App\Repositories\BaseRepository;

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

    public function updateStatusIfCurrent(mixed $order, array $changes): bool
    {
        $filter = ['_id' => $order['_id']];
        foreach (['TrangThaiDonHang', 'TrangThaiThanhToan', 'NgayCapNhat', 'GhiChu'] as $field) {
            $filter[$field] = $order[$field] ?? null;
        }
        return $this->collection->updateOne($filter, ['$set' => $changes])->getModifiedCount() === 1;
    }

    public function filterOptions(): array
    {
        $options = [];
        foreach (['orderStatuses' => 'TrangThaiDonHang', 'paymentStatuses' => 'TrangThaiThanhToan'] as $key => $field) {
            $values = array_values(array_filter($this->collection->distinct($field),
                static fn ($value) => is_string($value) && trim($value) !== ''));
            sort($values, SORT_STRING);
            $options[$key] = $values;
        }
        return $options;
    }
}
