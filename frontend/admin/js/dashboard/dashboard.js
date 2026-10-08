import {
    mountShell
} from '../core/shell.js';

import {
    request
} from '../core/api.js';


mountShell({
    active: 'dashboard',
    title: 'Xin chào, Admin',
    subtitle:
        'Tổng quan hoạt động cửa hàng bánh hôm nay.'
});


const page =
    document.getElementById('pageContent');


/* =========================
   FORMAT
========================= */

function money(value) {

    return Number(value || 0)
        .toLocaleString('vi-VN')
        + 'đ';
}


/* =========================
   LAYOUT
========================= */

page.innerHTML = `

    <!-- KPI -->
    <section class="kpis dashboard-kpis">

        <article class="card kpi">

            <div class="kpi-top">

                <span class="kpi-icon">
                    ₫
                </span>

                <span class="kpi-label">
                    Tổng doanh thu
                </span>

            </div>

            <div
                class="kpi-value"
                id="totalRevenue"
            >
                0đ
            </div>

            <div class="kpi-note">
                Tổng doanh thu hệ thống
            </div>

        </article>


        <article class="card kpi">

            <div class="kpi-top">

                <span class="kpi-icon">
                    ◷
                </span>

                <span class="kpi-label">
                    Doanh thu tháng này
                </span>

            </div>

            <div
                class="kpi-value"
                id="monthRevenue"
            >
                0đ
            </div>

            <div class="kpi-note">
                Doanh thu trong tháng hiện tại
            </div>

        </article>


        <article class="card kpi">

            <div class="kpi-top">

                <span class="kpi-icon">
                    ▤
                </span>

                <span class="kpi-label">
                    Đơn hàng
                </span>

            </div>

            <div
                class="kpi-value"
                id="orderCount"
            >
                0
            </div>

            <div class="kpi-note">
                Tổng số đơn hàng
            </div>

        </article>


        <article class="card kpi">

            <div class="kpi-top">

                <span class="kpi-icon">
                    ◫
                </span>

                <span class="kpi-label">
                    Sản phẩm
                </span>

            </div>

            <div
                class="kpi-value"
                id="productCount"
            >
                0
            </div>

            <div class="kpi-note">
                Tổng sản phẩm đang quản lý
            </div>

        </article>

    </section>



    <!-- CHART + QUICK ACTION -->
    <section class="dashboard-main-grid">

        <article class="card revenue-card">

            <div class="panel-head revenue-head">

                <div>

                    <div class="panel-eyebrow">
                        PHÂN TÍCH
                    </div>

                    <div class="panel-title">
                        Doanh thu
                    </div>

                </div>


                <div class="chart-tabs">

                    <button
                        class="chart-tab active"
                        data-type="day"
                    >
                        Ngày
                    </button>

                    <button
                        class="chart-tab"
                        data-type="month"
                    >
                        Tháng
                    </button>

                    <button
                        class="chart-tab"
                        data-type="year"
                    >
                        Năm
                    </button>

                    <button
                        class="chart-tab"
                        data-type="custom"
                    >
                        Tùy chọn
                    </button>

                </div>

            </div>


            <!-- DATE RANGE -->
            <div
                class="date-range hidden"
                id="customRange"
            >

                <div>

                    <label>
                        Từ ngày
                    </label>

                    <input
                        type="date"
                        id="fromDate"
                    >

                </div>


                <span class="date-arrow">
                    →
                </span>


                <div>

                    <label>
                        Đến ngày
                    </label>

                    <input
                        type="date"
                        id="toDate"
                    >

                </div>


                <button
                    class="btn btn-primary"
                    id="applyRange"
                >
                    Áp dụng
                </button>

            </div>


            <div class="chart-summary">

                <div>

                    <span>
                        Doanh thu trong khoảng
                    </span>

                    <strong
                        id="chartRevenue"
                    >
                        0đ
                    </strong>

                </div>

            </div>


            <div class="chart-container">

                <canvas
                    id="revenueChart"
                ></canvas>

            </div>

        </article>



        <!-- QUICK ACTION -->
        <article class="card panel quick-panel">

            <div class="panel-head">

                <div>

                    <div class="panel-eyebrow">
                        QUẢN TRỊ
                    </div>

                    <div class="panel-title">
                        Thao tác nhanh
                    </div>

                </div>

            </div>


            <div class="quick-actions">

                <a
                    href="../products/index.html"
                    class="quick-action"
                >

                    <span>
                        ＋
                    </span>

                    <div>

                        <strong>
                            Quản lý sản phẩm
                        </strong>

                        <small>
                            Thêm, sửa và cập nhật bánh
                        </small>

                    </div>

                    <b>
                        →
                    </b>

                </a>


                <a
                    href="../orders/index.html"
                    class="quick-action"
                >

                    <span>
                        ▤
                    </span>

                    <div>

                        <strong>
                            Xử lý đơn hàng
                        </strong>

                        <small>
                            Kiểm tra đơn đang chờ
                        </small>

                    </div>

                    <b>
                        →
                    </b>

                </a>


                <a
                    href="../promotions/index.html"
                    class="quick-action"
                >

                    <span>
                        ✦
                    </span>

                    <div>

                        <strong>
                            Quản lý khuyến mãi
                        </strong>

                        <small>
                            Chương trình ưu đãi
                        </small>

                    </div>

                    <b>
                        →
                    </b>

                </a>

            </div>

        </article>

    </section>



    <!-- BOTTOM -->
    <section class="dashboard-bottom-grid">

        <!-- ORDERS -->
        <article class="card panel">

            <div class="panel-head">

                <div>

                    <div class="panel-eyebrow">
                        GẦN ĐÂY
                    </div>

                    <div class="panel-title">
                        Đơn hàng mới
                    </div>

                </div>


                <a
                    href="../orders/index.html"
                    class="view-all"
                >
                    Xem tất cả →
                </a>

            </div>


            <div class="table-wrap">

                <table>

                    <thead>

                    <tr>

                        <th>
                            Mã đơn
                        </th>

                        <th>
                            Khách hàng
                        </th>

                        <th>
                            Ngày đặt
                        </th>

                        <th>
                            Trạng thái
                        </th>

                        <th>
                            Tổng tiền
                        </th>

                    </tr>

                    </thead>


                    <tbody id="recentOrders">

                    <tr>

                        <td
                            colspan="5"
                            class="empty"
                        >
                            Đang tải dữ liệu...
                        </td>

                    </tr>

                    </tbody>

                </table>

            </div>

        </article>



        <!-- DATA OVERVIEW -->
        <article class="card panel">

            <div class="panel-head">

                <div>

                    <div class="panel-eyebrow">
                        HỆ THỐNG
                    </div>

                    <div class="panel-title">
                        Tổng quan dữ liệu
                    </div>

                </div>

                <span class="badge">
                    QL_CakeShop
                </span>

            </div>


            <div class="metric-list">

                <div class="metric-row">

                    <span>
                        Nhân viên
                    </span>

                    <strong
                        id="employeeCount"
                    >
                        0
                    </strong>

                </div>


                <div class="metric-row">

                    <span>
                        Khuyến mãi
                    </span>

                    <strong
                        id="promotionCount"
                    >
                        0
                    </strong>

                </div>


                <div class="metric-row">

                    <span>
                        Đơn chờ xử lý
                    </span>

                    <strong
                        id="pendingOrders"
                    >
                        0
                    </strong>

                </div>


                <div class="metric-row">

                    <span>
                        Danh sách yêu thích
                    </span>

                    <strong
                        id="favoriteCount"
                    >
                        0
                    </strong>

                </div>

            </div>

        </article>

    </section>

`;


