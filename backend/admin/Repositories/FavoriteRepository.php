<?php

declare(strict_types=1);

namespace Admin\Repositories;

use Shared\Repositories\BaseRepository;

final class FavoriteRepository extends BaseRepository
{
    protected function collectionName(): string
    {
        return 'YeuThichs';
    }

    protected function codeField(): string
    {
        return 'MaKH';
    }
}
