<?php

declare(strict_types=1);

namespace Admin\Repositories;

use Shared\Repositories\BaseRepository;

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
