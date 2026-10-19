import { mountShell } from '../core/shell.js';
import { request } from '../core/api.js';
import { esc, money, shortDate, statusBadge } from '../core/ui.js';

mountShell({active: 'orders', title: 'Quản lý đơn hàng', subtitle: ''});
document.querySelector('.hero p')?.remove();
for (const filename of ['products.css', 'categories.css', 'orders.css']) {
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet'; stylesheet.href = new URL('../../css/' + filename, import.meta.url).href;
  document.head.append(stylesheet);
}
const page = document.getElementById('pageContent');
page.innerHTML = `
  <section class="card panel">
    <div class="panel-head"><div class="panel-eyebrow">ĐƠN HÀNG</div></div>
    <div class="toolbar orders-toolbar">
      <input id="searchInput" type="search" placeholder="Tìm theo mã đơn, mã khách hàng, SĐT hoặc địa chỉ..." aria-label="Tìm đơn hàng" title="Nhấn Enter để tìm kiếm">
      <button class="btn product-icon-button" id="toggleOrderFilters" type="button" title="Lọc đơn hàng" aria-label="Lọc đơn hàng" aria-controls="orderFilters" aria-expanded="false"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h18l-7 8v6l-4 2v-8L3 4Z"/></svg></button>
    </div>
    <form class="toolbar category-filters orders-filters" id="orderFilters" hidden>
      <label for="statusFilter">Trạng thái đơn hàng<select id="statusFilter" aria-label="Trạng thái đơn hàng"><option value="">Tất cả trạng thái đơn</option></select></label>
      <label for="paymentFilter">Trạng thái thanh toán<select id="paymentFilter" aria-label="Trạng thái thanh toán"><option value="">Tất cả trạng thái thanh toán</option></select></label>
      <div class="category-filter-actions"><button class="btn btn-primary" type="submit">Áp dụng</button><button class="btn" id="resetOrderFilters" type="button">Đặt lại</button></div>
    </form>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th>Tổng thanh toán</th><th>Thanh toán</th><th>Trạng thái đơn</th><th>Ngày đặt</th></tr></thead>
        <tbody id="tbody"><tr><td colspan="7" class="empty">Đang tải dữ liệu...</td></tr></tbody>
      </table>
    </div>
    <nav id="orderPagination" class="product-pagination" aria-label="Phân trang đơn hàng"></nav>
  </section>`;

const savedOrderParams = new URLSearchParams(location.search);
let currentPage = Math.max(1, Number(savedOrderParams.get('page')) || 1);
let filterKey = null;
let sequence = 0;
let appliedFilters = {status: savedOrderParams.get('status') || '', payment_status: savedOrderParams.get('payment_status') || ''};
document.getElementById('searchInput').value = savedOrderParams.get('search') || '';
let optionsLoaded = false;

function populateStatuses(id, values, title, selected) {
  const select = document.getElementById(id);
  select.innerHTML = `<option value="">${title}</option>` + values.map(value => `<option value="${esc(value)}">${esc(value)}</option>`).join('');
  select.value = selected;
}
function renderPagination(pagination) {
  const pages = Math.max(1, pagination.totalPages);
  const button = (number, label, title, disabled = false, current = false) => `<button type="button" class="btn${current ? ' is-current' : ''}" data-order-page="${number}" title="${title}" aria-label="${title}" ${disabled ? 'disabled' : ''} ${current ? 'aria-current="page"' : ''}>${label}</button>`;
  document.getElementById('orderPagination').innerHTML = button(currentPage - 1, '‹', 'Trang trước', currentPage <= 1)
    + Array.from({length: pages}, (_, i) => button(i + 1, i + 1, `Trang ${i + 1}`, false, i + 1 === currentPage)).join('')
    + button(currentPage + 1, '›', 'Trang sau', currentPage >= pages);
}
async function load() {
  const tbody = document.getElementById('tbody');
  const currentSequence = ++sequence;
  const params = new URLSearchParams();
  const search = document.getElementById('searchInput').value.trim();
  if (search) params.set('search', search);
  for (const [key, value] of Object.entries(appliedFilters)) if (value) params.set(key, value);
  const nextKey = params.toString();
  if (filterKey !== null && filterKey !== nextKey) currentPage = 1;
  filterKey = nextKey;
  params.set('page', String(currentPage)); params.set('limit', '10');
  tbody.innerHTML = '<tr><td colspan="7" class="empty">Đang tải dữ liệu...</td></tr>';
  try {
    const result = await request('/admin/orders?' + params, {method: 'GET'});
    if (currentSequence !== sequence) return;
    const items = result.data.items;
    const pagination = result.data.pagination;
    currentPage = pagination.page; params.set('page', String(currentPage));
    history.replaceState(null, '', `${location.pathname}?${params}`);
    if (!optionsLoaded) {
      populateStatuses('statusFilter', result.data.filters.orderStatuses, 'Tất cả trạng thái đơn', appliedFilters.status);
      populateStatuses('paymentFilter', result.data.filters.paymentStatuses, 'Tất cả trạng thái thanh toán', appliedFilters.payment_status);
      optionsLoaded = true;
    }
    renderPagination(pagination);
    tbody.innerHTML = items.length ? items.map(item => `<tr>
      <td><strong>${esc(item.MaDH)}</strong></td>
      <td>${esc(item.MaKH)}</td>
      <td>${(item.SanPhams||[]).map(x=>`${esc(x.TenSP)} × ${esc(x.SoLuong)}`).join('<br>')}</td>
      <td>${money(item.TongThanhToan)}</td>
      <td>${statusBadge(item.TrangThaiThanhToan)}</td>
      <td>${statusBadge(item.TrangThaiDonHang)}</td>
      <td>${shortDate(item.NgayDat)}</td>
    </tr>`).join('') :
      `<tr><td colspan="7" class="empty">Không có dữ liệu</td></tr>`;
  } catch (e) {
    if (currentSequence !== sequence) return;
    tbody.innerHTML = `<tr><td colspan="7" class="empty">Không tải được dữ liệu: ${esc(e.message)}</td></tr>`;
  }
}
document.getElementById('toggleOrderFilters').addEventListener('click', event => {
  const filters = document.getElementById('orderFilters'); filters.hidden = !filters.hidden;
  event.currentTarget.setAttribute('aria-expanded', String(!filters.hidden));
});
document.getElementById('orderFilters').addEventListener('submit', event => {
  event.preventDefault();
  appliedFilters = {status: document.getElementById('statusFilter').value, payment_status: document.getElementById('paymentFilter').value};
  load();
});
document.getElementById('resetOrderFilters').addEventListener('click', () => {
  document.getElementById('orderFilters').reset();
  appliedFilters = {status: '', payment_status: ''}; currentPage = 1; load();
});
document.getElementById('orderPagination').addEventListener('click', event => {
  const button = event.target.closest('[data-order-page]');
  if (!button || button.disabled || button.hasAttribute('aria-current')) return;
  currentPage = Number(button.dataset.orderPage); load();
});
let searchTimer;
document.getElementById('searchInput').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(load, 300); });
document.getElementById('searchInput').addEventListener('keydown', event => { if (event.key === 'Enter') { clearTimeout(searchTimer); load(); } });
document.addEventListener('admin:reload', load);
load();
