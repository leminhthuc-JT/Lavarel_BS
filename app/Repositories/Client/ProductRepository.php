<?php

declare(strict_types=1);

namespace App\Repositories\Client;

use App\Repositories\BaseRepository;

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

    public function updateReviewLikes(string $code, string $reviewId, array $values): void
    {
        $ids = [$reviewId];
        if (preg_match('/^[a-f0-9]{24}$/i', $reviewId)) $ids[] = new \MongoDB\BSON\ObjectId($reviewId);
        $set = [];
        foreach (['LuotThich', 'NguoiThich', 'DaThich'] as $field) {
            if (array_key_exists($field, $values)) $set['DanhGia.$.' . $field] = $values[$field];
        }
        $this->collection->updateOne(
            ['MaSP' => $code, 'DanhGia._id' => ['$in' => $ids]], ['$set' => $set]
        );
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

