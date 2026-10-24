<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Helpers\DocumentSerializer;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/** Read-only rule-based ranking; catalog stock is always the current snapshot. */
class ProductRecommendationService
{
    public function fetch(string $mode): array
    {
        $db = DB::connection('mongodb')->getMongoDB();
        $source = ['isSynthetic' => $mode === 'synthetic' ? true : ['$ne' => true]];
        $options = ['typeMap' => ['root' => 'array', 'document' => 'array', 'array' => 'array']];
        $products = $db->selectCollection('SanPhams')->find(['isSynthetic' => ['$ne' => true]], $options + [
            'projection' => ['MaSP' => 1, 'TenSP' => 1, 'HinhAnh' => 1, 'SoLuong' => 1, 'TrangThai' => 1],
        ])->toArray();
        $orders = $db->selectCollection('DonHangs')->find($source, $options + [
            'projection' => ['MaDH' => 1, 'NgayDat' => 1, 'isSynthetic' => 1, 'SanPhams.MaSP' => 1,
                'SanPhams.SoLuong' => 1, 'TrangThaiDonHang' => 1, 'TrangThaiThanhToan' => 1, 'TongThanhToan' => 1],
        ])->toArray();
        $favorites = $db->selectCollection('YeuThichs')->find($source, $options + [
            'projection' => ['MaKH' => 1, 'SanPhams.MaSP' => 1, 'SanPhams.isSynthetic' => 1, 'isSynthetic' => 1],
        ])->toArray();
        return $this->analyze($products, $orders, $favorites, $mode);
    }

