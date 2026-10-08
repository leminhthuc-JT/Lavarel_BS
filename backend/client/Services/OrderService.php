<?php
declare(strict_types=1);
namespace Client\Services;

use Client\Repositories\OrderRepository;
use Shared\Helpers\DocumentSerializer;
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
        return array_map(fn($doc)=>DocumentSerializer::document($doc), $items);
    }

    /** Get a single order by code */
    public function get(string $code): array
    {
        $doc = $this->repo->findByCode($code);
        if ($doc === null) {
            throw new \RuntimeException('Không tìm thấy đơn hàng');
        }
        return DocumentSerializer::document($doc);
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

        $nowMongo = new \MongoDB\BSON\UTCDateTime();
        $nowIso   = date('c');

        $productRepo = new \Client\Repositories\ProductRepository();
        $savedOrderRatings = [];

        foreach ($reviews as $item) {
            $maSP    = trim($item['MaSP'] ?? '');
            $soSao   = (int)($item['SoSao'] ?? 5);
            $binhLuan = trim($item['BinhLuan'] ?? '');
            $loaiBL  = trim($item['LoaiBL'] ?? 'Tích cực');

            if ($soSao < 1) $soSao = 1;
            if ($soSao > 5) $soSao = 5;

            // 1. Cấu trúc đánh giá chuẩn như trong ảnh lưu vào SanPhams
            $productReview = [
                '_id'       => new \MongoDB\BSON\ObjectId(),
                'MaKH'      => $maKH,
                'SoSao'     => $soSao,
                'BinhLuan'  => $binhLuan,
                'LuotThich' => 0,
                'NgayDang'  => $nowMongo,
                'LoaiBL'    => $loaiBL,
                'MaDH'      => $code,
            ];

            // Push vào mảng DanhGia của SanPhams
            if ($maSP !== '') {
                $productRepo->pushReview($maSP, $productReview);
            }

            // 2. Lưu vào đơn hàng để kiểm tra trạng thái và hiển thị lại
            $savedOrderRatings[] = [
                'MaSP'     => $maSP,
                'TenSP'    => $item['TenSP'] ?? '',
                'HinhAnh'  => $item['HinhAnh'] ?? '',
                'SoSao'    => $soSao,
                'BinhLuan' => $binhLuan,
                'LoaiBL'   => $loaiBL,
                'NgayDang' => $nowIso,
            ];
        }

        // Cập nhật đơn hàng: lưu DanhGia
        $this->repo->updateByCode($code, ['DanhGia' => $savedOrderRatings]);

        return ['DanhGia' => $savedOrderRatings];
    }
}


