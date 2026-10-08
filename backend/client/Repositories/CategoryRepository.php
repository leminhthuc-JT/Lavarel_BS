<?php

declare(strict_types=1);

namespace Client\Repositories;

use Shared\Repositories\BaseRepository;

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