/* =========================
   MOCK DATA
========================= */

const mockDashboard = {

    success: true,

    data: {

        totalRevenue: 128500000,

        monthRevenue: 84200000,

        counts: {

            products: 39,

            orders: 18,

            employees: 5,

            promotions: 2,

            favorites: 2,

            pendingOrders: 4

        },

        revenue: [

            {
                label: '11/09',
                value: 3500000
            },

            {
                label: '12/09',
                value: 5200000
            },

            {
                label: '13/09',
                value: 4100000
            },

            {
                label: '14/09',
                value: 7600000
            },

            {
                label: '15/09',
                value: 6200000
            },

            {
                label: '16/09',
                value: 9100000
            },

            {
                label: '17/09',
                value: 12400000
            }

        ],

        recentOrders: [

            {
                MaDH: 'DH001',
                MaKH: 'KH001',
                NgayDat: '2026-09-17',
                TrangThaiDonHang: 'Chờ xác nhận',
                TongThanhToan: 580000
            },

            {
                MaDH: 'DH002',
                MaKH: 'KH002',
                NgayDat: '2026-09-16',
                TrangThaiDonHang: 'Đã xác nhận',
                TongThanhToan: 540000
            }

        ]

    }

};



let revenueChart;


/* =========================
   CHART
========================= */

