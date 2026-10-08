<?php
declare(strict_types=1);
namespace Client\Services;

use Client\Repositories\CartRepository;
use Client\Repositories\ProductRepository;
use Shared\Helpers\DocumentSerializer;

final class CartService
{
    private CartRepository $repo;
    private ?ProductRepository $productRepo = null;

    public function __construct()
    {
        $this->repo = new CartRepository();
    }

    private function getProductRepo(): ProductRepository
    {
        if ($this->productRepo === null) {
            $this->productRepo = new ProductRepository();
        }
        return $this->productRepo;
    }

    /**
     * Bổ sung / chuẩn hóa thông tin chi tiết của sản phẩm trong giỏ:
     * Tên bánh thật, ảnh thật, kích thước thật và số lượng tồn kho từ collection SanPhams
     */
    private function enrichItemDetails(array &$item): void
    {
        $maSP = trim((string)($item['MaSP'] ?? ''));
        if ($maSP === '') return;

        $prodDoc = $this->getProductRepo()->findByCode($maSP);
        if ($prodDoc === null) return;

        $prod = DocumentSerializer::document($prodDoc);

        // 1. Tên sản phẩm thật
        if (empty($item['TenSP']) || $item['TenSP'] === 'Bánh ngọt' || $item['TenSP'] === 'Sản phẩm') {
            $item['TenSP'] = $prod['TenSP'] ?? 'Bánh ngọt';
        }

        // 2. Hình ảnh thật
        if (empty($item['HinhAnh'])) {
            $images = $prod['HinhAnh'] ?? [];
            if (is_array($images) && count($images) > 0) {
                $item['HinhAnh'] = (string)$images[0];
            } elseif (is_string($images) && $images !== '') {
                $item['HinhAnh'] = $images;
            }
        }

        // 3. Tồn kho
        $tonKho = max(0, (int)($prod['SoLuong'] ?? 999));
        $item['TonKho'] = $tonKho;

        // Giới hạn số lượng không vượt quá tồn kho (nếu kho > 0)
        if ($tonKho > 0 && ($item['SoLuong'] ?? 1) > $tonKho) {
            $item['SoLuong'] = $tonKho;
        }

        // 4. Kích thước thật và Đơn giá
        $kichThuocList = $prod['KichThuoc'] ?? [];
        if (is_array($kichThuocList) && count($kichThuocList) > 0) {
            // Nếu chưa có TenKichThuoc hoặc là 'Tiêu chuẩn', tìm kích thước khớp với DonGia
            if (empty($item['TenKichThuoc']) || $item['TenKichThuoc'] === 'Tiêu chuẩn') {
                $donGia = (float)($item['DonGia'] ?? 0);
                $foundSize = null;

                if ($donGia > 0) {
                    foreach ($kichThuocList as $kt) {
                        if (abs((float)($kt['Gia'] ?? 0) - $donGia) < 1.0) {
                            $foundSize = $kt;
                            break;
                        }
                    }
                }

                if ($foundSize !== null) {
                    $item['TenKichThuoc'] = (string)($foundSize['Ten'] ?? 'Nhỏ');
                } else {
                    // Lấy kích thước đầu tiên
                    $first = $kichThuocList[0];
                    $item['TenKichThuoc'] = (string)($first['Ten'] ?? 'Nhỏ');
                    if ($donGia <= 0) {
                        $item['DonGia'] = (float)($first['Gia'] ?? 0);
                    }
                }
            }
        } else {
            if (empty($item['TenKichThuoc'])) {
                $item['TenKichThuoc'] = 'Tiêu chuẩn';
            }
            if (($item['DonGia'] ?? 0) <= 0) {
                $item['DonGia'] = (float)($prod['Gia'] ?? 0);
            }
        }
    }

    /** Lay gio hang cua khach hang */
    public function getByCustomer(string $maKH): array
    {
        $doc = $this->repo->findCartByCustomer($maKH);
        if ($doc === null) {
            return [
                'MaKH'     => $maKH,
                'SanPhams' => [],
                'TongTien' => 0
            ];
        }

        $cart = DocumentSerializer::document($doc);
        $sanPhams = $cart['SanPhams'] ?? [];

        if (is_array($sanPhams) && count($sanPhams) > 0) {
            foreach ($sanPhams as &$sp) {
                $this->enrichItemDetails($sp);
            }
            unset($sp);
            $cart['SanPhams'] = $sanPhams;
        }

        return $cart;
    }

