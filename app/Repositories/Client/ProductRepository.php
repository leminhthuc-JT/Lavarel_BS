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

    public function reviewCustomerNames(array $codes): array
    {
        if (!$codes) return [];
        $customers = \Illuminate\Support\Facades\DB::connection('mongodb')->getMongoDB()->selectCollection('KhachHangs')
            ->find(['MaKH' => ['$in' => $codes]], ['projection' => ['MaKH' => 1, 'HoTen' => 1]]);
        $names = [];
        foreach ($customers as $customer) $names[$customer['MaKH']] = $customer['HoTen'] ?? '';
        return $names;
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
            ['MaSP' => $maSP, 'DanhGia' => ['$not' => ['$elemMatch' => ['MaDH' => $review['MaDH'], 'MaKH' => $review['MaKH']]]]],
            ['$push' => ['DanhGia' => $review]]
        );
    }
}

