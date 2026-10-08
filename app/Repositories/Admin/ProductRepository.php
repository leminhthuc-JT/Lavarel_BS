<?php

declare(strict_types=1);

namespace App\Repositories\Admin;

use App\Repositories\BaseRepository;

final class ProductRepository extends BaseRepository
{
    protected function collectionName(): string
    {
        return 'SanPhams';
    }

    protected function codeField(): string
    {
        return 'MaSP';
    }
}
