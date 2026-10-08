import { mountShell } from '../core/shell.js';
import { request } from '../core/api.js';
import { esc, money, shortDate, statusBadge } from '../core/ui.js';

mountShell({active:'customers', title:'Quản lý khách hàng', subtitle:'Quản lý tài khoản và trạng thái khách hàng trong KhachHangs.'});

const page = document.getElementById('pageContent');
page.innerHTML = `
  <section class="card panel">
    <div class="panel-head">
      <div class="panel-title">Quản lý khách hàng</div>
      
    </div>
    <div class="toolbar">
      <input id="searchInput" placeholder="Tìm kiếm...">
      
      <button class="btn" id="searchBtn">Tìm</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Mã KH</th><th>Họ tên</th><th>Email</th><th>SĐT</th><th>Địa chỉ</th><th>Ngày đăng ký</th><th>Trạng thái</th></tr></thead>
        <tbody id="tbody"><tr><td colspan="7" class="empty">Đang tải dữ liệu...</td></tr></tbody>
      </table>
    </div>
  </section>`;

const mock = {success:true,data:{items:[{"MaKH": "KH001", "HoTen": "Khách hàng mẫu 01", "Email": "customer01@example.com", "SDT": "090xxxx001", "DiaChi": "TP.HCM", "NgayDangKy": "2026-08-31T09:26:43.853Z", "TrangThai": "Hoạt động"}, {"MaKH": "KH002", "HoTen": "Khách hàng mẫu 02", "Email": "customer02@example.com", "SDT": "090xxxx002", "DiaChi": "TP.HCM", "NgayDangKy": "2026-08-31T09:26:43.853Z", "TrangThai": "Hoạt động"}]}};

async function load() {
  const tbody = document.getElementById('tbody');
  try {
    const result = await request('/admin/customers', {}, mock);
    const items = result?.data?.items ?? result?.data ?? [];
    const q = document.getElementById('searchInput').value.trim().toLowerCase();
    const filtered = q ? items.filter(x => JSON.stringify(x).toLowerCase().includes(q)) : items;
    tbody.innerHTML = filtered.length ? filtered.map(item => `<tr><td><strong>${esc(item.MaKH)}</strong></td><td>${esc(item.HoTen)}</td><td>${esc(item.Email)}</td><td>${esc(item.SDT)}</td><td>${esc(item.DiaChi)}</td><td>${shortDate(item.NgayDangKy)}</td><td>${statusBadge(item.TrangThai)}</td></tr>`).join('') :
      `<tr><td colspan="7" class="empty">Không có dữ liệu</td></tr>`;
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty">Không tải được dữ liệu: ${esc(e.message)}</td></tr>`;
  }
}
document.getElementById('searchBtn').addEventListener('click', load);
document.getElementById('searchInput').addEventListener('keydown', e => { if(e.key==='Enter') load(); });
load();
