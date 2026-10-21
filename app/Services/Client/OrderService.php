<?php
declare(strict_types=1);
namespace App\Services\Client;

use App\Repositories\Client\OrderRepository;
use App\Helpers\DocumentSerializer;
use Shared\Helpers\Response;

final class OrderService
{
    private OrderRepository $repo;

    public function __construct()
    {
        $this->repo = new OrderRepository();
    }

    /** Create a new order for a customer */
    public function create(string $maKH, array $orderData): array
    {
        // Expected orderData: ['SanPhams'=>[], 'TongThanhToan'=>float, ...]
        $order = array_merge([
            'MaKH' => $maKH,
            'TrangThaiDonHang' => 'Mới',
            'TrangThaiThanhToan' => 'Chưa thanh toán',
        ], $orderData);

        // Luôn đảm bảo NgayDat là UTCDateTime của MongoDB
        $order['NgayDat'] = new \MongoDB\BSON\UTCDateTime();

        $this->repo->insert($order);

        // Dọn dẹp các sản phẩm đã mua khỏi collection GioHangs
        try {
            $cartService = new CartService();
            $currentCart = $cartService->getByCustomer($maKH);
            $cartItems = $currentCart['SanPhams'] ?? [];

            if (!empty($cartItems)) {
                $orderedProductIds = array_map(function ($sp) {
                    return (string)($sp['MaSP'] ?? '');
                }, $orderData['SanPhams'] ?? []);

                // Lọc bỏ những sản phẩm đã có trong đơn hàng (hoặc những sản phẩm có Chon: true)
                $remainingCartItems = array_values(array_filter($cartItems, function ($item) use ($orderedProductIds) {
                    $maSP = (string)($item['MaSP'] ?? '');
                    return !in_array($maSP, $orderedProductIds, true);
                }));

                $cartService->syncCart($maKH, $remainingCartItems);
            }
        } catch (\Throwable $e) {
            error_log('Lỗi cập nhật GioHangs sau khi tạo đơn hàng: ' . $e->getMessage());
        }

        return DocumentSerializer::document($order);
    }

    /** Get orders of a customer */
    public function myOrders(string $maKH): array
    {
        $items = $this->repo->find(['MaKH' => $maKH]);
        return array_map(fn($doc) => $this->withReviewReplies(DocumentSerializer::document($doc)), $items);
    }

    /** Get a single order by code */
    public function get(string $code): array
    {
        $doc = $this->repo->findByCode($code);
        if ($doc === null) {
            throw new \RuntimeException('Không tìm thấy đơn hàng');
        }
        return $this->withReviewReplies(DocumentSerializer::document($doc));
    }

    /** Khách xác nhận đã nhận hàng → TrangThaiDonHang = 'Đã nhận hàng' */
    public function confirmReceived(string $code): array
    {
        $doc = $this->repo->findByCode($code);
        if ($doc === null) {
            throw new \RuntimeException('Không tìm thấy đơn hàng');
        }
        $order = DocumentSerializer::document($doc);

        if (($order['TrangThaiDonHang'] ?? '') !== 'Đã giao') {
            throw new \RuntimeException('Chỉ có thể xác nhận khi đơn hàng ở trạng thái Đã giao');
        }

        $this->repo->updateByCode($code, [
            'TrangThaiDonHang' => 'Đã nhận hàng',
            'NgayNhanHang' => new \MongoDB\BSON\UTCDateTime(),
        ]);

        $updated = DocumentSerializer::document($this->repo->findByCode($code));
        return $updated;
    }

