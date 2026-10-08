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
}
