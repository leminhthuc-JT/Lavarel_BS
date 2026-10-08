<?php
declare(strict_types=1);
namespace App\Services\Client;

use App\Repositories\Client\PromotionRepository;
use App\Helpers\DocumentSerializer;

final class PromotionService
{
    public function active(): array
    {
        $items = (new PromotionRepository())->paginate(
            ['TrangThai' => 'Đang hoạt động'],
            1,
            100,
            ['NgayBatDau' => -1]
        );

        return array_map(
            fn ($item) => DocumentSerializer::document($item),
            $items
        );
    }
}
