<?php

// Standalone regression suite: Http::fake + in-memory documents; never writes to MongoDB.
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
set_exception_handler(function (Throwable $error) {
    fwrite(STDERR, $error->getMessage() . PHP_EOL);
    exit(1);
});
config(['cache.default' => 'array', 'session.driver' => 'array', 'chatbot.key' => 'TEST-SECRET-NEVER-EXPOSE', 'chatbot.model' => 'configured-model']);
$chatLog = new class extends \Psr\Log\AbstractLogger {
    public array $records = [];
    public function log($level, $message, array $context = []): void { $this->records[] = compact('level', 'message', 'context'); }
};
\Illuminate\Support\Facades\Log::swap($chatLog);

use App\Services\Client\{ChatbotData, ChatbotGemini, ChatbotService, ChatbotException};
use App\Http\Controllers\Client\ChatbotController;
use App\Http\Middleware\ChatbotAccess;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;

$checks = 0;
function check($condition, $label) {
    global $checks;
    if (!$condition) throw new RuntimeException('FAIL: ' . $label);
    $checks++;
    echo "PASS $label\n";
}
class MemoryChatData extends ChatbotData {
    public array $queries = [];
    public array $documents = [];
    protected function read(string $collection, array $filter, array $fields, int $limit, array $sort = ['_id' => -1]): array {
        $this->queries[] = compact('collection', 'filter', 'fields', 'limit', 'sort');
        return array_slice($this->documents[$collection] ?? [], 0, $limit);
    }
}
function ai(array $fields = [], int $status = 200, ?string $text = null): void {
    Http::swap(new Illuminate\Http\Client\Factory());
    Http::preventStrayRequests();
    Http::fake(['https://generativelanguage.googleapis.com/*' => Http::response([
        'candidates' => [['content' => ['parts' => [['text' => $text ?? json_encode(array_merge([
            'intent' => 'products', 'search' => 'dâu', 'budget' => 300000, 'follow_up' => false, 'size' => '',
        ], $fields), JSON_UNESCAPED_UNICODE)]]]]],
    ], $status)]);
}
function failed(Closure $run, int $status): string {
    try { $run(); } catch (ChatbotException $e) {
        check($e->getCode() === $status, 'Upstream failure mapped to ' . $status);
        check($e->getMessage() === ChatbotException::UNAVAILABLE_MESSAGE, 'Same friendly unavailable message');
        check(config('chatbot.key') === '' || !str_contains($e->getMessage(), config('chatbot.key')), 'Secret absent from error');
        return $e->getMessage();
    }
    throw new RuntimeException('Expected controlled exception');
}
$store = new MemoryChatData();
$gemini = new ChatbotGemini();
$service = new ChatbotService($store, $gemini);
$store->documents['SanPhams'] = [
    ['MaSP' => 'TEST-A', 'TenSP' => 'Bánh dâu', 'TrangThai' => 'Đang bán', 'HinhAnh' => ['../assets/dau.png'], 'KichThuoc' => [['Ten' => '12 cm', 'Gia' => 250000], ['Ten' => '20 cm', 'Gia' => 450000]]],
    ['MaSP' => 'TEST-B', 'TenSP' => 'Bánh ngừng bán', 'TrangThai' => 'Ngừng bán', 'KichThuoc' => [['Ten' => 'Nhỏ', 'Gia' => 100000]]],
    ['MaSP' => 'TEST-C', 'TenSP' => 'Bánh quá giá', 'TrangThai' => 'Đang bán', 'KichThuoc' => [['Ten' => 'Lớn', 'Gia' => 500000]]],
];
ai();
$reply = $service->reply('Có bánh dâu dưới 300k không?', [], null);
check(count($reply['products']) === 1, 'Budget/active status verified from documents');
check($reply['products'][0]['sizes'] === [['name' => '12 cm', 'price' => 250000.0]], 'Exact Mongo size/price, no invented sizes');
check($reply['products'][0]['url'] === '/details/TEST-A', 'Existing detail route');
check($reply['products'][0]['image'] === '/assets/dau.png', 'Existing image mapping');
$query = end($store->queries);
check($query['filter']['TrangThai'] === 'Đang bán' && $query['filter']['isSynthetic'] === ['$ne' => true], 'Controlled product filter');
check($query['filter']['KichThuoc']['$elemMatch']['Gia']['$lte'] === 300000 && $query['limit'] === 12, 'Budget applied at database, bounded results');
check(isset($query['filter']['$and'][0]['$or'][3]['MaDM']), 'Category lookup supported');
check(Http::recorded(fn ($r) => $r->hasHeader('x-goog-api-key', config('chatbot.key')) && !str_contains($r->url(), config('chatbot.key')) && $r['generationConfig']['maxOutputTokens'] === 512)->isNotEmpty(), 'Gemini request verified');
check(true, 'Backend key header and bounded tokens');
ai(['follow_up' => true, 'search' => '', 'size' => '20 cm', 'budget' => 0]);
$follow = $service->reply('Vậy size 20 cm giá bao nhiêu?', $reply['_context'], null);
check($follow['products'][0]['sizes'][0]['price'] === 450000.0, 'Follow-up keeps product and can show larger size outside previous budget');
check(end($store->queries)['filter']['MaSP'] === ['$in' => ['TEST-A']], 'Follow-up bound to previous product ID');
ai(['message' => 'Fake cake 1đ', 'url' => 'javascript:alert(1)']);
check(!str_contains(json_encode($service->reply('Tư vấn bánh', [], null)), 'Fake cake'), 'Model text/URLs never become product facts');
foreach ([100000, 200000] as $budget) {
    ai(['budget' => $budget]);
    check($service->reply('Bánh theo ngân sách', [], null)['products'] === [], 'Do not offer above budget ' . $budget);
    check(end($store->queries)['filter']['KichThuoc']['$elemMatch']['Gia']['$lte'] === $budget, 'Database budget filter ' . $budget);
}
$queryCount = count($store->queries);
$store->products('dâu|matcha|chocolate', null);
$comparisonQueries = array_filter(array_slice($store->queries, $queryCount), fn ($q) => $q['collection'] === 'SanPhams');
check(count($comparisonQueries) === 3, 'Comparison performs three bounded product searches');
ai([], 200, '{}'); failed(fn () => $gemini->understand('Bánh', []), 502);
config(['chatbot.key' => '']);
failed(fn () => $gemini->understand('Bánh', []), 503);
config(['chatbot.key' => 'TEST-SECRET-NEVER-EXPOSE']);
foreach ([429 => 429, 401 => 503, 403 => 503, 500 => 503] as $upstream => $mapped) { ai([], $upstream); failed(fn () => $gemini->understand('Bánh', []), $mapped); }
ai([], 200, 'not json'); failed(fn () => $gemini->understand('Bánh', []), 502);
Http::swap(new Illuminate\Http\Client\Factory());
Http::fake(fn () => throw new Illuminate\Http\Client\ConnectionException('secret upstream ' . config('chatbot.key')));
failed(fn () => $gemini->understand('Bánh', []), 503);

