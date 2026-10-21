import { mountShell } from '../core/shell.js';
import { request } from '../core/api.js';
import { esc, money, shortDate } from '../core/ui.js';

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
    <div class="table-wrap orders-table-wrap">
      <table class="orders-table">
        <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th>Tổng tiền</th><th>Ngày đặt</th><th>Thanh toán</th><th>Trạng thái đơn</th><th>Thao tác</th></tr></thead>
        <tbody id="tbody"><tr><td colspan="8" class="empty">Đang tải dữ liệu...</td></tr></tbody>
      </table>
    </div>
    <nav id="orderPagination" class="product-pagination" aria-label="Phân trang đơn hàng"></nav>
    <p id="orderNotice" class="order-notice" role="status" aria-live="polite"></p>
  </section>
  <dialog id="orderActionDialog" class="order-action-dialog" aria-labelledby="orderActionTitle">
    <form id="orderActionForm">
      <h2 id="orderActionTitle"></h2>
      <p id="orderActionWarning"></p>
      <div id="paymentVerification" class="order-verification" hidden>
        <label for="paymentReference">Mã giao dịch / biên nhận đã kiểm tra</label>
        <input id="paymentReference" type="text" minlength="6" maxlength="200">
        <label class="order-verified-check"><input id="paymentVerified" type="checkbox"> Tôi đã kiểm tra chứng từ và xác minh cửa hàng đã nhận đủ tiền.</label>
      </div>
      <div id="refundRecording" class="order-verification" hidden>
        <label for="refundNote">Phương án xử lý hoàn tiền</label>
        <textarea id="refundNote" rows="3" minlength="10" maxlength="1000" placeholder="Ghi nhận người phụ trách, cách liên hệ và phương án xử lý..."></textarea>
      </div>
      <p id="orderDialogError" class="order-dialog-error" role="alert"></p>
      <div class="form-actions"><button class="btn" id="closeOrderAction" type="button">Quay lại</button><button class="btn btn-primary" id="confirmOrderAction" type="submit">Xác nhận</button></div>
    </form>
  </dialog>`;

const savedOrderParams = new URLSearchParams(location.search);
let currentPage = Math.max(1, Number(savedOrderParams.get('page')) || 1);
let filterKey = null;
let sequence = 0;
let appliedFilters = {status: savedOrderParams.get('status') || '', payment_status: savedOrderParams.get('payment_status') || ''};
document.getElementById('searchInput').value = savedOrderParams.get('search') || '';
let optionsLoaded = false;

let displayedOrders = new Map();
const updatingOrders = new Set();
const actionDialog = document.getElementById('orderActionDialog');
let pendingAction = null;
function notice(message, failed = false) {
  const element = document.getElementById('orderNotice');
  element.textContent = message; element.classList.toggle('is-error', failed);
}
function statusTone(status) {
  return /hủy|ngừng/i.test(status) ? 'is-danger' : /chờ|chưa|mới/i.test(status) ? 'is-waiting' : 'is-success';
}
function statusSelect(item, field, next) {
  const current = item[field] || '';
  const values = [current, ...next];
  return `<select class="order-status-select ${statusTone(current)}" data-order="${esc(item.MaDH)}" data-field="${field}" aria-label="${field === 'TrangThaiThanhToan' ? 'Thanh toán' : 'Trạng thái đơn'} ${esc(item.MaDH)}" ${next.length === 0 || updatingOrders.has(item.MaDH) ? 'disabled' : ''}>${values.map(value => `<option value="${esc(value)}" ${value === current ? 'selected' : ''}>${esc(value)}</option>`).join('')}</select>`;
}
function showAction(item, field, target) {
  pendingAction = {item, field, target};
  const cancellation = target === 'Đã hủy';
  const verification = field === 'TrangThaiThanhToan' && target === 'Đã thanh toán';
  const refund = cancellation && item.TrangThaiThanhToan === 'Đã thanh toán';
  document.getElementById('orderActionForm').reset();
  document.getElementById('orderDialogError').textContent = '';
  document.getElementById('orderActionTitle').textContent = `${cancellation ? 'Hủy đơn' : 'Xác minh thanh toán'} ${item.MaDH}`;
  document.getElementById('orderActionWarning').textContent = cancellation
    ? 'Đơn sẽ được chuyển thành Đã hủy và không thể tiếp tục xử lý. Bản ghi đơn được giữ lại.' + (refund ? ' Đơn đã thanh toán: cần ghi nhận phương án hoàn tiền; thao tác này không hoàn tiền hoặc thay đổi trạng thái thanh toán.' : '')
    : 'Chỉ xác nhận sau khi đã kiểm tra giao dịch hoặc biên nhận thu tiền thực tế. Thao tác này được ghi lại trong ghi chú đơn.';
  document.getElementById('paymentVerification').hidden = !verification;
  document.getElementById('refundRecording').hidden = !refund;
  document.getElementById('paymentReference').required = verification;
  document.getElementById('paymentVerified').required = verification;
  document.getElementById('refundNote').required = refund;
  const confirm = document.getElementById('confirmOrderAction');
  confirm.className = 'btn ' + (cancellation ? 'btn-danger' : 'btn-primary');
  confirm.textContent = cancellation ? 'Xác nhận hủy đơn' : 'Xác nhận đã nhận tiền';
  actionDialog.showModal();
}
async function updateOrder(item, field, target, extra = {}) {
  if (updatingOrders.has(item.MaDH)) return false;
  updatingOrders.add(item.MaDH);
  document.querySelectorAll('[data-order]').forEach(control => { if (control.dataset.order === item.MaDH) control.disabled = true; });
  try {
    await request('/admin/orders/' + encodeURIComponent(item.MaDH), {method: 'PUT', body: JSON.stringify({[field]: target, expected_order: item.TrangThaiDonHang, expected_payment: item.TrangThaiThanhToan, ...extra})});
    notice(`Đã cập nhật đơn ${item.MaDH}.`);
    return true;
  } catch (error) {
    notice(error.message, true);
    if (actionDialog.open) document.getElementById('orderDialogError').textContent = error.message;
    return false;
  } finally {
    updatingOrders.delete(item.MaDH);
    await load();
  }
}
document.getElementById('tbody').addEventListener('change', event => {
  const select = event.target.closest('[data-field]');
  if (!select) return;
  const item = displayedOrders.get(select.dataset.order);
  if (!item) return;
  const field = select.dataset.field, target = select.value;
  select.value = item[field];
  if (target === item[field] || updatingOrders.has(item.MaDH)) return;
  if (target === 'Đã hủy' || (field === 'TrangThaiThanhToan' && target === 'Đã thanh toán')) showAction(item, field, target);
  else updateOrder(item, field, target);
});
document.getElementById('tbody').addEventListener('click', event => {
  const button = event.target.closest('[data-cancel-order]');
  if (!button || button.disabled) return;
  const item = displayedOrders.get(button.dataset.order);
  if (item?.statusActions?.canCancel) showAction(item, 'TrangThaiDonHang', 'Đã hủy');
});
document.getElementById('closeOrderAction').addEventListener('click', () => actionDialog.close());
actionDialog.addEventListener('close', () => { pendingAction = null; });
actionDialog.addEventListener('cancel', event => { if (pendingAction && updatingOrders.has(pendingAction.item.MaDH)) event.preventDefault(); });
document.getElementById('orderActionForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (!pendingAction) return;
  const {item, field, target} = pendingAction;
  const controls = [...actionDialog.querySelectorAll('input, textarea, button')];
  controls.forEach(control => { control.disabled = true; });
  const succeeded = await updateOrder(item, field, target, {
    payment_verified: document.getElementById('paymentVerified').checked,
    payment_reference: document.getElementById('paymentReference').value.trim(),
    refund_note: document.getElementById('refundNote').value.trim(),
  });
  controls.forEach(control => { control.disabled = false; });
  if (succeeded) actionDialog.close();
});

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
  tbody.innerHTML = '<tr><td colspan="8" class="empty">Đang tải dữ liệu...</td></tr>';
  try {
    const result = await request('/admin/orders?' + params, {method: 'GET'});
    if (currentSequence !== sequence) return;
    const items = result.data.items;
    displayedOrders = new Map(items.map(item => [item.MaDH, item]));
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
      <td>${shortDate(item.NgayDat)}</td>
      <td>${statusSelect(item, 'TrangThaiThanhToan', item.statusActions?.payment || [])}</td>
      <td>${statusSelect(item, 'TrangThaiDonHang', [...(item.statusActions?.order || []), ...(item.statusActions?.canCancel ? ['Đã hủy'] : [])])}</td>
      <td><button type="button" class="btn btn-small btn-danger order-cancel-icon" title="Hủy đơn hàng" aria-label="Hủy đơn hàng ${esc(item.MaDH)}" data-cancel-order data-order="${esc(item.MaDH)}" ${!item.statusActions?.canCancel || updatingOrders.has(item.MaDH) ? 'disabled' : ''}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/></svg></button></td>
    </tr>`).join('') :
      `<tr><td colspan="8" class="empty">Không có dữ liệu</td></tr>`;
  } catch (e) {
    if (currentSequence !== sequence) return;
    tbody.innerHTML = `<tr><td colspan="8" class="empty">Không tải được dữ liệu: ${esc(e.message)}</td></tr>`;
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
