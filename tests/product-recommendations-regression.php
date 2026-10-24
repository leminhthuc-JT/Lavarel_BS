<?php
// In-memory calculation/controller/middleware regression; no MongoDB writes or external API calls.
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
config(['session.driver' => 'array', 'cache.default' => 'array']);
set_exception_handler(function (Throwable $e) { fwrite(STDERR, $e->getMessage() . PHP_EOL); exit(1); });

use App\Services\Admin\ProductRecommendationService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;

$checks = 0;
function check($condition, $label) {
    global $checks;
    if (!$condition) throw new RuntimeException('FAIL: ' . $label);
    $checks++;
    echo "PASS $label\n";
}
function product($code, $stock = 0, $extra = []) {
    return array_replace(['MaSP' => $code, 'TenSP' => "Bánh $code", 'SoLuong' => $stock,
        'HinhAnh' => ["$code.png"], 'TrangThai' => 'Đang bán'], $extra);
}
function order($id, $code, $quantity, $extra = []) {
    return array_replace(['MaDH' => $id, 'NgayDat' => '2026-10-23T09:00:00+07:00',
        'TrangThaiDonHang' => 'Đã giao', 'TrangThaiThanhToan' => 'Đã thanh toán', 'TongThanhToan' => 100000,
        'SanPhams' => [['MaSP' => $code, 'SoLuong' => $quantity]]], $extra);
}
$service = new ProductRecommendationService();
$now = CarbonImmutable::parse('2026-10-23T12:00:00+07:00');
$products = array_map(fn ($c) => product($c), ['A','B','C','D','E','F','G']);
$products[] = product('STOP', 0, ['TrangThai' => 'Ngừng bán']);
$products[] = product('UNKNOWN', null);
$products[] = product('FAKE', 0, ['isSynthetic' => true]);
$orders = [];
foreach (['A'=>10, 'B'=>8, 'C'=>6, 'D'=>4, 'E'=>2, 'F'=>1] as $code=>$quantity) $orders[] = order($code, $code, $quantity);
$orders[] = order('CANCEL', 'A', 999, ['TrangThaiDonHang' => 'Đã hủy']);
$orders[] = order('CANCEL2', 'A', 999, ['TrangThaiDonHang' => 'Đã huỷ']);
$orders[] = order('PENDING', 'A', 999, ['TrangThaiDonHang' => 'Đã xác nhận']);
$orders[] = order('UNPAID', 'A', 999, ['TrangThaiThanhToan' => 'Chưa thanh toán']);
$orders[] = order('ZERO', 'A', 999, ['TongThanhToan' => 0]);
$orders[] = order('SYNTHETIC', 'A', 999, ['isSynthetic' => true]);
$orders[] = order('OLD', 'A', 999, ['NgayDat' => '2026-09-23T23:59:59+07:00']);
$orders[] = order('FUTURE', 'A', 999, ['NgayDat' => '2026-10-23T13:00:00+07:00']);
$orders[] = order('BADDATE', 'A', 999, ['NgayDat' => '2026-02-30']);
$orders[] = order('BADQTY', 'A', -5);
$orders[] = order('FRACTION', 'A', 1.5);
$orders[] = order('A', 'A', 10); // Duplicate order code must not inflate sales.
$favorites = [
    ['MaKH'=>'KH1','SanPhams'=>[['MaSP'=>'B'],['MaSP'=>'B'],['MaSP'=>'G']]],
    ['MaKH'=>'KH1','SanPhams'=>[['MaSP'=>'B']]],
    ['MaKH'=>'KH2','SanPhams'=>[['MaSP'=>'B']]],
    ['MaKH'=>'SYN','isSynthetic'=>true,'SanPhams'=>[['MaSP'=>'A']]],
    ['MaKH'=>'','SanPhams'=>[['MaSP'=>'A']]],
];
$before = serialize([$products, $orders, $favorites]);
$data = $service->analyze($products, $orders, $favorites, 'real', $now);
$items = array_column($data['items'], null, 'code');
check($data['from'] === '2026-09-24' && $data['to'] === '2026-10-23', '30 Vietnam calendar dates');
check($data['analyzedProducts'] === 7, 'Only active products with valid current stock');
check($data['validOrders'] === 6, 'Only fulfilled paid positive-total orders with valid lines counted');
check(count($data['items']) === 5, 'Top five cap');
check($items['A']['sold'] === 10, 'Cancelled, pending, unpaid, synthetic, old, future, invalid and duplicate orders excluded');
check($items['B']['favoriteCustomers'] === 2 && $items['A']['favoriteCustomers'] === 0, 'Distinct customer/product pairs across repeated documents, no synthetic favorites leak');
check($data['items'][0]['code'] === 'B' && $items['B']['score'] === 90.0, '50/30/20 normalized score');
check($items['A']['signals']['shortage'] === 1.0 && $items['A']['stock'] === 0, 'Shortage uses present stock');
check($items['A']['priority'] === 'high', 'High priority requires sales, shortage, score and sufficient orders');
check($before === serialize([$products, $orders, $favorites]), 'Inputs unmodified');
$scores = array_column($data['items'], 'score'); $sorted = $scores; rsort($sorted);
check($scores === $sorted, 'Scores descending');
check(count($data['warnings']) === 3, 'Invalid dates, quantities and stock surfaced');

