<?php

declare(strict_types=1);

namespace App\Services\Client;

use Carbon\CarbonImmutable;
use Illuminate\Support\Str;

class ChatbotService
{
    public function __construct(private ChatbotData $data, private ChatbotGemini $gemini) {}

    public function reply(string $message, array $context, ?array $account): array
    {
        // Orders are never transmitted to the external model; identity comes only from middleware.
        $plain = Str::ascii(mb_strtolower($message));
        if (preg_match('/\b(don hang|ma don|don cua|thanh toan|huy don|giao hang|don gan nhat)\b/', $plain)) {
            return $this->orders($account);
        }
        $intent = $this->gemini->understand($this->redact($message), array_slice($context['turns'] ?? [], -8));
        if ($intent['intent'] === 'orders') return $this->orders($account);
        if ($intent['intent'] === 'promotions') return $this->promotions($intent['budget']);
        if ($intent['intent'] === 'help') return $this->result('Mình có thể tìm bánh, xem ưu đãi và tra cứu đơn của bạn. Để mua bánh, bạn vào trang Sản phẩm, chọn bánh và size, thêm vào Giỏ hàng rồi tiếp tục Thanh toán. Bạn thích hương vị nào và muốn chọn trong ngân sách bao nhiêu? Nếu cần chính sách cụ thể chưa có dữ liệu, bạn vui lòng hỏi cửa hàng qua trang Liên hệ nhé.');

        $search = $intent['search'];
        $codes = $intent['follow_up'] ? ($context['codes'] ?? []) : [];
        $budget = $intent['budget'] > 0 ? $intent['budget'] : null;
        if ($intent['follow_up'] && !$codes && $search === '') $search = $context['search'] ?? '';
        $items = $this->data->products($search, $budget, $codes);
        $products = [];
        foreach ($items as $item) {
            if (($item['TrangThai'] ?? '') !== 'Đang bán' || !empty($item['isSynthetic'])) continue;
            $sizes = [];
            foreach ($item['KichThuoc'] ?? [] as $size) {
                $price = $size['Gia'] ?? null;
                if (!is_numeric($price) || (float) $price <= 0 || ($budget !== null && $price > $budget)) continue;
                $sizes[] = ['name' => mb_substr((string) ($size['Ten'] ?? ''), 0, 60), 'price' => (float) $price];
            }
            if (!$sizes || empty($item['MaSP']) || empty($item['TenSP'])) continue;
            if ($intent['size'] !== '') {
                $matching = array_values(array_filter($sizes, fn ($s) => Str::ascii(mb_strtolower($s['name'])) === Str::ascii(mb_strtolower($intent['size']))));
                if ($matching) $sizes = $matching;
            }
            $image = $item['HinhAnh'] ?? '';
            if (is_array($image)) $image = $image[0] ?? '';
            $image = is_string($image) ? preg_replace('#^(\.\./)+assets/#', '/assets/', $image) : '';
            if ($image !== '' && !preg_match('#^(https?://|/(?!/))#i', $image)) {
                $image = preg_match('#^[\w./ -]+$#u', $image) && !str_contains($image, '..') ? '/assets/' . $image : '';
            }
            $products[] = ['code' => (string) $item['MaSP'], 'name' => mb_substr((string) $item['TenSP'], 0, 160),
                'sizes' => array_slice($sizes, 0, 12), 'image' => $image,
                'url' => route('details', ['code' => $item['MaSP']], false)];
            if (count($products) === 3) break;
        }
        $text = $products ? 'Mình tìm được những lựa chọn đang bán dưới đây. Bạn có thể xem và so sánh size, giá thực tế của từng bánh.'
            : 'Mình chưa tìm thấy bánh đang bán phù hợp. Bạn thử đổi tên bánh, hương vị hoặc ngân sách nhé.';
        if ($products && $intent['size'] !== '') $text = 'Đây là các size và giá hiện có của bánh bạn đang xem. Nếu tên size bạn hỏi chưa có, mình hiển thị các lựa chọn thực tế để bạn tham khảo.';
        return $this->result($text, $products, ['codes' => array_column($products, 'code'),
            'turn' => ['intent' => 'products', 'codes' => array_column($products, 'code'), 'names' => array_column($products, 'name'), 'budget' => $budget]]);
    }

