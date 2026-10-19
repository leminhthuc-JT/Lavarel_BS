import { createListPage } from '../core/list-page.js';
import { mountShell } from '../core/shell.js';
import { request as baseRequest } from '../core/api.js';
import { esc, money, shortDate, statusBadge } from '../core/ui.js';

mountShell({active:'customers', title:'Quản lý khách hàng', subtitle: ''});

const page = document.getElementById('pageContent');
page.innerHTML = `
  <section class="card panel">
    <div class="panel-head">
      <div class="panel-title">Quản lý khách hàng</div><button class="btn btn-primary" id="addCustomer">+ Thêm mới</button>
      
    </div>
    <div class="toolbar">
      <input id="searchInput" placeholder="Tìm kiếm...">
      
      <select id="statusFilter"><option value="">Tất cả trạng thái</option><option>Hoạt động</option><option>Bị khóa</option></select><button class="btn" id="searchBtn">Tìm</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Mã KH</th><th>Họ tên</th><th>Email</th><th>SĐT</th><th>Địa chỉ</th><th>Ngày đăng ký</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
        <tbody id="tbody"><tr><td colspan="8" class="empty">Đang tải dữ liệu...</td></tr></tbody>
      </table>
    </div>
  </section>`;

const listPage = createListPage({label: 'KHÁCH HÀNG', reload: load, endpoint: '/admin/customers', filters: [{id: 'statusFilter', param: 'status', label: 'Trạng thái tài khoản'}], addId: 'addCustomer'});

function request(path, options = {}, mock = null) {
  if (!options.method && new URL(path, location.origin).pathname === '/admin/customers') return listPage.request();
  return baseRequest(path, options, mock);
}
const mock = {success:true,data:{items:[{"MaKH": "KH001", "HoTen": "Khách hàng mẫu 01", "Email": "customer01@example.com", "SDT": "090xxxx001", "DiaChi": "TP.HCM", "NgayDangKy": "2026-08-31T09:26:43.853Z", "TrangThai": "Hoạt động"}, {"MaKH": "KH002", "HoTen": "Khách hàng mẫu 02", "Email": "customer02@example.com", "SDT": "090xxxx002", "DiaChi": "TP.HCM", "NgayDangKy": "2026-08-31T09:26:43.853Z", "TrangThai": "Hoạt động"}]}};

async function load() {
  const tbody = document.getElementById('tbody');
  try {
    const result = await request('/admin/customers?search=' + encodeURIComponent(document.getElementById('searchInput').value.trim()) + '&status=' + encodeURIComponent(document.getElementById('statusFilter').value));
    if (!result) return;
    const items = result?.data?.items ?? result?.data ?? [];
    tbody.innerHTML = items.length ? items.map(item => `<tr><td><strong>${esc(item.MaKH)}</strong></td><td>${esc(item.HoTen)}</td><td>${esc(item.Email)}</td><td>${esc(item.SDT)}</td><td>${esc(item.DiaChi)}</td><td>${shortDate(item.NgayDangKy)}</td><td>${statusBadge(item.TrangThai)}</td><td><div class="table-actions"><button class="btn btn-small" data-edit="${esc(item.MaKH)}">Sửa</button><button class="btn btn-small" data-lock="${esc(item.MaKH)}" data-status="${esc(item.TrangThai)}">${item.TrangThai === 'Hoạt động' ? 'Khóa' : 'Mở khóa'}</button><button class="btn btn-small btn-danger" data-delete="${esc(item.MaKH)}">Xóa</button></div></td></tr>`).join('') :
      `<tr><td colspan="8" class="empty">Không có dữ liệu</td></tr>`;
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty">Không tải được dữ liệu: ${esc(e.message)}</td></tr>`;
  }
}


load();

