<?php

declare(strict_types=1);
namespace App\Repositories\Admin;

use App\Repositories\BaseRepository;
use App\Helpers\DocumentSerializer;
use MongoDB\BSON\ObjectId;

final class ReviewRepository extends BaseRepository
{
    protected function collectionName(): string { return 'SanPhams'; }
    protected function codeField(): string { return 'MaSP'; }

    public function listReviews(string $search, string $status, int $page, int $limit): array
    {
        $pipeline = [['$unwind' => '$DanhGia']];
        $filter = [];
        if ($search !== '') {
            $regex = ['$regex' => preg_quote($search, '/'), '$options' => 'i'];
            $filter['$or'] = array_map(fn ($field) => [$field => $regex],
                ['MaSP', 'TenSP', 'DanhGia.MaKH', 'DanhGia.BinhLuan']);
        }
        if ($status === 'replied') {
            $filter['DanhGia.TraLoi.BinhLuan'] = ['$type' => 'string', '$ne' => ''];
        } elseif ($status === 'pending') {
            $filter['$and'] = [['$or' => [
                ['DanhGia.TraLoi.BinhLuan' => ['$exists' => false]],
                ['DanhGia.TraLoi.BinhLuan' => null],
                ['DanhGia.TraLoi.BinhLuan' => ''],
            ]]];
        }
        if ($filter !== []) $pipeline[] = ['$match' => $filter];
        $pipeline[] = ['$sort' => ['DanhGia.NgayDang' => -1, 'MaSP' => 1, 'DanhGia._id' => 1]];
        $pipeline[] = ['$facet' => [
            'items' => [
                ['$skip' => ($page - 1) * $limit], ['$limit' => $limit],
                ['$lookup' => [
                    'from' => 'KhachHangs', 'localField' => 'DanhGia.MaKH',
                    'foreignField' => 'MaKH', 'as' => 'customer',
                ]],
                ['$project' => [
                    '_id' => 0, 'MaSP' => 1, 'TenSP' => 1, 'DanhGia' => 1,
                    'TenKH' => ['$arrayElemAt' => ['$customer.HoTen', 0]],
                ]],
            ],
            'count' => [['$count' => 'total']],
        ]];
        $rows = $this->collection->aggregate($pipeline)->toArray();
        $data = DocumentSerializer::document($rows[0] ?? null);
        $total = (int) ($data['count'][0]['total'] ?? 0);
        return [
            'items' => $data['items'] ?? [],
            'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total,
                'totalPages' => max(1, (int) ceil($total / $limit))],
        ];
    }

    public function saveReply(string $code, string $reviewId, array $reply, ?string $customer = null): void
    {
        $product = $this->findByCode($code);
        if (!$product) throw new \OutOfBoundsException('Không tìm thấy sản phẩm.');
        $ids = [$reviewId];
        if (preg_match('/^[a-f0-9]{24}$/i', $reviewId)) $ids[] = new ObjectId($reviewId);
        $matches = [];
        foreach ($product['DanhGia'] ?? [] as $review) {
            foreach ($ids as $id) {
                if (get_debug_type($review['_id'] ?? null) === get_debug_type($id) && (string) $review['_id'] === (string) $id) {
                    $matches[] = $review; break;
                }
            }
        }
        if (!$matches) throw new \OutOfBoundsException('Không tìm thấy bình luận của sản phẩm này.');
        if (count($matches) !== 1) throw new \LogicException('Mã đánh giá bị trùng trong sản phẩm; cần kiểm tra dữ liệu gốc.');
        $review = $matches[0];
        if (empty($review['MaKH']) || ($customer !== null && $review['MaKH'] !== $customer)
            || (isset($review['MaSP']) && $review['MaSP'] !== $code)) {
            throw new \InvalidArgumentException('Đánh giá không khớp sản phẩm hoặc khách hàng.');
        }
        $result = $this->collection->updateOne([
            '_id' => $product['_id'], 'MaSP' => $code,
            'DanhGia' => ['$elemMatch' => ['_id' => $review['_id'], 'MaKH' => $review['MaKH']]],
        ], ['$set' => ['DanhGia.$.TraLoi' => $reply]]);
        if ($result->getMatchedCount() === 0) throw new \OutOfBoundsException('Đánh giá vừa thay đổi. Vui lòng tải lại.');
    }
}
