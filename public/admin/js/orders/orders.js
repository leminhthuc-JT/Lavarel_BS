import { mountShell } from '../core/shell.js';
import { request } from '../core/api.js';
import { esc, money, shortDate, statusBadge } from '../core/ui.js';

mountShell({active:'orders', title:'Quản lý đơn hàng', subtitle:'Theo dõi thanh toán và trạng thái xử lý đơn trong DonHangs.'});

const page = document.getElementById('pageContent');
page.innerHTML = `
  <section class="card panel">
    <div class="panel-head">
      <div class="panel-title">Quản lý đơn hàng</div>
      
    </div>
    <div class="toolbar">
      <input id="searchInput" placeholder="Tìm kiếm...">
      
      <button class="btn" id="searchBtn">Tìm</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th>Tổng thanh toán</th><th>Thanh toán</th><th>Trạng thái đơn</th><th>Ngày đặt</th></tr></thead>
        <tbody id="tbody"><tr><td colspan="7" class="empty">Đang tải dữ liệu...</td></tr></tbody>
      </table>
    </div>
  </section>`;

const mock = {success:true,data:{items:[{"MaDH": "DH001", "MaKH": "KH001", "SanPhams": [{"TenSP": "Bánh kem dâu", "SoLuong": 2}, {"TenSP": "Bánh kem chocolate", "SoLuong": 1}], "TongThanhToan": 580000, "TrangThaiThanhToan": "Chưa thanh toán", "TrangThaiDonHang": "Chờ xác nhận", "NgayDat": "2026-08-31T10:24:59.596Z"}, {"MaDH": "DH002", "MaKH": "KH002", "SanPhams": [{"TenSP": "Bánh mousse dâu", "SoLuong": 1}, {"TenSP": "Bánh mousse chocolate", "SoLuong": 2}], "TongThanhToan": 540000, "TrangThaiThanhToan": "Đã thanh toán", "TrangThaiDonHang": "Đã xác nhận", "NgayDat": "2026-08-31T03:00:00Z"}]}};

async function load() {
  const tbody = document.getElementById('tbody');
  try {
    const result = await request('/admin/orders', {}, mock);
    const items = result?.data?.items ?? result?.data ?? [];
    const q = document.getElementById('searchInput').value.trim().toLowerCase();
    const filtered = q ? items.filter(x => JSON.stringify(x).toLowerCase().includes(q)) : items;
    tbody.innerHTML = filtered.length ? filtered.map(item => `<tr>
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
    tbody.innerHTML = `<tr><td colspan="7" class="empty">Không tải được dữ liệu: ${esc(e.message)}</td></tr>`;
  }
}
document.getElementById('searchBtn').addEventListener('click', load);
document.getElementById('searchInput').addEventListener('keydown', e => { if(e.key==='Enter') load(); });
load();
