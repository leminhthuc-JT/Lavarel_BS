<?php

declare(strict_types=1);

namespace Client\Repositories;

use Shared\Repositories\BaseRepository;

final class ProductRepository extends BaseRepository
{
    protected function collectionName(): string
    {
        return 'SanPhams';
    }

    protected function codeField(): string
    {
        return 'MaSP';
    }

    /**
     * Thêm một đánh giá mới vào mảng DanhGia của sản phẩm theo MaSP
     */
    public function pushReview(string $maSP, array $review)
    {
        return $this->collection->updateOne(
            ['MaSP' => $maSP],
            ['$push' => ['DanhGia' => $review]]
        );
    }
}

