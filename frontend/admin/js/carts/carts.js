import { mountShell } from '../core/shell.js';
import { request } from '../core/api.js';
import { esc, money, shortDate, statusBadge } from '../core/ui.js';

mountShell({active:'carts', title:'Giỏ hàng khách', subtitle:'Theo dõi giỏ hàng đang lưu trong collection Gios.'});

const page = document.getElementById('pageContent');
page.innerHTML = `
  <section class="card panel">
    <div class="panel-head">
      <div class="panel-title">Giỏ hàng khách</div>
      
    </div>
    <div class="toolbar">
      <input id="searchInput" placeholder="Tìm kiếm...">
      
      <button class="btn" id="searchBtn">Tìm</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Mã KH</th><th>Sản phẩm</th><th>Tổng tiền</th><th>Cập nhật</th></tr></thead>
        <tbody id="tbody"><tr><td colspan="4" class="empty">Đang tải dữ liệu...</td></tr></tbody>
      </table>
    </div>
  </section>`;

const mock = {success:true,data:{items:[{"MaKH": "KH001", "SanPhams": [{"MaSP": "BK01", "SoLuong": 2, "DonGia": 150000, "Chon": true}, {"MaSP": "BK02", "SoLuong": 1, "DonGia": 250000, "Chon": false}], "TongTien": 300000, "NgayCapNhat": "2026-08-31T10:19:53.483Z"}, {"MaKH": "KH002", "SanPhams": [{"MaSP": "BK01", "SoLuong": 2, "DonGia": 150000, "Chon": true}], "TongTien": 300000, "NgayCapNhat": "2026-08-31T09:00:00Z"}]}};

async function load() {
  const tbody = document.getElementById('tbody');
  try {
    const result = await request('/admin/carts', {}, mock);
    const items = result?.data?.items ?? result?.data ?? [];
    const q = document.getElementById('searchInput').value.trim().toLowerCase();
    const filtered = q ? items.filter(x => JSON.stringify(x).toLowerCase().includes(q)) : items;
    tbody.innerHTML = filtered.length ? filtered.map(item => `<tr><td><strong>${esc(item.MaKH)}</strong></td><td>${(item.SanPhams||[]).map(x=>`${esc(x.MaSP)} × ${esc(x.SoLuong)}`).join('<br>')}</td><td>${money(item.TongTien)}</td><td>${shortDate(item.NgayCapNhat)}</td></tr>`).join('') :
      `<tr><td colspan="4" class="empty">Không có dữ liệu</td></tr>`;
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty">Không tải được dữ liệu: ${esc(e.message)}</td></tr>`;
  }
}
document.getElementById('searchBtn').addEventListener('click', load);
document.getElementById('searchInput').addEventListener('keydown', e => { if(e.key==='Enter') load(); });
load();