function renderChart(items) {

    const canvas =
        document.getElementById(
            'revenueChart'
        );


    const labels =
        items.map(
            item => item.label
        );


    const values =
        items.map(
            item => item.value
        );


    const total =
        values.reduce(
            (sum, value) =>
                sum + Number(value),
            0
        );


    document.getElementById(
        'chartRevenue'
    ).textContent =
        money(total);


    if (revenueChart) {

        revenueChart.destroy();

    }


    revenueChart =
        new Chart(
            canvas,
            {

                type: 'line',

                data: {

                    labels,

                    datasets: [

                        {

                            label:
                                'Doanh thu',

                            data:
                                values,

                            borderColor:
                                '#71877A',

                            backgroundColor:
                                'rgba(147, 167, 155, 0.12)',

                            fill:
                                true,

                            tension:
                                0.38,

                            borderWidth:
                                2,

                            pointRadius:
                                3,

                            pointHoverRadius:
                                5,

                            pointBackgroundColor:
                                '#71877A'

                        }

                    ]

                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    interaction: {

                        intersect:
                            false,

                        mode:
                            'index'

                    },


                    plugins: {

                        legend: {

                            display:
                                false

                        },

                        tooltip: {

                            callbacks: {

                                label(context) {

                                    return money(
                                        context.raw
                                    );

                                }

                            }

                        }

                    },


                    scales: {

                        x: {

                            grid: {

                                display:
                                    false

                            },

                            border: {

                                display:
                                    false

                            }

                        },


                        y: {

                            beginAtZero:
                                true,

                            border: {

                                display:
                                    false

                            },

                            grid: {

                                color:
                                    'rgba(52,58,53,.06)'

                            },

                            ticks: {

                                callback(value) {

                                    if (
                                        value >=
                                        1000000
                                    ) {

                                        return (
                                            value /
                                            1000000
                                        ) + 'tr';

                                    }

                                    return value;

                                }

                            }

                        }

                    }

                }

            }
        );

}


/* =========================
   STATUS
========================= */

function statusBadge(status) {

    let cls = '';

    if (
        status ===
        'Chờ xác nhận'
    ) {

        cls = 'warn';

    }


    if (
        status ===
        'Đã hủy'
    ) {

        cls = 'danger';

    }


    return `
        <span class="badge ${cls}">
            ${status}
        </span>
    `;

}


/* =========================
   RECENT ORDERS
========================= */