    public function analyze(array $products, array $orders, array $favorites, string $mode, ?CarbonImmutable $now = null): array
    {
        if (!in_array($mode, ['real', 'synthetic'], true)) throw new \InvalidArgumentException('Chế độ không hợp lệ.');
        $synthetic = $mode === 'synthetic';
        $now = ($now ?? CarbonImmutable::now('Asia/Ho_Chi_Minh'))->setTimezone('Asia/Ho_Chi_Minh');
        $orders = array_values(array_filter($orders, static fn ($o) => (($o['isSynthetic'] ?? false) === true) === $synthetic));
        $end = $synthetic ? null : $now;
        $invalidDates = 0;
        foreach ($orders as &$order) {
            $order['_date'] = $this->date($order['NgayDat'] ?? null);
            if (!$order['_date']) { $invalidDates++; continue; }
            // Include all synthetic order statuses when determining the history endpoint.
            if ($synthetic && (!$end || $order['_date'] > $end)) $end = $order['_date'];
        }
        unset($order);
        $start = $end?->startOfDay()->subDays(29);
        $until = $synthetic ? $end?->startOfDay()->addDay() : $now;
        $rows = [];
        $invalidStock = 0;
        foreach ($products as $product) {
            $product = DocumentSerializer::document($product);
            $code = (string) ($product['MaSP'] ?? '');
            if ($code === '' || ($product['isSynthetic'] ?? false) === true || ($product['TrangThai'] ?? '') !== 'Đang bán') continue;
            $stock = $product['SoLuong'] ?? null;
            if (!$this->wholeNumber($stock, true)) { $invalidStock++; continue; }
            $images = $product['HinhAnh'] ?? [];
            $rows[$code] = ['code' => $code, 'name' => (string) ($product['TenSP'] ?? $code),
                'image' => is_array($images) && is_string($images[0] ?? null) ? '/assets/' . rawurlencode($images[0]) : null,
                'stock' => (int) $stock, 'sold' => 0, 'favoriteCustomers' => 0];
        }
        $validOrders = 0;
        $invalidLines = 0;
        $seen = [];
        foreach ($orders as $order) {
            $date = $order['_date'];
            if (!$start || !$date || $date < $start || $date > $until || ($synthetic && $date == $until)) continue;
            if (!in_array($order['TrangThaiDonHang'] ?? '', ['Đã giao', 'Đã nhận hàng'], true)
                || ($order['TrangThaiThanhToan'] ?? '') !== 'Đã thanh toán'
                || !is_numeric($order['TongThanhToan'] ?? null) || !is_finite((float) $order['TongThanhToan'])
                || (float) $order['TongThanhToan'] <= 0) continue;
            $id = (string) ($order['MaDH'] ?? '');
            if ($id === '' || isset($seen[$id])) continue;
            $seen[$id] = true;
            $counted = false;
            foreach ($order['SanPhams'] ?? [] as $line) {
                $code = (string) ($line['MaSP'] ?? '');
                if (!isset($rows[$code])) continue;
                $quantity = $line['SoLuong'] ?? null;
                if (!$this->wholeNumber($quantity, false)) { $invalidLines++; continue; }
                $rows[$code]['sold'] += (int) $quantity;
                $counted = true;
            }
            if ($counted) $validOrders++;
        }
        $customers = [];
        $favoriteDocuments = 0;
        foreach ($favorites as $favorite) {
            if ((($favorite['isSynthetic'] ?? false) === true) !== $synthetic) continue;
            $favoriteDocuments++;
            $customer = trim((string) ($favorite['MaKH'] ?? ''));
            if ($customer === '') continue;
            foreach ($favorite['SanPhams'] ?? [] as $item) {
                if (isset($item['isSynthetic']) && ($item['isSynthetic'] === true) !== $synthetic) continue;
                $code = (string) ($item['MaSP'] ?? '');
                if (isset($rows[$code])) $customers[$code][$customer] = true;
            }
        }
        foreach ($rows as $code => &$row) $row['favoriteCustomers'] = count($customers[$code] ?? []);
        unset($row);
        $maxSold = max(array_merge([1], array_column($rows, 'sold')));
        $maxFavorites = max(array_merge([1], array_column($rows, 'favoriteCustomers')));
        foreach ($rows as &$row) {
            $salesSignal = $row['sold'] / $maxSold;
            $favoriteSignal = $row['favoriteCustomers'] / $maxFavorites;
            $shortage = $row['sold'] > 0 ? max(0, ($row['sold'] - $row['stock']) / $row['sold']) : 0;
            $row['signals'] = ['sales' => round($salesSignal, 4), 'favorites' => round($favoriteSignal, 4), 'shortage' => round($shortage, 4)];
            $row['score'] = round(100 * (.5 * $salesSignal + .3 * $favoriteSignal + .2 * $shortage), 2);
            $row['priority'] = 'watch';
            $row['priorityLabel'] = 'Theo dõi thêm';
            if ($validOrders >= 5 && $row['sold'] >= 5 && $shortage >= .5 && $row['score'] >= 60) {
                $row['priority'] = 'high'; $row['priorityLabel'] = 'Ưu tiên cao';
            } elseif ($validOrders >= 5 && $row['sold'] >= 3 && $shortage > 0) {
                $row['priority'] = 'medium'; $row['priorityLabel'] = 'Cân nhắc bổ sung';
            }
            $row['reason'] = $row['sold'] < 3
                ? 'Lượng bán trong kỳ còn ít; lượt yêu thích chỉ thể hiện sự quan tâm, chưa đủ cơ sở để bổ sung.'
                : ($shortage > 0
                    ? 'Tồn kho hiện tại thấp hơn lượng đã bán trong kỳ. Cân nhắc bổ sung nếu nhịp bán này tiếp tục.'
                    : 'Tồn kho hiện tại đủ so với lượng đã bán trong kỳ; chưa có tín hiệu thiếu hụt, tiếp tục theo dõi.');
            if ($validOrders < 5) $row['reason'] = 'Mẫu đơn hoàn tất còn ít. ' . $row['reason'];
        }
        unset($row);
        $ranked = array_values(array_filter($rows, static fn ($r) => $r['sold'] > 0 || $r['favoriteCustomers'] > 0));
        usort($ranked, static fn ($a, $b) => ($b['score'] <=> $a['score']) ?: ($b['sold'] <=> $a['sold'])
            ?: ($b['favoriteCustomers'] <=> $a['favoriteCustomers']) ?: strcmp($a['code'], $b['code']));
        $warnings = [];
        if (!$end) $warnings[] = 'Không có ngày đặt hợp lệ trong lịch sử mô phỏng để xác định kỳ phân tích.';
        if ($validOrders < 5) $warnings[] = ($synthetic ? 'Dữ liệu mô phỏng' : 'Dữ liệu thực') . ' chưa đủ: có ' . $validOrders . ' đơn hoàn tất hợp lệ chứa sản phẩm đang phân tích (ngưỡng tham khảo: 5 đơn). Kết quả chỉ nên dùng để theo dõi.';
        if ($synthetic && !$favoriteDocuments) $warnings[] = 'Chưa có yêu thích gắn isSynthetic=true; tín hiệu yêu thích mô phỏng bằng 0, không dùng chung yêu thích thật.';
        if ($invalidDates) $warnings[] = "Đã bỏ qua $invalidDates đơn có ngày đặt không hợp lệ.";
        if ($invalidLines) $warnings[] = "Đã bỏ qua $invalidLines dòng có số lượng bán không hợp lệ.";
        if ($invalidStock) $warnings[] = "Không phân tích $invalidStock sản phẩm có tồn kho thiếu hoặc không hợp lệ.";
        return ['mode' => $mode, 'from' => $start?->format('Y-m-d'), 'to' => $end?->format('Y-m-d'),
            'analyzedProducts' => count($rows), 'validOrders' => $validOrders, 'sufficientData' => $validOrders >= 5,
            'items' => array_slice($ranked, 0, 5), 'warnings' => $warnings,
            'generatedAt' => $now->toIso8601String(), 'weights' => ['sales' => 50, 'favorites' => 30, 'shortage' => 20]];
    }

    private function wholeNumber(mixed $value, bool $zero): bool
    {
        return is_numeric($value) && is_finite((float) $value) && (float) $value <= PHP_INT_MAX
            && floor((float) $value) === (float) $value && ($zero ? (float) $value >= 0 : (float) $value > 0);
    }

    private function date(mixed $value): ?CarbonImmutable
    {
        if ($value instanceof \MongoDB\BSON\UTCDateTime) return CarbonImmutable::instance($value->toDateTime())->setTimezone('Asia/Ho_Chi_Minh');
        if (!is_string($value) || !preg_match('/^\d{4}-\d{2}-\d{2}(?:[T ].*)?$/D', $value)) return null;
        try {
            $date = CarbonImmutable::parse($value, 'Asia/Ho_Chi_Minh');
            $errors = \DateTimeImmutable::getLastErrors();
            return $errors && ($errors['warning_count'] || $errors['error_count']) ? null : $date->setTimezone('Asia/Ho_Chi_Minh');
        } catch (\Throwable) { return null; }
    }
}