document.addEventListener('admin:reload', load);
page.insertAdjacentHTML('beforeend', `<div class="modal hidden" id="customerModal"><div class="modal-card"><div class="modal-head"><h2 id="customerTitle">Tài khoản khách hàng</h2><button class="modal-close" id="closeCustomer">×</button></div><form id="customerForm"><div class="form-grid">
<div class="form-group"><label>Mã khách hàng *</label><input name="MaKH" required pattern="[A-Za-z0-9_-]+"></div>
<div class="form-group"><label>Họ tên *</label><input name="HoTen" required maxlength="150"></div>
<div class="form-group"><label>Email *</label><input name="Email" type="email" required></div>
<div class="form-group"><label>Mật khẩu</label><input name="MatKhau" type="password" minlength="6" placeholder="Để trống khi sửa để giữ mật khẩu"></div>
<div class="form-group"><label>Số điện thoại</label><input name="SDT"></div>
<div class="form-group"><label>Địa chỉ</label><input name="DiaChi" maxlength="500"></div>
<div class="form-group"><label>Trạng thái</label><select name="TrangThai"><option>Hoạt động</option><option>Bị khóa</option></select></div>
</div><div class="form-error hidden" id="customerError"></div><div class="form-actions"><button class="btn btn-primary" type="submit">Lưu</button></div></form></div></div><div id="customerToast" class="admin-toast hidden"></div>`);
const customerForm = document.getElementById('customerForm');
const customerModal = document.getElementById('customerModal');
let editingCode = null;
function notify(message) { const toast = document.getElementById('customerToast'); toast.textContent = message; toast.classList.remove('hidden'); setTimeout(() => toast.classList.add('hidden'), 3500); }
document.getElementById('closeCustomer').onclick = () => customerModal.classList.add('hidden');
document.getElementById('addCustomer').onclick = () => {
  editingCode = null; customerForm.reset(); customerForm.elements.MaKH.disabled = false;
  customerForm.elements.MatKhau.required = true;
  document.getElementById('customerError').classList.add('hidden'); customerModal.classList.remove('hidden');
};
document.getElementById('tbody').addEventListener('click', async event => {
  const button = event.target.closest('button'); if (!button) return;
  const code = button.dataset.edit || button.dataset.lock || button.dataset.delete;
  button.disabled = true;
  try {
    if (button.dataset.delete) {
      if (!confirm('Xóa tài khoản ' + code + '?')) return;
      await request('/admin/customers/' + encodeURIComponent(code), {method: 'DELETE'});
      notify('Đã xóa tài khoản.'); await load(); return;
    }
    const result = await request('/admin/customers/' + encodeURIComponent(code));
    const item = result.data;
    if (button.dataset.lock) {
      const status = item.TrangThai === 'Hoạt động' ? 'Bị khóa' : 'Hoạt động';
      if (!confirm(status + ' tài khoản ' + code + '?')) return;
      await request('/admin/customers/' + encodeURIComponent(code), {method: 'PUT', body: JSON.stringify({HoTen: item.HoTen, Email: item.Email || item.TaiKhoan?.Email, TrangThai: status})});
      notify('Đã cập nhật trạng thái.'); await load(); return;
    }
    editingCode = code; customerForm.reset();
    for (const field of ['MaKH','HoTen','Email','SDT','DiaChi','TrangThai']) customerForm.elements[field].value = item[field] || '';
    customerForm.elements.MaKH.disabled = true; customerForm.elements.MatKhau.required = false;
    document.getElementById('customerError').classList.add('hidden'); customerModal.classList.remove('hidden');
  } catch (error) { notify(error.message); } finally { button.disabled = false; }
});
customerForm.onsubmit = async event => {
  event.preventDefault(); const save = customerForm.querySelector('[type="submit"]'); save.disabled = true;
  const payload = Object.fromEntries(new FormData(customerForm));
  payload.MaKH = editingCode || payload.MaKH;
  payload.TaiKhoan = {Email: payload.Email, MatKhau: payload.MatKhau}; delete payload.MatKhau;
  try {
    await request('/admin/customers' + (editingCode ? '/' + encodeURIComponent(editingCode) : ''), {method: editingCode ? 'PUT' : 'POST', body: JSON.stringify(payload)});
    customerModal.classList.add('hidden'); notify('Đã lưu tài khoản.'); await load();
  } catch (error) { const box = document.getElementById('customerError'); box.textContent = error.message; box.classList.remove('hidden'); }
  finally { save.disabled = false; }
};
