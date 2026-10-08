<?php

declare(strict_types=1);

namespace App\Repositories\Admin;

use App\Repositories\BaseRepository;

final class EmployeeRepository extends BaseRepository
{
    protected function collectionName(): string
    {
        return 'NhanViens';
    }

    protected function codeField(): string
    {
        return 'MaNV';
    }
}
