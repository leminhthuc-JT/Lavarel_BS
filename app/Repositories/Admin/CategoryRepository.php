<?php

declare(strict_types=1);

namespace App\Repositories\Admin;

use App\Repositories\BaseRepository;

final class CategoryRepository extends BaseRepository
{
    protected function collectionName(): string
    {
        return 'DanhMucs';
    }

    protected function codeField(): string
    {
        return 'MaDM';
    }
}