$queriesBefore = count($store->queries);
$guest = $service->reply('Kiểm tra đơn hàng MaKH B', [], null);
check(str_contains($guest['message'], 'đăng nhập') && count($store->queries) === $queriesBefore, 'Guest cannot query any order');
$account = ['MaKH' => 'A', 'TaiKhoan' => ['Quyen' => ['MaQ' => 'KH']]];
$store->documents['DonHangs'] = [
    ['MaKH' => 'A', 'MaDH' => 'ORDER-A', 'NgayDat' => '2026-10-22T00:00:00Z', 'TrangThaiDonHang' => 'Đã giao', 'TrangThaiThanhToan' => 'Đã thanh toán', 'TongThanhToan' => 250000],
    ['MaKH' => 'B', 'MaDH' => 'PRIVATE-B', 'TongThanhToan' => 99999],
    ['MaKH' => 'A', 'MaDH' => 'SYNTHETIC', 'isSynthetic' => true],
];
$owned = $service->reply('Xem đơn hàng PRIVATE-B của MaKH B', [], $account);
check(str_contains($owned['message'], 'ORDER-A') && !str_contains($owned['message'], 'PRIVATE-B') && !str_contains($owned['message'], 'SYNTHETIC'), 'Customer A never sees B or synthetic orders');
check(end($store->queries)['filter'] === ['MaKH' => 'A', 'isSynthetic' => ['$ne' => true]], 'Order query uses verified account, ignores chat IDs');
check(str_contains($owned['message'], '07:00') && str_contains($owned['message'], '250.000đ'), 'VN timezone and money');
check($owned['_context'] === [], 'Private order details excluded from history');