    /**
     * Chuẩn hóa 1 sản phẩm giỏ hàng:
     * Giữ nguyên MaSP, TenSP, HinhAnh, TenKichThuoc, DonGia, SoLuong, Chon, TonKho
     */
    private function normalizeItem(array $raw): array
    {
        $maSP = (string)($raw['MaSP'] ?? $raw['maSP'] ?? $raw['id'] ?? $raw['_id'] ?? '');
        $soLuong = max(1, (int)($raw['SoLuong'] ?? $raw['quantity'] ?? 1));
        $donGia = (float)($raw['DonGia'] ?? $raw['Gia'] ?? $raw['price'] ?? 0);
        $chon = isset($raw['Chon']) ? (bool)$raw['Chon'] : true;

        $tenSP = (string)($raw['TenSP'] ?? $raw['name'] ?? '');
        $hinhAnh = (string)($raw['HinhAnh'] ?? '');
        $tenKichThuoc = (string)($raw['TenKichThuoc'] ?? $raw['size'] ?? '');
        $tonKho = isset($raw['TonKho']) ? (int)$raw['TonKho'] : 999;

        $item = [
            'MaSP'         => $maSP,
            'TenSP'        => $tenSP,
            'HinhAnh'      => $hinhAnh,
            'TenKichThuoc' => $tenKichThuoc,
            'DonGia'       => $donGia,
            'SoLuong'      => $soLuong,
            'Chon'         => $chon,
            'TonKho'       => $tonKho,
        ];

        // Tự động bù đắp thông tin từ collection SanPhams nếu còn thiếu
        $this->enrichItemDetails($item);

        return $item;
    }

    /**
     * Tính tổng tiền giỏ hàng (chỉ tính các sản phẩm có Chon === true)
     */
    private function calculateTongTien(array $sanPhams): float
    {
        return (float)array_reduce($sanPhams, function ($carry, $sp) {
            if (!empty($sp['Chon'])) {
                $gia = (float)($sp['DonGia'] ?? 0);
                $sl  = (int)($sp['SoLuong'] ?? 1);
                return $carry + ($gia * $sl);
            }
            return $carry;
        }, 0.0);
    }

    /**
     * Đồng bộ toàn bộ danh sách sản phẩm giỏ hàng từ client lên collection GioHangs
     */
    public function syncCart(string $maKH, array $rawItems): array
    {
        $sanPhams = [];
        foreach ($rawItems as $raw) {
            if (empty($raw['MaSP']) && empty($raw['maSP']) && empty($raw['id'])) {
                continue;
            }
            $sanPhams[] = $this->normalizeItem((array)$raw);
        }

        $tongTien = $this->calculateTongTien($sanPhams);

        $doc = [
            'MaKH'        => $maKH,
            'SanPhams'    => $sanPhams,
            'TongTien'    => $tongTien,
            'NgayCapNhat' => new \MongoDB\BSON\UTCDateTime(),
        ];

        $this->repo->upsertCart($maKH, $doc);

        return $this->getByCustomer($maKH);
    }

    /** Them / cap nhat san pham vao gio hang */
    public function upsertItem(string $maKH, array $item): array
    {
        $normalized = $this->normalizeItem($item);

        if ($normalized['MaSP'] === '') {
            throw new \InvalidArgumentException('Thiếu mã sản phẩm (MaSP)');
        }

        $cart = $this->repo->findCartByCustomer($maKH);
        $sanPhams = [];

        if ($cart !== null) {
            $arr = DocumentSerializer::document($cart);
            foreach (($arr['SanPhams'] ?? []) as $existing) {
                $sanPhams[] = $this->normalizeItem((array)$existing);
            }
        }

        // So sánh trùng khớp cả MaSP và TenKichThuoc
        $found = false;
        foreach ($sanPhams as &$sp) {
            if ($sp['MaSP'] === $normalized['MaSP'] && ($sp['TenKichThuoc'] ?? '') === ($normalized['TenKichThuoc'] ?? '')) {
                $maxStock = (int)($sp['TonKho'] ?? 999);
                $sp['SoLuong'] = min($maxStock, $sp['SoLuong'] + $normalized['SoLuong']);
                if ($normalized['DonGia'] > 0) {
                    $sp['DonGia'] = $normalized['DonGia'];
                }
                $sp['Chon'] = $normalized['Chon'];
                $found = true;
                break;
            }
        }
        unset($sp);

        if (!$found) {
            $sanPhams[] = $normalized;
        }

        $tongTien = $this->calculateTongTien($sanPhams);

        $doc = [
            'MaKH'        => $maKH,
            'SanPhams'    => $sanPhams,
            'TongTien'    => $tongTien,
            'NgayCapNhat' => new \MongoDB\BSON\UTCDateTime(),
        ];

        $this->repo->upsertCart($maKH, $doc);

        return $this->getByCustomer($maKH);
    }

