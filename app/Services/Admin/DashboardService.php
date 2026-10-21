<?php

declare(strict_types=1);

namespace App\Services\Admin;

use MongoDB\BSON\UTCDateTime;
use App\Helpers\DocumentSerializer;

use MongoDB\Database;

final class DashboardService
{
    private Database $db;

    public function __construct()
    {
        

        $this->db =
            \DatabaseConnection::getInstance()
            ->getDatabase();
    }


    public function overview(): array
    {
        $products =
            $this->db
            ->selectCollection('SanPhams')
            ->countDocuments();

        $orders =
            $this->db
            ->selectCollection('DonHangs')
            ->countDocuments();

        $employees =
            $this->db
            ->selectCollection('NhanViens')
            ->countDocuments();

        $promotions =
            $this->db
            ->selectCollection('KhuyenMais')
            ->countDocuments();

        $favorites =
            $this->db
            ->selectCollection('YeuThichs')
            ->countDocuments();


        $pendingOrders =
            $this->db
            ->selectCollection('DonHangs')
            ->countDocuments([
                'TrangThaiDonHang' => 'Chờ xác nhận'
            ]);


        /* ==========================
           TỔNG DOANH THU
        ========================== */

        $totalRevenuePipeline = [

            [
                '$match' => [
                    'TrangThaiDonHang' => [
                        '$ne' => 'Đã hủy'
                    ]
                ]
            ],

            [
                '$group' => [
                    '_id' => null,

                    'total' => [
                        '$sum' => '$TongThanhToan'
                    ]
                ]
            ]

        ];


        $totalRevenueResult =
            $this->db
            ->selectCollection('DonHangs')
            ->aggregate(
                $totalRevenuePipeline
            )
            ->toArray();


        $totalRevenue =
            $totalRevenueResult[0]['total']
            ?? 0;



        /* ==========================
           DOANH THU THÁNG NÀY
        ========================== */

        $startMonth =
            new \DateTime(
                'first day of this month 00:00:00'
            );


        $endMonth =
            new \DateTime(
                'last day of this month 23:59:59'
            );


        $monthRevenuePipeline = [

            [
                '$match' => [

                    'NgayDat' => [

                        '$gte' =>
                        new \MongoDB\BSON\UTCDateTime(
                            $startMonth
                                ->getTimestamp()
                                * 1000
                        ),

                        '$lte' =>
                        new \MongoDB\BSON\UTCDateTime(
                            $endMonth
                                ->getTimestamp()
                                * 1000
                        ),

                    ],

                    'TrangThaiDonHang' => [
                        '$ne' => 'Đã hủy'
                    ]

                ]
            ],

            [
                '$group' => [

                    '_id' => null,

                    'total' => [
                        '$sum' => '$TongThanhToan'
                    ]

                ]
            ]

        ];


        $monthRevenueResult =
            $this->db
            ->selectCollection('DonHangs')
            ->aggregate(
                $monthRevenuePipeline
            )
            ->toArray();


        $monthRevenue =
            $monthRevenueResult[0]['total']
            ?? 0;



        /* ==========================
           ĐƠN HÀNG GẦN NHẤT
        ========================== */

        $recentOrdersCursor =
            $this->db
            ->selectCollection('DonHangs')
            ->find(
                [],
                [
                    'sort' => [
                        'NgayDat' => -1
                    ],

                    'limit' => 5
                ]
            );


        $recentOrders = [];


        foreach (
            $recentOrdersCursor
            as $order
        ) {

            $recentOrders[] =
                DocumentSerializer::document(
                    $order
                );
        }



        return [

            'totalRevenue' =>
            $totalRevenue,

            'monthRevenue' =>
            $monthRevenue,

            'counts' => [

                'products' =>
                $products,

                'orders' =>
                $orders,

                'employees' =>
                $employees,

                'promotions' =>
                $promotions,

                'favorites' =>
                $favorites,

                'pendingOrders' =>
                $pendingOrders

            ],

            'recentOrders' =>
            $recentOrders

        ];
    }



    /* ==========================
       REVENUE CHART
    ========================== */

