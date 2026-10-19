import { createListPage } from '../core/list-page.js';
import { mountShell } from '../core/shell.js';
import { request as baseRequest } from '../core/api.js';
import { esc, money, shortDate, statusBadge } from '../core/ui.js';

mountShell({active:'favorites', title:'Danh sách yêu thích', subtitle: ''});

const page = document.getElementById('pageContent');
page.innerHTML = `
  <section class="card panel">
    <div class="panel-head">
      <div class="panel-title">Danh sách yêu thích</div>
      
    </div>
    <div class="toolbar">
      <input id="searchInput" placeholder="Tìm kiếm...">
      
      <button class="btn" id="searchBtn">Tìm</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Mã KH</th><th>Sản phẩm yêu thích</th><th>Cập nhật</th></tr></thead>
        <tbody id="tbody"><tr><td colspan="3" class="empty">Đang tải dữ liệu...</td></tr></tbody>
      </table>
    </div>
  </section>`;

const listPage = createListPage({label: 'YÊU THÍCH', reload: load, endpoint: '/admin/favorites', filters: []});

function request(path, options = {}, mock = null) {
  if (!options.method && new URL(path, location.origin).pathname === '/admin/favorites') return listPage.request();
  return baseRequest(path, options, mock);
}
const mock = {success:true,data:{items:[{"MaKH": "KH001", "SanPhams": [{"MaSP": "BK01"}, {"MaSP": "BK04"}, {"MaSP": "BK07"}], "NgayCapNhat": "2026-08-31T10:32:55.750Z"}, {"MaKH": "KH002", "SanPhams": [{"MaSP": "BK02"}, {"MaSP": "BK05"}], "NgayCapNhat": "2026-08-31T10:32:55.750Z"}]}};

async function load() {
  const tbody = document.getElementById('tbody');
  try {
    const result = await request('/admin/favorites?search=' + encodeURIComponent(document.getElementById('searchInput').value.trim()) + '&status=' + encodeURIComponent(document.getElementById('statusFilter')?.value || ''));
    if (!result) return;
    const items = result?.data?.items ?? result?.data ?? [];
    tbody.innerHTML = items.length ? items.map(item => `<tr><td><strong>${esc(item.MaKH)}</strong></td><td>${(item.SanPhams||[]).map(x=>`<span class="badge">${esc(x.MaSP)}</span>`).join(' ')}</td><td>${shortDate(item.NgayCapNhat)}</td></tr>`).join('') :
      `<tr><td colspan="3" class="empty">Không có dữ liệu</td></tr>`;
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="3" class="empty">Không tải được dữ liệu: ${esc(e.message)}</td></tr>`;
  }
}


load();

document.addEventListener('admin:reload', load);
