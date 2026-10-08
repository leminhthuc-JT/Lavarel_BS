<?php
declare(strict_types=1);
namespace App\Services\Client;

use App\Repositories\Client\CategoryRepository;
use App\Helpers\DocumentSerializer;

final class CategoryService
{
    public function list(): array
    {
        $items = (new CategoryRepository())->paginate(
            [],
            1,
            100,
            ['MaDM' => 1]
        );

        return array_map(
            fn ($item) => DocumentSerializer::document($item),
            $items
        );
    }
}
