<?php

declare(strict_types=1);

namespace App\Repositories\Admin;

use App\Repositories\BaseRepository;

final class CustomerRepository extends BaseRepository
{
    protected function collectionName(): string
    {
        return 'KhachHangs';
    }

    protected function codeField(): string
    {
        return 'MaKH';
    }
}
