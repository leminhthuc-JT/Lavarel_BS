<?php

declare(strict_types=1);

namespace Admin\Repositories;

use Shared\Repositories\BaseRepository;

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