    public function revenue(string $type, ?string $from = null, ?string $to = null): array
    {
        [$start, $end, $unit] = $this->resolveRange($type, $from, $to);
        $formats = ['day' => '%Y-%m-%d', 'month' => '%Y-%m', 'year' => '%Y'];
        // Legacy orders use the placement date only when no explicit recognition/payment date exists.
        $date = ['$ifNull' => [
            $this->revenueDate('$NgayGhiNhanDoanhThu'),
            ['$ifNull' => [$this->revenueDate('$NgayThanhToan'), $this->revenueDate('$NgayDat')]],
        ]];
        $results = $this->db->selectCollection('DonHangs')->aggregate([
            ['$match' => [
                'TrangThaiThanhToan' => 'Đã thanh toán',
                'TrangThaiDonHang' => ['$nin' => ['Đã hủy', 'Đã huỷ']],
            ]],
            ['$set' => ['_revenueDate' => $date]],
            ['$facet' => [
                'buckets' => [
                    ['$match' => ['_revenueDate' => [
                        '$gte' => new UTCDateTime($start), '$lt' => new UTCDateTime($end->addDay()),
                    ]]],
                    ['$group' => [
                        '_id' => ['$dateToString' => ['format' => $formats[$unit], 'date' => '$_revenueDate', 'timezone' => 'Asia/Ho_Chi_Minh']],
                        'value' => ['$sum' => ['$convert' => ['input' => '$TongThanhToan', 'to' => 'decimal', 'onError' => 0, 'onNull' => 0]]],
                        'orders' => ['$sum' => 1],
                    ]],
                ],
                'missingDates' => [
                    ['$match' => ['_revenueDate' => null]], ['$count' => 'count'],
                ],
            ]],
        ])->toArray();
        $buckets = [];
        $orderCount = 0;
        foreach ($results[0]['buckets'] ?? [] as $bucket) {
            $buckets[(string) $bucket['_id']] = (float) (string) $bucket['value'];
            $orderCount += (int) $bucket['orders'];
        }
        $items = [];
        $cursor = match ($unit) {
            'month' => $start->startOfMonth(), 'year' => $start->startOfYear(), default => $start,
        };
        while ($cursor <= $end) {
            $key = $cursor->format(match ($unit) { 'month' => 'Y-m', 'year' => 'Y', default => 'Y-m-d' });
            $title = $cursor->format(match ($unit) { 'month' => 'm/Y', 'year' => 'Y', default => 'd/m/Y' });
            $items[] = ['label' => $unit === 'day' && $start->year === $end->year ? $cursor->format('d/m') : $title,
                'title' => $title, 'value' => $buckets[$key] ?? 0];
            $cursor = match ($unit) { 'month' => $cursor->addMonth(), 'year' => $cursor->addYear(), default => $cursor->addDay() };
        }
        return ['items' => $items, 'total' => array_sum(array_column($items, 'value')),
            'from' => $start->format('Y-m-d'), 'to' => $end->format('Y-m-d'),
            'granularity' => $unit, 'timezone' => 'Asia/Ho_Chi_Minh', 'orderCount' => $orderCount,
            'missingDateCount' => (int) ($results[0]['missingDates'][0]['count'] ?? 0)];
    }

    private function revenueDate(string $field): array
    {
        // Date-only/naive legacy strings are local dates; strings with offsets retain their timezone.
        return ['$switch' => ['branches' => [
            ['case' => ['$eq' => [['$type' => $field], 'date']], 'then' => $field],
            ['case' => ['$eq' => [['$type' => $field], 'string']], 'then' => [
                '$cond' => [
                    ['$regexMatch' => ['input' => $field, 'regex' => '(Z|[+-][0-9]{2}:?[0-9]{2})$', 'options' => 'i']],
                    ['$convert' => ['input' => $field, 'to' => 'date', 'onError' => null, 'onNull' => null]],
                    ['$dateFromString' => ['dateString' => $field, 'timezone' => 'Asia/Ho_Chi_Minh', 'onError' => null, 'onNull' => null]],
                ],
            ]],
        ], 'default' => null]];
    }

    private function resolveRange(string $type, ?string $from, ?string $to): array
    {
        $today = \Carbon\CarbonImmutable::now('Asia/Ho_Chi_Minh')->startOfDay();
        $unit = 'day';
        switch ($type) {
            case '7days':
                $start = $today->subDays(6); $end = $today;
                break;
            case '1month':
                $start = $today->subMonthNoOverflow()->addDay(); $end = $today;
                break;
            case '6months':
                $start = $today->startOfMonth()->subMonths(5); $end = $today; $unit = 'month';
                break;
            case 'custom':
                foreach ([$from, $to] as $date) {
                    if (!$date || !preg_match('/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/D', $date, $parts)
                        || !checkdate((int) $parts[2], (int) $parts[3], (int) $parts[1])) {
                        throw new \InvalidArgumentException('Vui lòng chọn ngày hợp lệ (YYYY-MM-DD).');
                    }
                }
                $start = \Carbon\CarbonImmutable::parse($from, 'Asia/Ho_Chi_Minh')->startOfDay();
                $end = \Carbon\CarbonImmutable::parse($to, 'Asia/Ho_Chi_Minh')->startOfDay();
                if ($start > $end) {
                    throw new \InvalidArgumentException('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
                }
                if ($start->diffInDays($end) > 92) {
                    $unit = $start->diffInMonths($end) > 119 ? 'year' : 'month';
                }
                break;
            default:
                throw new \InvalidArgumentException('Bộ lọc thời gian không hợp lệ.');
        }
        return [$start, $end, $unit];
    }
}
