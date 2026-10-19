import { API_BASE_URL, USE_MOCK_WHEN_API_FAILS } from './config.js';

let listPage = Number(new URLSearchParams(location.search).get('page')) || 1;
let listLimit = new URLSearchParams(location.search).get('limit') === '15' ? 15 : 10;
let lastFilters = null;

function listControls(pagination) {
  listPage = pagination.page;
  let controls = document.getElementById('adminPagination');
  if (!controls) {
    controls = document.createElement('div');
    controls.id = 'adminPagination'; controls.className = 'toolbar';
    document.querySelector('.table-wrap')?.after(controls);
  }
  controls.innerHTML = `<button class="btn" data-page="${listPage - 1}" ${listPage <= 1 ? 'disabled' : ''}>← Trước</button><span>Trang ${listPage}/${pagination.totalPages} · ${pagination.total} mục</span><button class="btn" data-page="${listPage + 1}" ${listPage >= pagination.totalPages ? 'disabled' : ''}>Sau →</button><select aria-label="Số mục mỗi trang"><option value="10">10 mục/trang</option><option value="15">15 mục/trang</option></select>`;
  controls.querySelector('select').value = String(listLimit);
  controls.onclick = event => { const button = event.target.closest('[data-page]'); if (button && !button.disabled) { listPage = Number(button.dataset.page); document.dispatchEvent(new Event('admin:reload')); } };
  controls.querySelector('select').onchange = event => { listLimit = Number(event.target.value); listPage = 1; document.dispatchEvent(new Event('admin:reload')); };
}

export async function request(path, options = {}, mockValue = null) {
  try {
    const url = new URL(`${API_BASE_URL}${path}`, location.origin);
    const isList = !options.method && url.pathname === `/api${location.pathname.replace(/\/$/, '')}`;
    if (isList) {
      if (lastFilters === null) {
        const saved = new URLSearchParams(location.search);
        for (const [key, id] of [['search', 'searchInput'], ['status', 'statusFilter'], ['category', 'categoryFilter'], ['type', 'typeFilter']]) {
          if (saved.has(key)) {
            url.searchParams.set(key, saved.get(key));
            const input = document.getElementById(id); if (input) input.value = saved.get(key);
          }
        }
      }
      const filters = new URLSearchParams(url.search);
      filters.delete('page'); filters.delete('limit');
      if (lastFilters !== null && lastFilters !== filters.toString()) listPage = 1;
      lastFilters = filters.toString();
      url.searchParams.set('page', listPage); url.searchParams.set('limit', listLimit);
    }
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...(options.headers || {}) },
    });

    const text = await response.text();
    let payload = null;
    try { payload = text ? JSON.parse(text) : null; }
    catch { throw new Error(text || `HTTP ${response.status}`); }

    if (!response.ok) throw new Error(payload?.message || `HTTP ${response.status}`);
    if (isList && payload?.data?.pagination) {
      listControls(payload.data.pagination);
      url.searchParams.set('page', listPage);
      history.replaceState(null, '', `${location.pathname}?${url.searchParams}`);
    }
    return payload;
  } catch (error) {
    console.error('API error:', error);
    if (USE_MOCK_WHEN_API_FAILS && mockValue !== null) return mockValue;
    throw error;
  }
}