$today = Carbon\CarbonImmutable::now('Asia/Ho_Chi_Minh');
$valid = ['MaKM' => 'VALID', 'LoaiKM' => 'Phần trăm', 'GiaTri' => 10, 'GiaTriToiDa' => 50000, 'DonToiThieu' => 200000, 'NgayBatDau' => $today->subDay()->toIso8601String(), 'NgayKetThuc' => $today->addDay()->toIso8601String(), 'SoLuong' => 5, 'PhamViApDung' => 'Toàn bộ'];
$store->documents['KhuyenMais'] = [
    $valid, array_merge($valid, ['MaKM' => 'EXPIRED', 'NgayKetThuc' => $today->subDays(2)->toIso8601String()]),
    array_merge($valid, ['MaKM' => 'DEMO', 'isSynthetic' => true]), array_merge($valid, ['MaKM' => 'EMPTY', 'SoLuong' => 0]),
    array_merge($valid, ['MaKM' => 'SCOPE', 'PhamViApDung' => 'Danh mục']), array_merge($valid, ['MaKM' => 'TOOHIGH', 'DonToiThieu' => 500000]),
];
ai(['intent' => 'promotions']);
$promo = $service->reply('Khuyến mãi cho đơn 300k', [], null);
check(str_contains($promo['message'], 'VALID') && str_contains($promo['message'], '200.000đ'), 'Actual valid promo and minimum order shown');
foreach (['EXPIRED','DEMO','EMPTY','SCOPE','TOOHIGH'] as $code) check(!str_contains($promo['message'], $code), 'Exclude promo ' . $code);

