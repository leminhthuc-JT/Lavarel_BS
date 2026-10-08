<?php

declare(strict_types=1);

namespace Admin\Services;

use MongoDB\BSON\UTCDateTime;
use Shared\Helpers\DocumentSerializer;

use MongoDB\Database;

final class DashboardService
{
    private Database $db;

    public function __construct()
    {
        require_once dirname(__DIR__, 2) . '/config/database.php';

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

    public function revenue(
        string $type,
        ?string $from = null,
        ?string $to = null
    ): array {

        [$start, $end, $format] =
            $this->resolveRange(
                $type,
                $from,
                $to
            );


        $pipeline = [

            [
                '$match' => [

                    'NgayDat' => [

                        '$gte' =>
                        new UTCDateTime(
                            $start
                                ->getTimestamp()
                                * 1000
                        ),

                        '$lte' =>
                        new UTCDateTime(
                            $end
                                ->getTimestamp()
                                * 1000
                        )

                    ],

                    'TrangThaiDonHang' => [
                        '$ne' => 'Đã hủy'
                    ]

                ]
            ],

            [
                '$group' => [

                    '_id' => [

                        '$dateToString' => [

                            'format' =>
                            $format,

                            'date' =>
                            '$NgayDat',

                            'timezone' =>
                            'Asia/Ho_Chi_Minh'

                        ]

                    ],

                    'value' => [

                        '$sum' =>
                        '$TongThanhToan'

                    ]

                ]
            ],

            [
                '$sort' => [
                    '_id' => 1
                ]
            ]

        ];


        $results =
            $this->db
            ->selectCollection('DonHangs')
            ->aggregate(
                $pipeline
            )
            ->toArray();


        $items = [];


        foreach (
            $results
            as $item
        ) {

            $items[] = [

                'label' =>
                $item['_id'],

                'value' =>
                $item['value']

            ];
        }


        return $items;
    }



    private function resolveRange(
        string $type,
        ?string $from,
        ?string $to
    ): array {

        switch ($type) {

            case 'month':

                $start =
                    new \DateTime(
                        'first day of January this year 00:00:00'
                    );

                $end =
                    new \DateTime(
                        'last day of December this year 23:59:59'
                    );

                $format =
                    '%m/%Y';

                break;



            case 'year':

                $start =
                    new \DateTime(
                        '-4 years January 1 00:00:00'
                    );

                $end =
                    new \DateTime(
                        'December 31 this year 23:59:59'
                    );

                $format =
                    '%Y';

                break;



            case 'custom':

                if (
                    !$from ||
                    !$to
                ) {

                    throw new
                        \InvalidArgumentException(
                            'Thiếu khoảng thời gian'
                        );
                }


                $start =
                    new \DateTime(
                        $from . ' 00:00:00'
                    );

                $end =
                    new \DateTime(
                        $to . ' 23:59:59'
                    );


                /*
                Khoảng custom:
                mặc định group theo ngày
                */

                $format =
                    '%d/%m';

                break;



            case 'day':

            default:

                $start =
                    new \DateTime(
                        '-13 days 00:00:00'
                    );

                $end =
                    new \DateTime(
                        'today 23:59:59'
                    );

                $format =
                    '%d/%m';

                break;
        }


        return [
            $start,
            $end,
            $format
        ];
    }
}
