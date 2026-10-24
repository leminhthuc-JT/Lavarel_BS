import { mountShell } from '../core/shell.js';
import { esc } from '../core/ui.js';

mountShell({
    active: 'product-recommendations',
    title: 'Gợi ý bổ sung bánh',
    subtitle: 'Xem tín hiệu bán hàng, yêu thích và tồn kho để cân nhắc mẻ bánh tiếp theo.'
});
document.body.classList.add('recommendations-page');
const page = document.getElementById('pageContent');
page.innerHTML = `
    <section class="rec-panel" aria-label="Bộ lọc gợi ý">
        <div class="rec-toolbar">
            <label for="recMode">Nguồn dữ liệu
                <select id="recMode" aria-label="Nguồn dữ liệu"><option value="real">Dữ liệu thực</option><option value="synthetic">Dữ liệu mô phỏng</option></select>
            </label>
            <button type="button" class="btn" id="recRefresh">Tải lại</button>
        </div>
        <p class="rec-context" id="recPeriod">Đang xác định kỳ phân tích...</p>
        <div class="rec-summary" aria-label="Thống kê phân tích">
            <div><span>Sản phẩm được phân tích</span><strong id="recProducts">—</strong></div>
            <div><span>Đơn hoàn tất hợp lệ trong kỳ</span><strong id="recOrders">—</strong></div>
        </div>
    </section>
    <section class="rec-results" aria-labelledby="recTitle">
        <div class="rec-list-heading"><h2 id="recTitle">Top 5 bánh nên bổ sung</h2><span id="recUpdated"></span></div>
        <div id="recStatus" role="status" aria-live="polite"></div>
        <div id="recWarnings"></div>
        <div id="recList" class="rec-list" aria-busy="true"></div>
    </section>
    <details class="rec-panel rec-method">
        <summary>Cách tính điểm và phạm vi dữ liệu</summary>
        <p>Đây là thuật toán theo quy tắc, không phải mô hình Machine Learning. Điểm tối đa 100: lượng bán 50%, khách yêu thích duy nhất 30%, thiếu hụt tồn kho 20%.</p>
        <p>Lượng bán và yêu thích chia cho giá trị lớn nhất trong nhóm sản phẩm đang bán có tồn kho hợp lệ. Thiếu hụt = max(0, (đã bán − tồn kho hiện tại) / đã bán); bằng 0 nếu chưa bán. Yêu thích là danh sách hiện có, không giới hạn 30 ngày.</p>
        <p>Chỉ cộng số lượng nguyên dương của đơn Đã giao / Đã nhận hàng, Đã thanh toán và tổng thanh toán dương; tính theo Ngày đặt (giờ Việt Nam). Dữ liệu thực lấy hôm nay và 29 ngày trước; mô phỏng lấy 30 ngày kết thúc ở ngày đặt cuối lịch sử isSynthetic=true. Không trộn yêu thích thật vào mô phỏng.</p>
        <p>Ưu tiên cao: bán ≥ 5, thiếu hụt ≥ 50% và điểm ≥ 60. Cân nhắc bổ sung: bán ≥ 3 và có thiếu hụt. Các trường hợp còn lại theo dõi thêm; nếu dưới 5 đơn hợp lệ, tất cả chỉ để theo dõi. Sắp xếp theo điểm giảm dần, rồi lượng bán, yêu thích, mã bánh. Chỉ liệt kê tối đa 5 bánh có tín hiệu bán hoặc yêu thích.</p>
        <p>Tồn kho luôn là giá trị hiện tại, kể cả ở chế độ mô phỏng; không phải tồn kho trong quá khứ. So sánh với lượng bán là mốc tham khảo nếu nhịp bán tiếp tục, không phải dự báo nhu cầu hay số lượng cần nhập. Chức năng chỉ đọc dữ liệu.</p>
    </details>`;

const mode = document.getElementById('recMode');
const refresh = document.getElementById('recRefresh');
const list = document.getElementById('recList');
const status = document.getElementById('recStatus');
const count = value => Number(value).toLocaleString('vi-VN');
const day = value => value ? value.split('-').reverse().join('/') : '—';
let pending;