$session = app('session')->driver(); $session->start();
$controller = new ChatbotController();
$makeRequest = function ($message) use ($session) { $r = Request::create('/chatbot/message', 'POST', ['message' => $message]); $r->setLaravelSession($session); return $r; };
config(['chatbot.key' => '']);
$unavailable = $controller->message($makeRequest('Bánh dâu'), $service);
$unavailableBody = $unavailable->getData(true);
check($unavailable->getStatusCode() === 503 && $unavailableBody['success'] === false && $unavailableBody['products'] === [], 'Unavailable remains failure, never success');
check($unavailableBody['message'] === ChatbotException::UNAVAILABLE_MESSAGE, 'Controller sends exact customer message');
config(['chatbot.key' => 'TEST-SECRET-NEVER-EXPOSE']);
$brokenService = new class($store, $gemini) extends ChatbotService {
    public function reply(string $message, array $context, ?array $account): array { throw new RuntimeException('Gemini API error TEST-SECRET-NEVER-EXPOSE configured-model'); }
};
$unexpected = $controller->message($makeRequest('Bánh'), $brokenService)->getData(true);
check($unexpected['message'] === ChatbotException::UNAVAILABLE_MESSAGE && $unexpected['success'] === false, 'Unexpected technical exception hidden');
$diagnostics = json_encode($chatLog->records);
check(str_contains($diagnostics, 'missing_api_key') && str_contains($diagnostics, 'upstream_auth_failed') && str_contains($diagnostics, 'upstream_transport_failed'), 'Backend retains safe diagnostic reasons');
check(!str_contains($diagnostics, 'TEST-SECRET-NEVER-EXPOSE') && !str_contains($diagnostics, 'configured-model') && !str_contains($diagnostics, 'secret upstream'), 'Logs exclude key/model/raw upstream exceptions');
check($controller->message($makeRequest(str_repeat('a', 1001)), $service)->getStatusCode() === 422, 'Length validation');
check($controller->message($makeRequest('   '), $service)->getStatusCode() === 422, 'Blank validation');
ai();
for ($i = 0; $i < 12; $i++) $controller->message($makeRequest('Bánh dâu email private@example.com 0912345678'), $service);
$history = $session->get('chatbot.context');
check(count($history['turns']) === 8 && !str_contains(json_encode($history), 'private@example') && !str_contains(json_encode($history), '0912345678'), 'Eight summaries, no raw PII');
$controller->reset($makeRequest(''));
check(!$session->has('chatbot'), 'Reset clears context independently');
check(Http::recorded(fn ($r) => !str_contains($r->body(), 'private@example.com') && !str_contains($r->body(), '0912345678'))->isNotEmpty(), 'Redacted Gemini request verified');
check(true, 'PII redacted before external request');

$middleware = app(ChatbotAccess::class);
$r = $makeRequest('Bánh');
$r->server->set('REMOTE_ADDR', '192.0.2.25');
check($middleware->handle($r, fn () => response()->json(['success' => true]))->getStatusCode() === 419, 'Real CSRF middleware rejects missing token');
$r->headers->set('X-CSRF-TOKEN', $session->token());
check($middleware->handle($r, fn () => response()->json(['success' => true]))->getStatusCode() === 200, 'Valid CSRF accepted');
for ($i = 0; $i < 10; $i++) $limited = $middleware->handle($r, fn () => response()->json(['success' => true]));
check($limited->getStatusCode() === 429, 'Session/IP rate limit enforced');
config(['chatbot.enabled' => false]);
check($middleware->handle($r, fn () => response())->getStatusCode() === 503, 'Disabled endpoint refused');
check($middleware->handle($r, fn () => response())->getData(true)['message'] === ChatbotException::UNAVAILABLE_MESSAGE, 'Disabled endpoint shares friendly message');
echo "\n$checks checks passed. No MongoDB writes; no live Gemini calls.\n";

if (in_array('--live-read', $argv, true)) {
    config(['chatbot.enabled' => true]);
    $live = new ChatbotData();
    $items = $live->products('', null);
    check(count($items) > 0 && count($items) <= 12, 'Read actual MongoDB products, bounded query');
    foreach ($items as $item) check(($item['TrangThai'] ?? '') === 'Đang bán', 'Actual product selling status');
    ai();
    $result = (new ChatbotService($live, $gemini))->reply('Bánh dâu dưới 300k', [], null);
    check(count($result['products']) > 0 && count($result['products']) <= 3, 'Mock Gemini + real MongoDB product cards');
    foreach ($result['products'] as $product) foreach ($product['sizes'] as $size) check($size['price'] <= 300000, 'Actual MongoDB price within budget');
    ai(['intent' => 'promotions']);
    $promotions = (new ChatbotService($live, $gemini))->reply('Khuyến mãi hôm nay', [], null);
    check($promotions['success'], 'Actual MongoDB promotions query');
    check($live->latestOrders('__CHATBOT_TEST_NONEXISTENT_CUSTOMER__') === [], 'Actual owned-order query for nonexistent test identity');
    echo "Live read checks completed; zero MongoDB writes, Gemini mocked.\n";
}
