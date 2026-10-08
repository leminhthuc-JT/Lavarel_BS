export const money = n => Number(n || 0).toLocaleString('vi-VN') + 'đ';
export const shortDate = value => value ? new Date(value).toLocaleDateString('vi-VN') : '';
export const statusBadge = text => {
  const t = String(text || '');
  const cls = /hủy|ngừng|chưa thanh toán/i.test(t) ? 'danger' : /chờ|xác nhận/i.test(t) ? 'warn' : '';
  return `<span class="badge ${cls}">${t || '—'}</span>`;
};
export const esc = value => String(value ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
