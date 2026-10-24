<?php
// Optional read-only integration test against the configured MongoDB. Never seeds/updates collections.
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\Admin\ProductRecommendationService;
use App\Helpers\DocumentSerializer;
use Carbon\CarbonImmutable;

$db = Illuminate\Support\Facades\DB::connection('mongodb')->getMongoDB();
$collections = ['SanPhams', 'DonHangs', 'YeuThichs'];
$counts = [];
foreach ($collections as $name) $counts[$name] = $db->selectCollection($name)->countDocuments();
$service = new ProductRecommendationService();
$snapshots = [];
$checks = 0;
foreach (['real','synthetic'] as $mode) {
    $data = $service->fetch($mode);
    $synthetic = $mode === 'synthetic';
    $filter = ['isSynthetic' => $synthetic ? true : ['$ne'=>true]];
    $orders = $db->selectCollection('DonHangs')->find($filter, ['projection'=>[
        'MaDH'=>1,'NgayDat'=>1,'TrangThaiDonHang'=>1,'TrangThaiThanhToan'=>1,'TongThanhToan'=>1,'SanPhams'=>1,
    ]])->toArray();
    $favorites = $db->selectCollection('YeuThichs')->find($filter, ['projection'=>['MaKH'=>1,'SanPhams'=>1]])->toArray();
    $from = $data['from'] ? CarbonImmutable::parse($data['from'], 'Asia/Ho_Chi_Minh') : null;
    $until = $synthetic && $data['to'] ? CarbonImmutable::parse($data['to'], 'Asia/Ho_Chi_Minh')->addDay() : CarbonImmutable::parse($data['generatedAt']);
    foreach ($data['items'] as $item) {
        $sum = 0; $seen = [];
        foreach ($orders as $raw) {
            $o = DocumentSerializer::document($raw);
            if (!$from || !in_array($o['TrangThaiDonHang'] ?? '', ['Đã giao','Đã nhận hàng'], true)
                || ($o['TrangThaiThanhToan'] ?? '') !== 'Đã thanh toán' || ($o['TongThanhToan'] ?? 0) <= 0) continue;
            try { $date = CarbonImmutable::parse($o['NgayDat'], 'Asia/Ho_Chi_Minh'); } catch (Throwable) { continue; }
            if ($date < $from || $date > $until || ($synthetic && $date == $until) || isset($seen[$o['MaDH']])) continue;
            $seen[$o['MaDH']] = true;
            foreach ($o['SanPhams'] ?? [] as $line) {
                $q = $line['SoLuong'] ?? 0;
                if (($line['MaSP'] ?? '') === $item['code'] && is_numeric($q) && $q > 0 && floor((float)$q) == $q) $sum += $q;
            }
        }
        if ($sum !== $item['sold']) throw new RuntimeException('Sales mismatch: ' . $item['code']);
        $people = [];
        foreach ($favorites as $raw) {
            $f = DocumentSerializer::document($raw);
            if (empty($f['MaKH'])) continue;
            foreach ($f['SanPhams'] ?? [] as $line) {
                if (isset($line['isSynthetic']) && ($line['isSynthetic'] === true) !== $synthetic) continue;
                if (($line['MaSP'] ?? '') === $item['code']) $people[$f['MaKH']] = true;
            }
        }
        if (count($people) !== $item['favoriteCustomers']) throw new RuntimeException('Favorite mismatch');
        $product = $db->selectCollection('SanPhams')->findOne(['MaSP'=>$item['code']]);
        if ((int)$product['SoLuong'] !== $item['stock']) throw new RuntimeException('Current stock mismatch');
        $checks += 3;
    }
    $snapshots[$mode] = ['success'=>true,'data'=>$data];
    echo "$mode: " . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL;
}
foreach ($collections as $name) {
    if ($db->selectCollection($name)->countDocuments() !== $counts[$name]) throw new RuntimeException('Collection count changed');
    $checks++;
}
if (isset($argv[1])) {
    $directory = $argv[1];
    if (!is_dir($directory)) mkdir($directory, 0777, true);
    file_put_contents($directory . '/snapshots.json', json_encode($snapshots, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    // Render the actual saved Blade layout for a local browser preview without an auth bypass route.
    Illuminate\Support\Facades\URL::forceRootUrl('http://127.0.0.1:8127');
    file_put_contents($directory . '/page.html', view('admin.product-recommendations')->render());
}
echo "PASS: $checks read-only MongoDB reference checks; collections untouched.\n";
