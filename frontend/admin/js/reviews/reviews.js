import { createListPage } from '../core/list-page.js';
import { mountShell } from '../core/shell.js';
import { esc } from '../core/ui.js';

mountShell({ active: 'reviews', title: 'Bình luận khách hàng', subtitle: '' });
const page = document.getElementById('pageContent');
page.innerHTML = `
<section class="card panel">
  <div class="panel-head"><div><div class="panel-eyebrow">CHĂM SÓC KHÁCH HÀNG</div><div class="panel-title">Đánh giá & phản hồi</div></div></div>
  <form id="reviewFilters" class="toolbar">
    <input id="reviewSearch" type="search" maxlength="200" placeholder="Tìm theo sản phẩm, mã khách hàng hoặc bình luận..." aria-label="Tìm bình luận">
    <select id="reviewStatus" aria-label="Trạng thái phản hồi"><option value="">Tất cả bình luận</option><option value="pending">Chưa phản hồi</option><option value="replied">Đã phản hồi</option></select>
    <button class="btn btn-primary" type="submit">Tìm</button>
  </form>
  <div id="reviewList" class="admin-review-list" aria-live="polite"></div>
  <div id="reviewPagination" class="review-pagination"></div>
</section>
<div class="modal hidden" id="replyModal" role="dialog" aria-modal="true" aria-labelledby="replyTitle">
  <div class="modal-card review-modal-card">
    <div class="modal-head"><div><div class="panel-eyebrow">THE LITTLE PRINCE</div><h2 id="replyTitle">Phản hồi khách hàng</h2></div><button type="button" class="modal-close" id="closeReply" aria-label="Đóng">×</button></div>
    <div id="originalReview" class="original-review"></div>
    <form id="replyForm">
      <div class="form-group"><label for="replyText">Nội dung phản hồi *</label><textarea id="replyText" rows="5" maxlength="2000" required placeholder="Cảm ơn bạn đã chia sẻ trải nghiệm với cửa hàng..."></textarea><small id="replyCount" class="field-hint">0/2000 ký tự</small></div>
      <p id="replyError" class="form-error hidden" role="alert"></p>
      <div class="form-actions"><button class="btn" id="cancelReply" type="button">Hủy</button><button class="btn btn-primary" id="saveReply" type="submit">Lưu phản hồi</button></div>
    </form>
  </div>
</div>
<div id="reviewToast" class="admin-toast hidden" role="status"></div>`;
const $ = id => document.getElementById(id);
const listPage = createListPage({label: 'CHĂM SÓC KHÁCH HÀNG', reload: load, endpoint: '/admin/reviews/data', searchId: 'reviewSearch', paginationId: 'reviewPagination', filters: [{id: 'reviewStatus', param: 'status', label: 'Trạng thái phản hồi'}]});
let items = [], selected = null, returnFocus = null, saving = false, sequence = 0, toastTimer;
const csrf = document.querySelector('meta[name="csrf-token"]')?.content || '';