async function load() {
    pending?.abort();
    const controller = new AbortController();
    pending = controller;
    const selectedMode = mode.value;
    refresh.disabled = true;
    list.setAttribute('aria-busy', 'true');
    status.className = 'rec-status';
    status.textContent = 'Đang phân tích dữ liệu từ MongoDB...';
    document.getElementById('recWarnings').replaceChildren();
    document.getElementById('recProducts').textContent = '—';
    document.getElementById('recOrders').textContent = '—';
    document.getElementById('recPeriod').textContent = 'Đang xác định kỳ phân tích...';
    document.getElementById('recUpdated').textContent = '';
    list.innerHTML = Array.from({ length: 3 }, () => '<div class="rec-skeleton" aria-hidden="true"><span></span><div><b></b><b></b><b></b></div></div>').join('');
    try {
        const response = await fetch(`/api/admin/product-recommendations?mode=${encodeURIComponent(selectedMode)}`, {
            credentials: 'same-origin', headers: { Accept: 'application/json' }, signal: controller.signal, cache: 'no-store'
        });
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.message || 'Không tải được dữ liệu gợi ý.');
        if (pending !== controller) return;
        const data = payload.data;
        document.getElementById('recProducts').textContent = count(data.analyzedProducts);
        document.getElementById('recOrders').textContent = count(data.validOrders);
        document.getElementById('recPeriod').textContent = `${selectedMode === 'synthetic' ? 'Mô phỏng · 30 ngày cuối lịch sử' : 'Dữ liệu thực · 30 ngày gần nhất'}: ${day(data.from)} – ${day(data.to)} · Tồn kho hiện tại`;
        document.getElementById('recUpdated').textContent = `Cập nhật ${new Date(data.generatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' })}`;
        document.getElementById('recWarnings').innerHTML = data.warnings.map(w => `<p class="rec-notice">${esc(w)}</p>`).join('');
        status.textContent = data.items.length ? `${count(data.items.length)} bánh có tín hiệu để xem xét · Xếp theo điểm giảm dần` : 'Chưa có bánh có tín hiệu bán hoặc yêu thích phù hợp trong kỳ. Không có đề xuất bổ sung.';
        list.innerHTML = data.items.map((item, index) => `
            <article class="rec-product">
                <a class="rec-image" href="/admin/products?search=${encodeURIComponent(item.code)}" aria-label="Quản lý ${esc(item.name)}">
                    ${item.image ? `<img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy">` : '<span>Chưa có ảnh</span>'}
                </a>
                <div class="rec-product-body">
                    <div class="rec-product-heading"><h3><a href="/admin/products?search=${encodeURIComponent(item.code)}">${index + 1}. ${esc(item.name)}</a></h3><span class="rec-priority rec-${['high', 'medium', 'watch'].includes(item.priority) ? item.priority : 'watch'}">${esc(item.priorityLabel)}</span></div>
                    <dl class="rec-metrics"><div><dt>Đã bán trong kỳ</dt><dd>${count(item.sold)}</dd></div><div><dt>Khách yêu thích duy nhất</dt><dd>${count(item.favoriteCustomers)}</dd></div><div><dt>Tồn kho hiện tại</dt><dd>${count(item.stock)}</dd></div><div><dt>Điểm ưu tiên / 100</dt><dd>${count(item.score)}</dd></div></dl>
                    <p class="rec-reason">${esc(item.reason)}</p>
                    <a class="rec-link" href="/admin/products?search=${encodeURIComponent(item.code)}">Mở quản lý sản phẩm <span aria-hidden="true">→</span></a>
                </div>
            </article>`).join('');
        list.querySelectorAll('img').forEach(image => image.addEventListener('error', () => {
            const fallback = document.createElement('span'); fallback.textContent = 'Không tải được ảnh'; image.replaceWith(fallback);
        }, { once: true }));
    } catch (error) {
        if (error.name === 'AbortError' || pending !== controller) return;
        list.replaceChildren();
        document.getElementById('recPeriod').textContent = 'Chưa xác định được kỳ phân tích.';
        status.className = 'rec-status rec-error';
        status.textContent = `${error.message} Nhấn Tải lại để thử lại.`;
    } finally {
        if (pending === controller) { refresh.disabled = false; list.setAttribute('aria-busy', 'false'); }
    }
}
mode.addEventListener('change', load);
refresh.addEventListener('click', load);
load();