$boundaries = $service->analyze([product('A', 100)], [
    order('START', 'A', 2, ['NgayDat'=>'2026-09-23T17:00:00Z']),
    order('BEFORE', 'A', 999, ['NgayDat'=>'2026-09-23T16:59:59Z']),
    order('NOW', 'A', 3, ['NgayDat'=>new MongoDB\BSON\UTCDateTime($now)]),
], [], 'real', $now);
check($boundaries['items'][0]['sold'] === 5, 'BSON and ISO timezone boundaries, inclusive current instant');
check($boundaries['items'][0]['signals']['shortage'] === 0.0 && $boundaries['items'][0]['priority'] === 'watch', 'Enough current stock gives no shortage');
check(!$boundaries['sufficientData'], 'Sparse real data explicitly marked');

$interest = $service->analyze([product('G')], [], $favorites, 'real', $now);
check($interest['items'][0]['sold'] === 0 && $interest['items'][0]['priority'] === 'watch'
    && str_contains($interest['items'][0]['reason'], 'chưa đủ cơ sở'), 'Favorites alone never imply replenishment');
$syntheticOrders = [
    order('S1', 'A', 7, ['isSynthetic'=>true,'NgayDat'=>'2020-06-01']),
    order('S2', 'A', 99, ['isSynthetic'=>true,'NgayDat'=>'2020-06-30','TrangThaiDonHang'=>'Đã hủy']),
    order('SOLD', 'A', 99, ['isSynthetic'=>true,'NgayDat'=>'2020-05-31']),
    order('REAL', 'A', 999, ['NgayDat'=>'2026-10-23']),
];
$sim = $service->analyze([product('A', 4)], $syntheticOrders, $favorites, 'synthetic', $now);
check($sim['from'] === '2020-06-01' && $sim['to'] === '2020-06-30', 'Synthetic last 30 days anchored to full synthetic history including cancelled final day');
check($sim['items'][0]['sold'] === 7 && $sim['items'][0]['favoriteCustomers'] === 1, 'Synthetic source isolation for sales and favorites');
check($sim['items'][0]['stock'] === 4, 'Synthetic historical sales still use current stock');
$noLikes = $service->analyze([product('A')], $syntheticOrders, [], 'synthetic', $now);
check(str_contains(implode(' ', $noLikes['warnings']), 'Chưa có yêu thích'), 'Missing synthetic favorites disclosed');
$empty = $service->analyze([], [], [], 'synthetic', $now);
check($empty['items'] === [] && $empty['analyzedProducts'] === 0 && $empty['from'] === null, 'Empty MongoDB datasets safe');
$ties = $service->analyze([product('B'), product('A')], [order('B','B',1),order('A','A',1)], [], 'real', $now);
check(array_column($ties['items'], 'code') === ['A','B'], 'Deterministic tie-break');