async function call(url, options = {}) {
  const response = await fetch(url, {
    ...options, credentials: 'same-origin',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf, ...(options.headers || {}) }
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.success !== true) {
    const errors = result?.errors ? Object.values(result.errors).flat().join(' ') : '';
    throw new Error(errors || result?.message || (response.status === 419 ? 'Phiên đã hết hạn. Hãy tải lại trang rồi thử lại.' : 'Không thể thực hiện yêu cầu.'));
  }
  return result.data;
}
function date(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('vi-VN');
}
function id(review) { return typeof review._id === 'object' ? review._id?.$oid || '' : String(review._id || ''); }
function stars(value) { const n = Math.max(0, Math.min(5, Math.round(Number(value) || 0))); return '★'.repeat(n) + '☆'.repeat(5 - n); }
function toast(message) {
  clearTimeout(toastTimer); $('reviewToast').textContent = message; $('reviewToast').classList.remove('hidden');
  toastTimer = setTimeout(() => $('reviewToast').classList.add('hidden'), 4000);
}
function render() {
  $('reviewList').innerHTML = items.length ? items.map(item => {
    const review = item.DanhGia || {}, reply = review.TraLoi, replied = Boolean(reply?.BinhLuan);
    return `<article class="admin-review-card">
      <div class="admin-review-head"><div><strong>${esc(item.TenKH || review.HoTen || review.MaKH || 'Khách hàng')}</strong><span class="review-customer-code">${esc(review.MaKH || '')}</span><div class="admin-review-product">${esc(item.TenSP || item.MaSP)} · ${esc(item.MaSP)}</div></div><span class="badge ${replied ? '' : 'warn'}">${replied ? 'Đã phản hồi' : 'Chưa phản hồi'}</span></div>
      <div class="admin-review-meta"><span class="admin-review-stars" aria-label="${esc(review.SoSao || 0)} trên 5 sao">${stars(review.SoSao)}</span><time>${esc(date(review.NgayDang))}</time></div>
      <p class="admin-review-text">${esc(review.BinhLuan || 'Khách hàng chỉ đánh giá sao, không để lại nội dung.')}</p>
      ${replied ? `<div class="admin-review-reply"><strong>Phản hồi từ cửa hàng</strong><time>${esc(date(reply.NgayDang))}</time><p>${esc(reply.BinhLuan)}</p></div>` : ''}
      <div class="admin-review-actions"><a href="/details/${encodeURIComponent(item.MaSP)}" target="_blank" rel="noopener">Xem sản phẩm ↗</a><button class="btn btn-primary" type="button" data-reply="${esc(id(review))}" data-product="${esc(item.MaSP)}" data-customer="${esc(review.MaKH || '')}" ${id(review) ? '' : 'disabled title="Bình luận thiếu mã định danh"'}>${replied ? 'Sửa phản hồi' : 'Phản hồi'}</button></div>
    </article>`;
  }).join('') : '<div class="empty">Không có bình luận phù hợp.</div>';
}
async function load() {
  const seq = ++sequence;
  $('reviewList').innerHTML = '<div class="empty">Đang tải bình luận...</div>'; $('reviewPagination').innerHTML = '';
  try {
    const data = await listPage.read(params => call(`/admin/reviews/data?${params}`));
    if (seq !== sequence || !data) return;
    items = data.items; render();
  } catch (error) {
    if (seq !== sequence) return;
    $('reviewList').innerHTML = `<div class="empty error-text">${esc(error.message)}<br><button type="button" class="btn" id="retryReviews">Thử lại</button> <a href="/login">Đăng nhập</a></div>`;
    $('retryReviews').addEventListener('click', load);
  }
}
function count() { $('replyCount').textContent = `${$('replyText').value.length}/2000 ký tự`; }
function openReply(productCode, reviewId, customerCode, button) {
  const matches = items.filter(item => item.MaSP === productCode && id(item.DanhGia || {}) === reviewId && (item.DanhGia?.MaKH || '') === customerCode);
  if (matches.length !== 1) { toast('Không xác định duy nhất đánh giá. Vui lòng tải lại.'); return; }
  selected = matches[0];
  returnFocus = button;
  const review = selected.DanhGia;
  $('replyTitle').textContent = review.TraLoi?.BinhLuan ? 'Sửa phản hồi' : 'Phản hồi khách hàng';
  $('originalReview').innerHTML = `<strong>${esc(selected.TenKH || review.MaKH || 'Khách hàng')} · ${esc(selected.TenSP || selected.MaSP)}</strong><p>${esc(review.BinhLuan || 'Đánh giá sao, không có bình luận.')}</p>`;
  $('replyText').value = review.TraLoi?.BinhLuan || ''; count();
  $('replyError').classList.add('hidden'); $('replyModal').classList.remove('hidden'); $('replyText').focus();
}
function closeReply() {
  if (saving) return;
  $('replyModal').classList.add('hidden'); selected = null; returnFocus?.focus();
}
$('reviewList').addEventListener('click', event => { const btn = event.target.closest('[data-reply]'); if (btn && !btn.disabled) openReply(btn.dataset.product, btn.dataset.reply, btn.dataset.customer, btn); });
$('replyText').addEventListener('input', count);
$('closeReply').addEventListener('click', closeReply); $('cancelReply').addEventListener('click', closeReply);
$('replyModal').addEventListener('click', event => { if (event.target === $('replyModal')) closeReply(); });
document.addEventListener('keydown', event => {
  if ($('replyModal').classList.contains('hidden')) return;
  if (event.key === 'Escape') closeReply();
  if (event.key === 'Tab') {
    const focusable = [...$('replyModal').querySelectorAll('button:not(:disabled),textarea')];
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
$('replyForm').addEventListener('submit', async event => {
  event.preventDefault(); if (!selected || saving) return;
  const text = $('replyText').value.trim();
  if (!text) { $('replyError').textContent = 'Vui lòng nhập nội dung phản hồi.'; $('replyError').classList.remove('hidden'); return; }
  saving = true; $('saveReply').disabled = true; $('closeReply').disabled = true; $('cancelReply').disabled = true;
  $('replyText').disabled = true; $('saveReply').textContent = 'Đang lưu...'; $('replyError').classList.add('hidden');
  try {
    const reply = await call(`/admin/reviews/${encodeURIComponent(selected.MaSP)}/${encodeURIComponent(id(selected.DanhGia))}/reply`, { method: 'PUT', body: JSON.stringify({ BinhLuan: text, MaKH: selected.DanhGia.MaKH }) });
    selected.DanhGia.TraLoi = reply;
    saving = false; closeReply(); toast('Đã lưu phản hồi. Khách hàng có thể xem tại trang sản phẩm.'); await load();
  } catch (error) { $('replyError').textContent = error.message; $('replyError').classList.remove('hidden'); }
  finally { saving = false; $('saveReply').disabled = false; $('closeReply').disabled = false; $('cancelReply').disabled = false; $('replyText').disabled = false; $('saveReply').textContent = 'Lưu phản hồi'; }
});
load();