    /**
     * Lưu đánh giá cho từng sản phẩm trong đơn hàng
     * @param string $code Mã đơn hàng (MaDH)
     * @param array $reviews Danh sách đánh giá [{ MaSP, SoSao, BinhLuan, LoaiBL }]
     * @param string $maKH Mã khách hàng
     */
    public function submitRating(string $code, array $reviews, string $maKH): array
    {
        $doc = $this->repo->findByCode($code);
        if ($doc === null) {
            throw new \RuntimeException('Không tìm thấy đơn hàng');
        }
        $order = DocumentSerializer::document($doc);

        $allowed = ['Đã nhận hàng', 'Đã giao'];
        if (!in_array($order['TrangThaiDonHang'] ?? '', $allowed, true)) {
            throw new \RuntimeException('Chỉ có thể đánh giá sau khi đã nhận hàng');
        }

        if (!empty($order['DanhGia'])) {
            throw new \RuntimeException('Đơn hàng này đã được đánh giá rồi');
        }

        if (($order['MaKH'] ?? '') !== $maKH) throw new \InvalidArgumentException('Đánh giá không thuộc tài khoản này.');
        \Illuminate\Support\Facades\Validator::make(['reviews' => $reviews], [
            'reviews' => 'required|array|min:1|max:100', 'reviews.*' => 'required|array',
            'reviews.*.MaSP' => 'required|string|max:50', 'reviews.*.SoSao' => 'required|integer|between:1,5',
            'reviews.*.BinhLuan' => 'nullable|string|max:2000', 'reviews.*.LoaiBL' => 'nullable|string|max:100',
        ])->validate();
        $productRepo = new \App\Repositories\Client\ProductRepository();
        $orderedCodes = array_column($order['SanPhams'] ?? [], 'MaSP');
        $products = [];
        // Validate the entire submission before writing any review.
        foreach ($reviews as $item) {
            $productCode = $item['MaSP'];
            if (!in_array($productCode, $orderedCodes, true) || isset($products[$productCode])) {
                throw new \InvalidArgumentException('Sản phẩm không thuộc đơn hàng hoặc bị đánh giá trùng.');
            }
            $product = $productRepo->findByCode($productCode);
            if (!$product) throw new \OutOfBoundsException('Không tìm thấy sản phẩm trong đơn hàng.');
            $products[$productCode] = DocumentSerializer::document($product);
        }
        $savedOrderRatings = [];
        foreach ($reviews as $item) {
            $productCode = $item['MaSP'];
            $review = ['_id' => new \MongoDB\BSON\ObjectId(), 'MaSP' => $productCode,
                'MaKH' => $maKH, 'MaDH' => $code, 'SoSao' => (int) $item['SoSao'],
                'BinhLuan' => trim($item['BinhLuan'] ?? ''), 'LoaiBL' => trim($item['LoaiBL'] ?? 'Tích cực'),
                'NgayDang' => new \MongoDB\BSON\UTCDateTime(), 'LuotThich' => 0];
            $productRepo->pushReview($productCode, $review);
            $stored = DocumentSerializer::document($productRepo->findByCode($productCode));
            $matches = array_values(array_filter($stored['DanhGia'] ?? [], static fn ($entry) =>
                ($entry['MaDH'] ?? '') === $code && ($entry['MaKH'] ?? '') === $maKH));
            if (count($matches) !== 1) throw new \RuntimeException('Đánh giá có liên kết không rõ ràng. Vui lòng liên hệ cửa hàng.');
            $canonical = $matches[0];
            $images = $products[$productCode]['HinhAnh'] ?? [];
            $savedOrderRatings[] = array_intersect_key($canonical, array_flip(['_id', 'MaSP', 'MaKH', 'MaDH', 'SoSao', 'BinhLuan', 'LoaiBL', 'NgayDang'])) + [
                'MaSP' => $productCode, 'TenSP' => $products[$productCode]['TenSP'] ?? '',
                'HinhAnh' => is_array($images) ? ($images[0] ?? '') : $images,
            ];
        }

        // Cập nhật đơn hàng: lưu DanhGia
        $this->repo->updateByCode($code, ['DanhGia' => $savedOrderRatings]);

        return ['DanhGia' => $savedOrderRatings];
    }
    private function withReviewReplies(array $order): array
    {
        if (empty($order['DanhGia']) || !is_array($order['DanhGia'])) return $order;
        $codes = array_values(array_filter(array_unique(array_column($order['DanhGia'], 'MaSP'))));
        $products = (new \App\Repositories\Client\ProductRepository())->all(['MaSP' => ['$in' => $codes]]);
        $byProduct = [];
        foreach ($products as $product) {
            $product = DocumentSerializer::document($product);
            $byProduct[$product['MaSP']] = $product['DanhGia'] ?? [];
        }
        $orderedCodes = array_column($order['SanPhams'] ?? [], 'MaSP');
        foreach ($order['DanhGia'] as &$snapshot) {
            unset($snapshot['TraLoi']); // Replies are read only from the owning product review.
            $productCode = $snapshot['MaSP'] ?? '';
            if (!in_array($productCode, $orderedCodes, true)) continue;
            $id = (string) ($snapshot['_id'] ?? '');
            $matches = array_values(array_filter($byProduct[$productCode] ?? [], static function ($review) use ($snapshot, $id, $productCode, $order) {
                if (($review['MaKH'] ?? '') !== ($order['MaKH'] ?? '')
                    || (isset($review['MaSP']) && $review['MaSP'] !== $productCode)
                    || (isset($review['MaDH']) && $review['MaDH'] !== $order['MaDH'])) return false;
                if ($id !== '') return (string) ($review['_id'] ?? '') === $id;
                // Legacy copies without an ID: accept only an exact, unique order/product/customer link.
                return ($review['MaDH'] ?? '') === $order['MaDH']
                    && ($review['BinhLuan'] ?? '') === ($snapshot['BinhLuan'] ?? '')
                    && (int) ($review['SoSao'] ?? 0) === (int) ($snapshot['SoSao'] ?? 0);
            }));
            if (count($matches) !== 1) continue;
            if (!empty($matches[0]['_id'])) $snapshot['_id'] = $matches[0]['_id'];
            if (!empty($matches[0]['TraLoi']['BinhLuan'])) $snapshot['TraLoi'] = $matches[0]['TraLoi'];
        }
        unset($snapshot);
        return $order;
    }

}