// Real middleware, request sessions and route metadata. Pre-resolved identity avoids database access.
$middleware = new App\Http\Middleware\EnsureAccount();
function authRequest($path, $role = null) {
    $request = Request::create($path, 'GET', [], [], [], ['HTTP_ACCEPT'=>'application/json']);
    $request->setLaravelSession(app('session')->driver());
    if ($role) $request->attributes->set('account', ['TaiKhoan'=>['Quyen'=>['MaQ'=>$role]]]);
    return $request;
}
foreach (['/admin/product-recommendations','/api/admin/product-recommendations'] as $path) {
    check($middleware->handle(authRequest($path), fn () => response('ok'), 'admin')->getStatusCode() === 401, "Guest denied $path");
    check($middleware->handle(authRequest($path, 'KH'), fn () => response('ok'), 'admin')->getStatusCode() === 403, "Customer denied $path");
    check($middleware->handle(authRequest($path, 'MN'), fn () => response('ok'), 'admin')->getStatusCode() === 200, "Admin allowed $path");
    $route = app('router')->getRoutes()->match(Request::create($path));
    check(in_array(App\Http\Middleware\EnsureAccount::class . ':admin', $route->gatherMiddleware(), true), "Route carries admin middleware $path");
}
$controller = new App\Http\Controllers\Admin\ProductRecommendationController();
$memory = new class extends ProductRecommendationService { public function fetch(string $mode): array { return ['mode'=>$mode]; } };
$request = authRequest('/api/admin/product-recommendations?mode=synthetic', 'MN');
check($controller->data($request, $memory)->getData(true)['data']['mode'] === 'synthetic', 'Controller passes validated source');
foreach (['bad','', ['real']] as $value) {
    $request = authRequest('/api/admin/product-recommendations', 'MN'); $request->query->set('mode', $value);
    try { $controller->data($request, $memory); check(false, 'Invalid mode rejected'); }
    catch (Illuminate\Validation\ValidationException) { check(true, 'Invalid mode rejected'); }
}
check($controller->index()->name() === 'admin.product-recommendations', 'Standalone admin Blade view');

// Dispatch through the real Laravel HTTP kernel, with an in-memory service and resolved identities.
$app->instance(ProductRecommendationService::class, $memory);
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
foreach (['/admin/product-recommendations','/api/admin/product-recommendations'] as $path) {
    foreach ([null=>401, 'KH'=>403, 'MN'=>200] as $role=>$expected) {
        $response = $kernel->handle(authRequest($path, $role ?: null));
        check($response->getStatusCode() === $expected, "HTTP kernel $path role=$role status=$expected");
        if ($role === 'MN') {
            check(str_contains($response->getContent(), str_starts_with($path, '/api/') ? 'real' : 'product-recommendations.js'), 'Admin receives new page/data');
        }
    }
}
$response = $kernel->handle(authRequest('/api/admin/product-recommendations?mode=bad', 'MN'));
check($response->getStatusCode() === 422, 'HTTP invalid mode returns 422');
$guestPage = Request::create('/admin/product-recommendations');
$response = $kernel->handle($guestPage);
check($response->getStatusCode() === 302 && str_ends_with($response->headers->get('Location'), '/login'), 'Browser guest redirected to login');

// Protected screens were snapshotted before the new-page verification. Sidebar is the only shared UI edit.
$protected = [
    'resources/views/admin/dashboard.blade.php'=>'781a5c7ac7c984615522662f1e45fb493e9be794e009e333fd79c76c1af8e326',
    'resources/views/admin/forecast.blade.php'=>'7d06b943c9d9adb49ec9e348ad8b5cef5babaa423d8e85f5e032d20eb4ec3f4a',
    'public/admin/css/admin.css'=>'4f45ee71792468110f7fde597b41e5da137c8ad6000ac71ed05cb9061bb77a73',
    'public/admin/css/forecast.css'=>'360bd6235e40bcda4e59abd0b6a9252a837749c7eada1ab598e7ed092d2cc318',
    'public/admin/js/forecast/forecast.js'=>'24eedd7b565f91f7538c4c9ddabb46e0b9e03bb827b262a1f8b16eb388b9c013',
    'public/admin/js/dashboard/dashboard.js'=>'903b52bf5a673e949a29d5e50fa72a98df3b2eb8a27adfb4546d77cb9e5f47a9',
];
foreach ($protected as $path=>$hash) check(hash_file('sha256', __DIR__ . '/../' . $path) === $hash, "Protected screen unchanged: $path");
echo "$checks checks passed.\n";
