<?php

declare(strict_types=1);

namespace App\Repositories\Admin;

use App\Repositories\BaseRepository;

final class CartRepository extends BaseRepository
{
    protected function collectionName(): string
    {
        return 'Gios';
    }

    protected function codeField(): string
    {
        return 'MaKH';
    }
}