function renderOrders(items) {

    const tbody =
        document.getElementById(
            'recentOrders'
        );


    if (!items?.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="empty"
                >
                    Chưa có đơn hàng
                </td>

            </tr>

        `;

        return;

    }


    tbody.innerHTML =
        items.map(
            item => `

                <tr>

                    <td>
                        <strong>
                            ${item.MaDH}
                        </strong>
                    </td>

                    <td>
                        ${item.MaKH}
                    </td>

                    <td>
                        ${
                            new Date(
                                item.NgayDat
                            )
                            .toLocaleDateString(
                                'vi-VN'
                            )
                        }
                    </td>

                    <td>
                        ${
                            statusBadge(
                                item.TrangThaiDonHang
                            )
                        }
                    </td>

                    <td>
                        ${money(
                            item.TongThanhToan
                        )}
                    </td>

                </tr>

            `
        ).join('');

}


/* =========================
   LOAD DASHBOARD
========================= */

async function loadDashboard() {

    const result =
        await request(
            '/admin/dashboard',
            {},
            mockDashboard
        );


    const data =
        result.data;


    document.getElementById(
        'totalRevenue'
    ).textContent =
        money(
            data.totalRevenue
            ?? data.revenue
        );


    document.getElementById(
        'monthRevenue'
    ).textContent =
        money(
            data.monthRevenue
            ?? 0
        );


    const counts =
        data.counts || {};


    document.getElementById(
        'productCount'
    ).textContent =
        counts.products ?? 0;


    document.getElementById(
        'orderCount'
    ).textContent =
        counts.orders ?? 0;


    document.getElementById(
        'employeeCount'
    ).textContent =
        counts.employees ?? 0;


    document.getElementById(
        'promotionCount'
    ).textContent =
        counts.promotions ?? 0;


    document.getElementById(
        'favoriteCount'
    ).textContent =
        counts.favorites ?? 0;


    document.getElementById(
        'pendingOrders'
    ).textContent =
        counts.pendingOrders ?? 0;


    renderChart(
        data.revenue ?? []
    );


    renderOrders(
        data.recentOrders ?? []
    );

}



/* =========================
   CHART FILTER
========================= */

async function loadRevenue(
    type,
    from = '',
    to = ''
) {

    let url =
        `/admin/dashboard/revenue?type=${type}`;


    if (from) {

        url +=
            `&from=${encodeURIComponent(from)}`;

    }


    if (to) {

        url +=
            `&to=${encodeURIComponent(to)}`;

    }


    try {

        const result =
            await request(
                url,
                {},
                null
            );


        renderChart(
            result.data.items
            ?? result.data
            ?? []
        );

    }
    catch (error) {

        console.warn(
            'Revenue API chưa có, dùng mock.'
        );

    }

}



/* =========================
   TAB EVENTS
========================= */

document
    .querySelectorAll(
        '.chart-tab'
    )
    .forEach(
        button => {

            button.addEventListener(
                'click',
                () => {

                    document
                        .querySelectorAll(
                            '.chart-tab'
                        )
                        .forEach(
                            item =>
                                item.classList
                                    .remove(
                                        'active'
                                    )
                        );


                    button
                        .classList
                        .add(
                            'active'
                        );


                    const type =
                        button.dataset.type;


                    const customRange =
                        document.getElementById(
                            'customRange'
                        );


                    if (
                        type ===
                        'custom'
                    ) {

                        customRange
                            .classList
                            .remove(
                                'hidden'
                            );

                        return;

                    }


                    customRange
                        .classList
                        .add(
                            'hidden'
                        );


                    loadRevenue(
                        type
                    );

                }
            );

        }
    );



document
    .getElementById(
        'applyRange'
    )
    .addEventListener(
        'click',
        () => {

            const from =
                document.getElementById(
                    'fromDate'
                ).value;


            const to =
                document.getElementById(
                    'toDate'
                ).value;


            if (
                !from ||
                !to
            ) {

                alert(
                    'Vui lòng chọn đầy đủ khoảng thời gian.'
                );

                return;

            }


            loadRevenue(
                'custom',
                from,
                to
            );

        }
    );


loadDashboard();