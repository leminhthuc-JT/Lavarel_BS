<?php

declare(strict_types=1);

namespace App\Repositories\Admin;

use App\Repositories\BaseRepository;

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
