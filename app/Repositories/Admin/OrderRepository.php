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
