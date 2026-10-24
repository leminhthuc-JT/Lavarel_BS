<?php

declare(strict_types=1);

namespace App\Services\Admin;

use Illuminate\Support\Facades\Http;
use RuntimeException;

final class ForecastService
{
    public function fetch(bool $metricsOnly = false): array
    {
        $key = (string) config('forecast.key', '');
        if (!app()->environment(['local', 'testing']) && $key === '') {
            throw new RuntimeException('Cần cấu hình FORECAST_API_KEY cho Python service khi chạy ngoài local.');
        }
        $request = Http::acceptJson()->connectTimeout(3)->timeout(max(1, (int) config('forecast.timeout', 15)));
        if ($key !== '') $request = $request->withToken($key);
        try {
            $response = $request->get(rtrim((string) config('forecast.url'), '/') . ($metricsOnly ? '/metrics' : '/forecast'),
                $metricsOnly ? [] : ['days' => 7]);
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            throw new RuntimeException('Không kết nối được Python service. Hãy khởi động ai-forecast/main.py và thử lại.');
        }
        if (!$response->successful()) {
            if ($response->status() === 401 || $response->status() === 403) {
                throw new RuntimeException('Python service từ chối truy cập. Kiểm tra FORECAST_API_KEY giữa Laravel và Python.');
            }
            throw new RuntimeException('Python service chưa sẵn sàng hoặc chưa có model hợp lệ. Hãy kiểm tra service và chạy train_model.py.');
        }
        $data = $response->json();
        if (!is_array($data) || ($data['is_synthetic'] ?? false) !== true || empty($data['model'])) {
            throw new RuntimeException('Python service trả về dữ liệu không hợp lệ.');
        }
        if (!$metricsOnly) {
            $items = $data['items'] ?? [];
            if (count($items) !== 7 || ($data['days'] ?? null) !== 7 || !is_array($data['metrics'] ?? null)) {
                throw new RuntimeException('Kết quả dự báo phải gồm đúng 7 ngày và thông tin kiểm định.');
            }
            $last = null;
            $total = 0;
            foreach ($items as $item) {
                $day = $item['date'] ?? '';
                $date = \DateTimeImmutable::createFromFormat('!Y-m-d', $day);
                $amount = $item['revenue'] ?? null;
                if (!$date || $date->format('Y-m-d') !== $day || !is_numeric($amount) || !is_finite((float) $amount)
                    || $amount < 0 || ($last && $date != $last->modify('+1 day'))) {
                    throw new RuntimeException('Kết quả dự báo có ngày hoặc doanh thu không hợp lệ.');
                }
                $total += $amount;
                $last = $date;
            }
            if (($data['from'] ?? '') !== $items[0]['date'] || ($data['to'] ?? '') !== $items[6]['date']
                || !is_numeric($data['total'] ?? null) || abs($total - $data['total']) > 0.01) {
                throw new RuntimeException('Tổng doanh thu hoặc kỳ dự báo không khớp bảng dữ liệu.');
            }
        }
        return $data;
    }
}
