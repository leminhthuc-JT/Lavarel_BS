<?php

declare(strict_types=1);

namespace Admin\Repositories;

use Shared\Repositories\BaseRepository;

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
