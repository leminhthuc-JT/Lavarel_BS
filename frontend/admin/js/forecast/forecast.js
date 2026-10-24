import { mountShell } from '../core/shell.js';
import { request } from '../core/api.js';
import { esc, money } from '../core/ui.js';

mountShell({active: 'forecast', title: 'AI Dự báo doanh thu', subtitle: ''});
const page = document.getElementById('pageContent');
page.classList.add('forecast-page');
page.innerHTML = `
    <div class="forecast-toolbar">
        <span class="forecast-source">Dữ liệu mô phỏng</span>
        <button type="button" class="btn btn-primary" id="runForecast">Dự báo 7 ngày</button>
    </div>
    <p class="forecast-context">Dự báo bắt đầu ngay sau ngày cuối dataset mô phỏng đã huấn luyện, không tính từ ngày hôm nay.</p>
    <p id="forecastStatus" class="forecast-status" role="status" aria-live="polite">Nhấn “Dự báo 7 ngày” để xem kết quả từ mô hình đã huấn luyện.</p>
    <div class="forecast-grid" id="forecastResults" aria-busy="false">
        <section class="card forecast-panel forecast-chart-panel" aria-labelledby="forecastTotalTitle">
            <h2 id="forecastTotalTitle">Tổng doanh thu dự kiến 7 ngày</h2>
            <strong id="forecastTotal" class="forecast-total">—</strong>
            <p id="forecastPeriod" class="forecast-caption">Chưa có kết quả dự báo.</p>
            <div class="forecast-chart"><canvas id="forecastChart" role="img" aria-label="Doanh thu dự báo theo ngày; số liệu chi tiết nằm trong bảng bên cạnh" hidden></canvas><p id="forecastEmpty">Kết quả sẽ hiển thị tại đây.</p></div>
        </section>
        <section class="card forecast-panel forecast-daily" aria-labelledby="forecastDailyTitle">
            <h2 id="forecastDailyTitle">Chi tiết từng ngày</h2>
            <div class="table-wrap"><table><thead><tr><th scope="col">Ngày</th><th scope="col">Doanh thu dự báo</th></tr></thead><tbody id="forecastRows"><tr><td colspan="2">Chưa có dữ liệu.</td></tr></tbody></table></div>
        </section>
    </div>
    <section class="card forecast-panel forecast-model" aria-labelledby="forecastModelTitle">
        <h2 id="forecastModelTitle">Thông tin mô hình</h2>
        <p id="metricsStatus" class="forecast-caption" role="status">Đang tải thông tin mô hình…</p>
        <div id="modelInfo" hidden></div>
    </section>
`;
const byId = id => document.getElementById(id);
const number = value => value == null ? '—' : Number(value).toLocaleString('vi-VN');
const cash = value => value == null ? '—' : money(value);
const percent = value => value == null ? 'Không xác định' : `${Number(value).toLocaleString('vi-VN', {maximumFractionDigits: 2})}%`;
const day = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value.split('-').reverse().join('/') : '—';
let chart;
function renderMetrics(metrics) {
    const rf = metrics.random_forest;
    const naive = metrics.seasonal_naive;
    const trained = new Date(metrics.trained_at);
    const comparison = metrics.comparison === 'better' ? 'Random Forest có MAE thấp hơn Seasonal Naive trên tập test.'
        : metrics.comparison === 'worse' ? 'Random Forest có MAE cao hơn Seasonal Naive trên tập test; mô hình chưa tốt hơn baseline.'
        : 'Random Forest và Seasonal Naive có MAE tương đương trên tập test.';
    const data = metrics.data;
    byId('modelInfo').innerHTML = `
        <p class="forecast-model-name">${esc(metrics.model)}</p>
        <p class="forecast-comparison ${metrics.comparison === 'worse' ? 'is-worse' : ''}">${esc(comparison)}</p>
        <div class="table-wrap"><table class="forecast-metrics-table"><thead><tr><th scope="col">Mô hình</th><th scope="col">MAE (VNĐ)</th><th scope="col">RMSE (VNĐ)</th><th scope="col">WAPE</th></tr></thead>
        <tbody><tr><th scope="row">Random Forest</th><td>${esc(cash(Math.round(rf.mae)))}</td><td>${esc(cash(Math.round(rf.rmse)))}</td><td>${esc(percent(rf.wape))}</td></tr>
        <tr><th scope="row">Seasonal Naive (7 ngày)</th><td>${esc(cash(Math.round(naive.mae)))}</td><td>${esc(cash(Math.round(naive.rmse)))}</td><td>${esc(percent(naive.wape))}</td></tr></tbody></table></div>
        <dl class="forecast-model-details">
            <div><dt>Lịch sử mô phỏng</dt><dd>${esc(day(data.history_start))} – ${esc(day(data.history_end))} · ${esc(number(data.history_days))} ngày</dd></div>
            <div><dt>Đơn hợp lệ / đơn mô phỏng</dt><dd>${esc(number(data.eligible_orders))} / ${esc(number(data.synthetic_orders))}</dd></div>
            <div><dt>Train kiểm định (80%)</dt><dd>${esc(number(metrics.train.rows))} dòng · ${esc(day(metrics.train.from))} – ${esc(day(metrics.train.to))}</dd></div>
            <div><dt>Test kiểm định (20%)</dt><dd>${esc(number(metrics.test.rows))} dòng · ${esc(day(metrics.test.from))} – ${esc(day(metrics.test.to))}</dd></div>
            <div><dt>Refit cho dự báo</dt><dd>${esc(number(metrics.final_fit_rows))} dòng đặc trưng từ toàn bộ lịch sử</dd></div>
            <div><dt>Huấn luyện lúc</dt><dd>${esc(Number.isNaN(trained.getTime()) ? '—' : trained.toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'}))} · ${esc(number(metrics.training_seconds))} giây</dd></div>
        </dl>
        <details class="forecast-method"><summary>Cách tính và kiểm định</summary><p>${esc(metrics.evaluation)}</p><p>${esc(data.date_policy)}</p><p>${esc(number(data.fallback_order_date_count))} đơn hợp lệ dùng ngày đặt thay thế. ${esc(number(data.zero_revenue_days))} ngày doanh thu bằng 0. ${esc(number(data.duplicate_orders_skipped))} đơn trùng đã loại.</p><p>${esc(metrics.wape_note)}</p><p>Đặc trưng: ${esc(metrics.features.join(', '))}.</p></details>
    `;
    byId('modelInfo').hidden = false;
    byId('metricsStatus').textContent = 'Kiểm định trên dữ liệu mô phỏng; kết quả không bảo đảm hiệu quả trên đơn hàng thật.';
}
function clearForecast(message) {
    if (chart) { chart.destroy(); chart = null; }
    byId('forecastChart').hidden = true;
    byId('forecastEmpty').hidden = false;
    byId('forecastEmpty').textContent = message;
    byId('forecastTotal').textContent = '—';
    byId('forecastPeriod').textContent = 'Chưa có kết quả dự báo.';
    byId('forecastRows').innerHTML = '<tr><td colspan="2">Chưa có dữ liệu.</td></tr>';
}
function renderForecast(data) {
    byId('forecastTotal').textContent = cash(data.total);
    byId('forecastPeriod').textContent = `${day(data.from)} – ${day(data.to)} · Asia/Ho_Chi_Minh`;
    byId('forecastRows').innerHTML = data.items.map(item => `<tr><td>${esc(day(item.date))}</td><td>${esc(cash(item.revenue))}</td></tr>`).join('');
    renderMetrics(data.metrics);
    if (typeof Chart === 'undefined') {
        byId('forecastEmpty').textContent = 'Không tải được thư viện biểu đồ. Bạn vẫn có thể xem đủ 7 ngày trong bảng.';
        return;
    }
    byId('forecastEmpty').hidden = true;
    byId('forecastChart').hidden = false;
    const color = getComputedStyle(document.documentElement).getPropertyValue('--sage-dark').trim() || '#9C5667';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    chart = new Chart(byId('forecastChart'), {
        type: 'line',
        data: {labels: data.items.map(item => day(item.date)), datasets: [{label: 'Doanh thu dự báo', data: data.items.map(item => item.revenue), borderColor: color, pointBackgroundColor: color, borderWidth: 2, pointRadius: 3, tension: .2, fill: false}]},
        options: {responsive: true, maintainAspectRatio: false, animation: reduced ? false : {duration: 250},
            interaction: {intersect: false, mode: 'index'}, plugins: {legend: {display: false}, tooltip: {callbacks: {label: context => cash(context.raw)}}},
            scales: {x: {grid: {display: false}, ticks: {maxRotation: 0}}, y: {beginAtZero: true, ticks: {maxTicksLimit: 5, callback: value => cash(value)}, grid: {color: '#EBDDE0'}}}}
    });
}
byId('runForecast').addEventListener('click', async () => {
    const button = byId('runForecast');
    if (button.disabled) return;
    button.disabled = true;
    button.textContent = 'Đang dự báo…';
    byId('forecastResults').setAttribute('aria-busy', 'true');
    byId('forecastStatus').classList.remove('is-error');
    byId('forecastStatus').textContent = 'Đang lấy dự báo từ Python service…';
    clearForecast('Đang tải dữ liệu…');
    try {
        const response = await request('/admin/forecast?days=7', {method: 'GET'});
        renderForecast(response.data);
        byId('forecastStatus').textContent = 'Đã nhận dự báo 7 ngày từ model đã huấn luyện.';
    } catch (error) {
        clearForecast('Chưa có kết quả. Vui lòng thử lại sau khi service sẵn sàng.');
        byId('forecastStatus').textContent = error.message || 'Không thể tải dự báo.';
        byId('forecastStatus').classList.add('is-error');
    } finally {
        button.disabled = false;
        button.textContent = 'Dự báo 7 ngày';
        byId('forecastResults').setAttribute('aria-busy', 'false');
    }
});
request('/admin/forecast/metrics', {method: 'GET'})
    .then(response => renderMetrics(response.data))
    .catch(error => { byId('metricsStatus').textContent = error.message || 'Chưa tải được thông tin mô hình.'; });
