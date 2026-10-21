<?php
declare(strict_types=1);
namespace App\Services\Client;

use App\Repositories\Client\ProductRepository;
use App\Helpers\DocumentSerializer;

final class ProductService
{
    public function list(): array
    {
        $repo = new ProductRepository();

        $items = $repo->paginate(
            ['TrangThai' => 'Đang bán'],
            1,
            100,
            ['NgayBan' => -1]
        );

        return array_map(
            fn ($item) => $this->productReviews(DocumentSerializer::document($item)),
            $items
        );
    }

    public function show(string $code): array
    {
        $item = (new ProductRepository())->findByCode($code);

        if ($item === null) {
            throw new \RuntimeException('Không tìm thấy sản phẩm');
        }

        return $this->productReviews(DocumentSerializer::document($item), true);
    }

    private function productReviews(array $product, bool $withNames = false): array
    {
        $reviews = $product['DanhGia'] ?? [];
        if (isset($reviews['SoSao']) || isset($reviews['BinhLuan'])) $reviews = [$reviews];
        $product['DanhGia'] = array_values(array_filter(is_array($reviews) ? $reviews : [], static fn ($review) =>
            is_array($review) && (!isset($review['MaSP']) || $review['MaSP'] === $product['MaSP'])));
        if ($withNames) {
            $codes = array_values(array_unique(array_filter(array_column($product['DanhGia'], 'MaKH'))));
            $names = (new ProductRepository())->reviewCustomerNames($codes);
            foreach ($product['DanhGia'] as &$review) {
                if (isset($names[$review['MaKH'] ?? ''])) $review['HoTen'] = $names[$review['MaKH']];
            }
            unset($review);
        }
        return $product;
    }

    public function toggleReviewLike(string $maSP, string $reviewId, ?string $maKH, bool $liked): array
    {
        $repo = new ProductRepository();
        $product = $repo->findByCode($maSP);

        if ($product === null) {
            throw new \RuntimeException('Không tìm thấy sản phẩm');
        }

        $doc = DocumentSerializer::document($product);

        $reviews = $doc['DanhGia'] ?? [];
        $matchedReview = null;

        foreach ($reviews as &$review) {
            $id = is_array($review['_id'] ?? null)
                ? ($review['_id']['$oid'] ?? '')
                : (string)($review['_id'] ?? '');

            if ($id !== $reviewId) continue;

            $review['LuotThich'] = (int)($review['LuotThich'] ?? 0);

            if ($maKH) {
                $nguoiThich = $review['NguoiThich'] ?? [];
                if ($liked && !in_array($maKH, $nguoiThich, true)) {
                    $nguoiThich[] = $maKH;
                }
                if (!$liked) {
                    $nguoiThich = array_values(array_filter($nguoiThich, fn($x) => $x !== $maKH));
                }
                $review['NguoiThich'] = $nguoiThich;
            }

            $review['LuotThich'] = max(0, $review['LuotThich'] + ($liked ? 1 : -1));
            $review['DaThich']   = $liked;
            $matchedReview = $review;
            break;
        }
        unset($review);

        if ($matchedReview === null) {
            throw new \RuntimeException('Không tìm thấy đánh giá');
        }

        $repo->updateReviewLikes($maSP, $reviewId, $matchedReview);

        return [
            'LuotThich' => (int)($matchedReview['LuotThich'] ?? 0),
            'DaThich'   => $liked,
        ];
    }
}
