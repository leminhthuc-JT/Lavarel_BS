<?php
declare(strict_types=1);
namespace Client\Services;

use Client\Repositories\ProductRepository;
use Shared\Helpers\DocumentSerializer;

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
            fn ($item) => DocumentSerializer::document($item),
            $items
        );
    }

    public function show(string $code): array
    {
        $item = (new ProductRepository())->findByCode($code);

        if ($item === null) {
            throw new \RuntimeException('Không tìm thấy sản phẩm');
        }

        return DocumentSerializer::document($item);
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

        $repo->updateByCode($maSP, ['DanhGia' => $reviews]);

        return [
            'LuotThich' => (int)($matchedReview['LuotThich'] ?? 0),
            'DaThich'   => $liked,
        ];
    }
}