    /** Cap nhat so luong hoac trang thai Chon mot item */
    public function updateItem(string $maKH, string $maSP, int $soLuong, ?bool $chon = null, ?string $tenKichThuoc = null): array
    {
        if ($soLuong < 0) {
            throw new \InvalidArgumentException('Số lượng không hợp lệ');
        }

        $cart = $this->repo->findCartByCustomer($maKH);
        if ($cart === null) {
            throw new \RuntimeException('Không tìm thấy giỏ hàng');
        }

        $arr = DocumentSerializer::document($cart);
        $sanPhams = [];
        foreach (($arr['SanPhams'] ?? []) as $existing) {
            $sanPhams[] = $this->normalizeItem((array)$existing);
        }

        if ($soLuong === 0) {
            $sanPhams = array_values(array_filter($sanPhams, function($s) use ($maSP, $tenKichThuoc) {
                if ($s['MaSP'] !== $maSP) return true;
                if ($tenKichThuoc !== null && ($s['TenKichThuoc'] ?? '') !== $tenKichThuoc) return true;
                return false;
            }));
        } else {
            foreach ($sanPhams as &$sp) {
                if ($sp['MaSP'] === $maSP) {
                    if ($tenKichThuoc === null || ($sp['TenKichThuoc'] ?? '') === $tenKichThuoc) {
                        $maxStock = (int)($sp['TonKho'] ?? 999);
                        $sp['SoLuong'] = min($maxStock, $soLuong);
                        if ($chon !== null) {
                            $sp['Chon'] = $chon;
                        }
                        break;
                    }
                }
            }
            unset($sp);
        }

        $tongTien = $this->calculateTongTien($sanPhams);

        $this->repo->upsertCart($maKH, [
            'MaKH'        => $maKH,
            'SanPhams'    => array_values($sanPhams),
            'TongTien'    => $tongTien,
            'NgayCapNhat' => new \MongoDB\BSON\UTCDateTime(),
        ]);

        return $this->getByCustomer($maKH);
    }

    /** Xoa mot san pham khoi gio hang */
    public function removeItem(string $maKH, string $maSP, ?string $tenKichThuoc = null): array
    {
        $cart = $this->repo->findCartByCustomer($maKH);
        if ($cart === null) {
            throw new \RuntimeException('Không tìm thấy giỏ hàng');
        }

        $arr = DocumentSerializer::document($cart);
        $sanPhams = [];
        foreach (($arr['SanPhams'] ?? []) as $existing) {
            $item = $this->normalizeItem((array)$existing);
            if ($item['MaSP'] === $maSP) {
                if ($tenKichThuoc !== null && ($item['TenKichThuoc'] ?? '') !== $tenKichThuoc) {
                    $sanPhams[] = $item;
                }
                // Nếu trùng thì bỏ qua (xóa)
            } else {
                $sanPhams[] = $item;
            }
        }

        $tongTien = $this->calculateTongTien($sanPhams);

        $this->repo->upsertCart($maKH, [
            'MaKH'        => $maKH,
            'SanPhams'    => $sanPhams,
            'TongTien'    => $tongTien,
            'NgayCapNhat' => new \MongoDB\BSON\UTCDateTime(),
        ]);

        return $this->getByCustomer($maKH);
    }

    /** Xoa toan bo gio hang */
    public function clearCart(string $maKH): void
    {
        $this->repo->upsertCart($maKH, [
            'MaKH'        => $maKH,
            'SanPhams'    => [],
            'TongTien'    => 0,
            'NgayCapNhat' => new \MongoDB\BSON\UTCDateTime(),
        ]);
    }
}