    private function orders(?array $account): array
    {
        if (empty($account['MaKH']) || data_get($account, 'TaiKhoan.Quyen.MaQ') !== 'KH') {
            return $this->result('Bạn vui lòng đăng nhập bằng tài khoản khách hàng để xem đơn của mình tại trang Đăng nhập.');
        }
        $orders = $this->data->latestOrders((string) $account['MaKH']);
        $lines = [];
        foreach ($orders as $order) {
            if (($order['MaKH'] ?? '') !== $account['MaKH'] || !empty($order['isSynthetic'])) continue;
            $date = $this->date($order['NgayDat'] ?? null);
            $lines[] = ($order['MaDH'] ?? '') . ' · ' . ($date ? $date->format('d/m/Y H:i') : 'Chưa có ngày đặt')
                . "\n" . ($order['TrangThaiDonHang'] ?? 'Chưa có trạng thái') . ' · ' . ($order['TrangThaiThanhToan'] ?? 'Chưa có trạng thái thanh toán')
                . "\nTổng thanh toán: " . $this->money($order['TongThanhToan'] ?? 0);
        }
        return $this->result($lines ? "Các đơn gần nhất thuộc tài khoản của bạn:\n\n" . implode("\n\n", $lines) . "\n\nMình chỉ hỗ trợ tra cứu. Để xử lý đơn, bạn vui lòng dùng trang Đơn hàng hoặc liên hệ cửa hàng."
            : 'Tài khoản của bạn chưa có đơn hàng thực tế để tra cứu.');
    }

    private function promotions(int $budget): array
    {
        $now = CarbonImmutable::now('Asia/Ho_Chi_Minh');
        $lines = [];
        foreach ($this->data->promotions() as $promo) {
            $start = $this->date($promo['NgayBatDau'] ?? null);
            $end = $this->date($promo['NgayKetThuc'] ?? null);
            // Unknown scope/date is not enough evidence to advertise a coupon.
            if (!$start || !$end || $start > $now || $end->endOfDay() < $now || !empty($promo['isSynthetic'])
                || (isset($promo['TrangThai']) && $promo['TrangThai'] !== 'Đang hoạt động')
                || (array_key_exists('SoLuong', $promo) && (int) $promo['SoLuong'] <= 0)
                || ($promo['PhamViApDung'] ?? 'Toàn bộ') !== 'Toàn bộ') continue;
            $min = (float) ($promo['DonToiThieu'] ?? 0);
            if ($budget > 0 && $min > $budget) continue;
            $value = $promo['GiaTri'] ?? 0;
            if (!is_numeric($value) || $value <= 0 || empty($promo['MaKM'])) continue;
            $discount = ($promo['LoaiKM'] ?? '') === 'Phần trăm' ? $value . '%' : $this->money($value);
            $cap = !empty($promo['GiaTriToiDa']) ? ', tối đa ' . $this->money($promo['GiaTriToiDa']) : '';
            $lines[] = $promo['MaKM'] . ': giảm ' . $discount . $cap . ', đơn từ ' . $this->money($min) . '. Hạn ' . $end->format('d/m/Y') . '.';
            if (count($lines) === 3) break;
        }
        return $this->result($lines ? "Các ưu đãi đang còn hiệu lực, áp dụng toàn bộ sản phẩm:\n" . implode("\n", $lines)
            . "\nBạn cần đáp ứng điều kiện đơn tối thiểu; mã được kiểm tra lại tại bước thanh toán."
            : 'Hiện mình chưa xác nhận được mã giảm giá phù hợp, còn hiệu lực và đủ điều kiện áp dụng.');
    }

    private function date(mixed $value): ?CarbonImmutable
    {
        try {
            if ($value instanceof \MongoDB\BSON\UTCDateTime) $value = $value->toDateTime();
            return $value ? CarbonImmutable::parse($value, 'Asia/Ho_Chi_Minh')->setTimezone('Asia/Ho_Chi_Minh') : null;
        } catch (\Throwable $e) { return null; }
    }

    private function money(mixed $value): string { return number_format((float) $value, 0, ',', '.') . 'đ'; }

    private function redact(string $value): string
    {
        $value = preg_replace('/[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b(?:AIza[\w-]+|sk-[\w-]+)|\b\+?\d[\d .-]{8,}\d\b/iu', '[đã ẩn]', $value);
        return mb_substr($value, 0, 1000);
    }

    private function result(string $message, array $products = [], array $context = []): array
    {
        return ['success' => true, 'message' => $message, 'products' => $products, 'error' => null, '_context' => $context];
    }
}
