import { request } from './api.js';
import { esc } from './ui.js';

export function createListPage({label, reload, endpoint, addId, filters = [], searchId = 'searchInput', paginationId = 'adminPagination'}) {
  document.querySelector('.hero p')?.remove();
  for (const filename of ['products.css', 'categories.css', 'list-page.css']) {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = new URL('../../css/' + filename, import.meta.url).href;
    document.head.append(link);
  }
  const panel = document.querySelector('#pageContent > .panel');
  const head = panel.querySelector('.panel-head');
  const add = addId ? document.getElementById(addId) : null;
  const toolbar = panel.querySelector('.toolbar');
  const search = document.getElementById(searchId);
  const saved = new URLSearchParams(location.search);
  let page = Math.max(1, Number(saved.get('page')) || 1), lastKey = null, sequence = 0;
  const applied = {};
  head.innerHTML = `<div class="panel-eyebrow">${esc(label)}</div>`;
  search.type = 'search'; search.value = saved.get('search') || '';
  search.setAttribute('aria-label', 'Tìm kiếm'); search.title = 'Nhấn Enter để tìm kiếm';
  const replacement = document.createElement('div');
  replacement.className = 'toolbar admin-list-toolbar'; replacement.append(search);
  const filterForm = document.createElement('form');
  filterForm.className = 'toolbar category-filters admin-list-filters'; filterForm.hidden = true;
  filterForm.id = searchId + 'FiltersPanel';
  if (filters.length) {
    const toggle = document.createElement('button'); toggle.type = 'button';
    toggle.className = 'btn product-icon-button'; toggle.title = 'Bộ lọc';
    toggle.setAttribute('aria-label', 'Bộ lọc'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-controls', filterForm.id);
    toggle.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h18l-7 8v6l-4 2v-8L3 4Z"/></svg>';
    toggle.onclick = () => { filterForm.hidden = !filterForm.hidden; toggle.setAttribute('aria-expanded', String(!filterForm.hidden)); };
    replacement.append(toggle);
    for (const filter of filters) {
      const select = document.getElementById(filter.id);
      select.setAttribute('aria-label', filter.label);
      select.value = saved.get(filter.param) || '';
      applied[filter.param] = select.value;
      const labelElement = document.createElement('label');
      labelElement.htmlFor = select.id; labelElement.textContent = filter.label; labelElement.append(select); filterForm.append(labelElement);
    }
    const actions = document.createElement('div'); actions.className = 'category-filter-actions';
    actions.innerHTML = '<button class="btn btn-primary" type="submit">Áp dụng</button><button class="btn" type="button">Đặt lại</button>';
    actions.querySelector('[type="button"]').onclick = () => {
      for (const filter of filters) { document.getElementById(filter.id).value = ''; applied[filter.param] = ''; }
      page = 1; reload();
    };
    filterForm.append(actions);
    filterForm.onsubmit = event => {
      event.preventDefault();
      for (const filter of filters) applied[filter.param] = document.getElementById(filter.id).value;
      reload();
    };
  }
  if (add) {
    add.classList.add('product-icon-button'); add.type = 'button'; add.title = 'Thêm mới'; add.setAttribute('aria-label', 'Thêm mới');
    add.innerHTML = '<span aria-hidden="true">+</span>'; replacement.append(add);
  }
  toolbar.replaceWith(replacement); replacement.after(filterForm);
  let pagination = document.getElementById(paginationId);
  if (!pagination) {
    pagination = document.createElement('nav'); pagination.id = paginationId;
    panel.querySelector('.table-wrap').after(pagination);
  }
  pagination.className = 'product-pagination'; pagination.setAttribute('aria-label', 'Phân trang');
  pagination.onclick = event => {
    const button = event.target.closest('[data-list-page]');
    if (!button || button.disabled || button.hasAttribute('aria-current')) return;
    page = Number(button.dataset.listPage); reload();
  };
  let searchTimer;
  search.oninput = () => { clearTimeout(searchTimer); searchTimer = setTimeout(reload, 300); };
  search.onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); clearTimeout(searchTimer); reload(); } };

  async function read(fetchData) {
    const params = new URLSearchParams();
    if (search.value.trim()) params.set('search', search.value.trim());
    for (const [key, value] of Object.entries(applied)) if (value) params.set(key, value);
    const key = params.toString();
    if (lastKey !== null && lastKey !== key) page = 1;
    lastKey = key; params.set('page', String(page)); params.set('limit', '10');
    const currentSequence = ++sequence;
    let data = await fetchData(params);
    if (currentSequence !== sequence) return null;
    const pages = Math.max(1, data.pagination.totalPages);
    if (data.pagination.page > pages) {
      params.set('page', String(pages)); data = await fetchData(params);
      if (currentSequence !== sequence) return null;
    }
    page = data.pagination.page; params.set('page', String(page));
    history.replaceState(null, '', `${location.pathname}?${params}`);
    const button = (number, text, title, disabled = false, current = false) => `<button type="button" class="btn${current ? ' is-current' : ''}" data-list-page="${number}" title="${title}" aria-label="${title}" ${disabled ? 'disabled' : ''} ${current ? 'aria-current="page"' : ''}>${text}</button>`;
    pagination.innerHTML = button(page - 1, '‹', 'Trang trước', page <= 1)
      + Array.from({length: Math.max(1, data.pagination.totalPages)}, (_, i) => button(i + 1, i + 1, `Trang ${i + 1}`, false, i + 1 === page)).join('')
      + button(page + 1, '›', 'Trang sau', page >= Math.max(1, data.pagination.totalPages));
    return data;
  }
  return {
    read,
    getFilter(name) { return applied[name] || ''; },
    async request() {
      const data = await read(async params => (await request(endpoint + '?' + params, {method: 'GET'})).data);
      return data ? {success: true, data} : null;
    },
  };
}
