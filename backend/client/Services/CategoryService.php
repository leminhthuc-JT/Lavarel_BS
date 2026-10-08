<?php
declare(strict_types=1);
namespace Client\Services;

use Client\Repositories\CategoryRepository;
use Shared\Helpers\DocumentSerializer;

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
