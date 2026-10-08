<?php

declare(strict_types=1);

namespace Admin\Repositories;

use Shared\Repositories\BaseRepository;

final class PromotionRepository extends BaseRepository
{
    protected function collectionName(): string
    {
        return 'KhuyenMais';
    }

    protected function codeField(): string
    {
        return 'MaKM';
    }
}
