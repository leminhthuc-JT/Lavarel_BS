/* =========================================================
   THE LITTLE PRINCE — ORDERS PAGE
   Luồng:
     1. Tải danh sách đơn hàng
     2. Khi mở modal chi tiết (hoặc xem trực tiếp trên card):
        - Nếu trạng thái = "Đã giao"  → hiện nút [Xác nhận đã nhận hàng]
        - Nếu trạng thái = "Đã nhận hàng" && chưa đánh giá → hiện nút [Đánh giá sản phẩm]
        - ĐẶC BIỆT: Nếu bấm Đánh giá trực tiếp khi đang "Đã giao", hệ thống sẽ tự động chuyển sang Đánh giá luôn!
        - Nếu đã có DanhGia            → hiện nút / khối [Xem đánh giá]
     3. Click Đánh giá → mở form đánh giá cho TỪNG sản phẩm trong đơn hàng
        (mỗi sản phẩm có 1 cụm chọn sao + ô nhận xét riêng)
     4. Kiểm duyệt toxic (Flask 5000 /predict) cho từng nhận xét trước khi gửi
     5. Gửi đánh giá → gọi API rating → lưu vào từng SanPhams tương ứng trong CSDL
        (theo cấu trúc MongoDB: _id, MaKH, SoSao, BinhLuan, LuotThich, NgayDang, LoaiBL, MaDH)
        và lưu vào DanhGia của DonHangs
     6. Cập nhật UI modal thành [Xem đánh giá] hiển thị trực quan các đánh giá đã gửi
========================================================= */

const TOXIC_THRESHOLD = 0.5;
const TOXIC_API       = 'http://127.0.0.1:5000/predict';

let customerOrders  = [];
let currentOrderIdx = null;   // index đơn đang mở trong modal

// ─── HÀM BẢO VỆ KÝ TỰ HTML ────────────────────────────────
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ─── CACHE SẢN PHẨM & ẢNH SẢN PHẨM ────────────────────────
let _productCatalogMap = {};

async function loadProductsCatalog() {
    try {
        const res = await fetchApi('/products');
        const list = Array.isArray(res) ? res : (res?.data || []);
        if (Array.isArray(list)) {
            list.forEach(p => {
                if (p.MaSP) {
                    _productCatalogMap[p.MaSP] = p;
                    _productCatalogMap[p.MaSP.toLowerCase()] = p;
                    _productCatalogMap[p.MaSP.toUpperCase()] = p;
                }
            });
        }
    } catch (e) {
        console.warn('Không thể tải catalog sản phẩm:', e);
    }
}

/**
 * Lấy ảnh đầu tiên của sản phẩm:
 * Ưu tiên HinhAnh[0] của sản phẩm trong đơn -> catalog -> fallback mã SP -> resolveImageUrl
 */
function getProductFirstImage(item, idx = 0) {
    if (!item) return typeof resolveImageUrl === 'function' ? resolveImageUrl(null, idx) : '../../assets/logo.png';

    const maSP = item.MaSP || '';
    let raw = null;

    // 1. Ưu tiên tìm trong catalog sản phẩm đã tải theo MaSP (ảnh chính xác nhất từ DB SanPhams)
    if (maSP && _productCatalogMap[maSP]) {
        const catalogImages = _productCatalogMap[maSP].HinhAnh;
        if (Array.isArray(catalogImages) && catalogImages.length > 0) {
            raw = catalogImages[0];
        } else if (typeof catalogImages === 'string' && catalogImages) {
            raw = catalogImages;
        }
    }

    // 2. Nếu catalog chưa có, lấy từ item.HinhAnh
    if (!raw && item.HinhAnh) {
        raw = Array.isArray(item.HinhAnh) ? item.HinhAnh[0] : item.HinhAnh;
    }

    // 3. Nếu vẫn chưa có và có MaSP -> dùng quy ước chuẩn: <masp.toLowerCase()>_1.png
    if (!raw && maSP) {
        raw = `${maSP.toLowerCase()}_1.png`;
    }

    // Làm sạch trường hợp bị lặp ../../assets/
    if (typeof raw === 'string') {
        raw = raw.replace(/^(\.\.\/\.\.\/assets\/)+/g, '../../assets/');
    }

    // 4. Nếu có hàm resolveImageUrl từ common.js
    if (typeof resolveImageUrl === 'function') {
        const resolved = resolveImageUrl(raw, idx);
        if (resolved) return resolved;
    }

    // 5. Fallback đường dẫn tĩnh nếu không có resolveImageUrl
    if (typeof raw === 'string' && raw) {
        if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:') || raw.startsWith('../')) {
            return raw;
        }
        return `../../assets/${raw}`;
    }

    return '../../assets/logo.png';
}

// ─── KHỞI TẠO ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    setupHeader('account');
    // Chạy song song tải catalog sản phẩm và danh sách đơn hàng
    await Promise.allSettled([
        loadProductsCatalog(),
        loadCustomerOrders()
    ]);
});

// ─── TẢI ĐƠN HÀNG ────────────────────────────────────────
async function loadCustomerOrders() {
    const container = document.getElementById('ordersContainer');
    const user  = getCurrentUser();
    const maKH  = user ? (user.MaKH || user.id || user._id || user.email) : 'guest';

    try {
        const apiOrders = await fetchApi(`/orders/my-orders?maKH=${encodeURIComponent(maKH)}`);
        customerOrders = Array.isArray(apiOrders) && apiOrders.length > 0
            ? apiOrders
            : getLocalOrders(maKH);
    } catch {
        customerOrders = getLocalOrders(maKH);
    }

    if (!customerOrders || customerOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3>Bạn chưa có đơn hàng nào</h3>
                <p>Hãy đặt mua những món bánh thơm ngon ngọt ngào từ thực đơn của chúng tôi nhé!</p>
                <a href="../menu/menu.html" class="btn btn-primary">Khám phá thực đơn <span>→</span></a>
            </div>`;
        return;
    }

    container.innerHTML = customerOrders.map((order, idx) => renderOrderCard(order, idx)).join('');
}

function getLocalOrders(maKH) {
    try {
        const data = localStorage.getItem(`sweet_bakery_orders_${maKH}`);
        return data ? JSON.parse(data) : [];
    } catch { return []; }
}

function hasOrderBeenRated(order) {
    if (!order || !order.DanhGia) return false;
    if (Array.isArray(order.DanhGia) && order.DanhGia.length > 0) return true;
    if (typeof order.DanhGia === 'object' && (order.DanhGia.SoSao || order.DanhGia.BinhLuan)) return true;
    return false;
}

// ─── CARD ĐƠN HÀNG ───────────────────────────────────────
function renderOrderCard(order, index) {
    const maDH    = order.MaDH || order.code || `DH${1000 + index}`;
    const ngayDat = order.NgayDat ? new Date(order.NgayDat).toLocaleDateString('vi-VN') : 'Mới đây';
    const status  = (order.TrangThaiDonHang || 'Chờ xác nhận').trim();
    const items   = order.SanPhams || [];
    const total   = order.TongThanhToan || order.TongTien || 0;
    const rated   = hasOrderBeenRated(order);

    // Nút tắt ngoài thẻ đơn hàng
    let quickActionBtn = '';
    if (rated) {
        quickActionBtn = `<button class="btn btn-sm btn-outline" onclick="openOrderModal(${index}); setTimeout(() => { const el = document.getElementById('orderActionZone'); if(el) el.scrollIntoView({behavior:'smooth'}); }, 100);" style="color:#2E7D32; border-color:#A5D6A7;"><i class="fa-solid fa-check"></i> Xem đánh giá</button>`;
    } else if (status === 'Đã nhận hàng' || status === 'Đã giao') {
        quickActionBtn = `<button class="btn btn-sm btn-primary" onclick="openRatingDirectly(${index})"><i class="fa-solid fa-star"></i> Đánh giá ngay</button>`;
    }

    return `
        <article class="order-card">
            <div class="order-card-header">
                <div>
                    <span class="order-code">Mã đơn: #${maDH}</span>
                    <span style="font-size:13px; color:var(--text-muted); margin-left:12px;">Ngày đặt: ${ngayDat}</span>
                </div>
                <span class="status-badge ${getStatusClass(status)}">${status}</span>
            </div>
            <div class="order-card-body">
                <div class="order-info">
                    <p><strong>Sản phẩm:</strong> ${items.map(i => `${i.TenSP || 'Bánh'} × ${i.SoLuong || 1}`).join(', ')}</p>
                    <p><strong>Người nhận:</strong> ${order.HoTenNguoiNhan || 'Khách hàng'} - ${order.SDTNguoiNhan || ''}</p>
                </div>
                <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
                    <div class="order-total-price">${formatVND(total)}</div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
                        ${quickActionBtn}
                        <button class="btn btn-outline btn-sm" onclick="openOrderModal(${index})">Xem chi tiết</button>
                    </div>
                </div>
            </div>
        </article>`;
}

function getStatusClass(status) {
    const s = (status || '').trim().toLowerCase();
    if (s.includes('đã nhận')) return 'received';
    if (s.includes('đã giao') || s.includes('delivered')) return 'delivered';
    if (s.includes('đang giao') || s.includes('shipping')) return 'shipping';
    if (s.includes('đã xác nhận')) return 'confirmed';
    if (s.includes('hủy') || s.includes('cancel')) return 'canceled';
    return 'pending';
}

// ─── MỞ THẲNG FORM ĐÁNH GIÁ ──────────────────────────────
function openRatingDirectly(index) {
    openOrderModal(index);
    // Tự động cuộn xuống và mở form đánh giá
    setTimeout(() => {
        openRatingForm();
    }, 120);
}

// ─── MODAL CHI TIẾT ──────────────────────────────────────
function openOrderModal(index) {
    currentOrderIdx = index;
    const order = customerOrders[index];
    if (!order) return;

    document.getElementById('modalTitle').textContent = `Chi Tiết Đơn Hàng #${order.MaDH || ''}`;
    renderModalBody(order);
    document.getElementById('orderModal').style.display = 'flex';
}

function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
    currentOrderIdx = null;
}

function renderModalBody(order) {
    const items  = order.SanPhams || [];
    const status = (order.TrangThaiDonHang || '').trim();
    const rated  = hasOrderBeenRated(order);

    /* Nút hành động theo trạng thái */
    let actionHTML = '';
    if (rated) {
        actionHTML = buildViewRatingHTML(order.DanhGia);
    } else if (status === 'Đã giao') {
        actionHTML = `
            <div class="order-action-zone" id="orderActionZone">
                <button class="btn btn-primary" id="btnConfirm" onclick="confirmReceived()">
                    <i class="fa-solid fa-check-circle"></i> Xác nhận đã nhận hàng
                </button>
                <button class="btn btn-outline" id="btnRate" onclick="openRatingForm()" style="color:#B8860B; border-color:#DAA520;">
                    <i class="fa-solid fa-star"></i> Đánh giá sản phẩm
                </button>
            </div>`;
    } else if (status === 'Đã nhận hàng') {
        actionHTML = `
            <div class="order-action-zone" id="orderActionZone">
                <button class="btn btn-primary" id="btnRate" onclick="openRatingForm()">
                    <i class="fa-solid fa-star"></i> Đánh giá sản phẩm
                </button>
            </div>`;
    }

    document.getElementById('modalBody').innerHTML = `
        <div style="margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--border-color);">
            <p style="margin-bottom:4px;"><strong>Trạng thái:</strong>
                <span class="status-badge ${getStatusClass(status)}">${status || 'Chờ xác nhận'}</span>
            </p>
            <p style="margin-bottom:4px;"><strong>Thanh toán:</strong> ${order.TrangThaiThanhToan || 'Chưa thanh toán'}</p>
            <p style="margin-bottom:4px;"><strong>Phương thức:</strong> ${order.PhuongThucThanhToan || 'COD'}</p>
        </div>

        <div style="margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--border-color);">
            <h4 style="font-family:var(--font-serif);font-size:16px;margin-bottom:8px;">Thông Tin Giao Hàng</h4>
            <p style="margin-bottom:4px;"><strong>Họ tên:</strong> ${escapeHTML(order.HoTenNguoiNhan || '')}</p>
            <p style="margin-bottom:4px;"><strong>Số điện thoại:</strong> ${escapeHTML(order.SDTNguoiNhan || '')}</p>
            <p style="margin-bottom:4px;"><strong>Địa chỉ:</strong> ${escapeHTML(order.DiaChiNhan || '')}</p>
            ${order.GhiChu ? `<p><strong>Ghi chú:</strong> ${escapeHTML(order.GhiChu)}</p>` : ''}
        </div>

        <div style="margin-bottom:16px;">
            <h4 style="font-family:var(--font-serif);font-size:16px;margin-bottom:10px;">Danh Sách Bánh Đã Đặt</h4>
            <div style="display:flex;flex-direction:column;gap:8px;">
                ${items.map((i, idx) => `
                    <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;padding:6px 0;border-bottom:1px dashed var(--border-color, #eee);">
                        <div style="display:flex;align-items:center;gap:12px;">
                            <img src="${getProductFirstImage(i, idx)}" alt="${escapeHTML(i.TenSP || 'Bánh')}"
                                 style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid #e8e8e8;"
                                 onerror="this.src='../../assets/logo.png'">
                            <div>
                                <strong style="display:block;color:var(--text-main);">${escapeHTML(i.TenSP || 'Bánh')}</strong>
                                <span style="font-size:12px;color:var(--text-muted);">${escapeHTML(i.TenKichThuoc || 'Tiêu chuẩn')} × ${i.SoLuong || 1}</span>
                            </div>
                        </div>
                        <strong style="color:var(--text-main);">${formatVND((i.DonGia || 0) * (i.SoLuong || 1))}</strong>
                    </div>`).join('')}
            </div>
            <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border-color);
                        display:flex;justify-content:space-between;font-size:16px;font-weight:700;">
                <span>Tổng cộng:</span>
                <span style="color:var(--sage-dark);">${formatVND(order.TongThanhToan || 0)}</span>
            </div>
        </div>

        ${actionHTML}

        <!-- Khu vực form đánh giá (ẩn mặc định) -->
        <div id="ratingFormZone" style="display:none;"></div>
    `;
}

// ─── XÁC NHẬN NHẬN HÀNG ──────────────────────────────────
async function confirmReceived() {
    const order = customerOrders[currentOrderIdx];
    if (!order) return;

    const btn = document.getElementById('btnConfirm');
    if (btn) { btn.disabled = true; btn.textContent = 'Đang xử lý...'; }

    try {
        await fetchApi(`/orders/${order.MaDH}/confirm`, { method: 'POST' });

        /* Cập nhật local */
        order.TrangThaiDonHang = 'Đã nhận hàng';
        customerOrders[currentOrderIdx] = order;
        refreshOrderCardStatus(currentOrderIdx, order);

        /* Đổi khu vực action → nút Đánh giá sản phẩm */
        const zone = document.getElementById('orderActionZone');
        if (zone) {
            zone.innerHTML = `
                <button class="btn btn-primary" id="btnRate" onclick="openRatingForm()">
                    <i class="fa-solid fa-star"></i> Đánh giá sản phẩm
                </button>`;
        }

        /* Cập nhật badge trạng thái trong modal */
        const badge = document.querySelector('#modalBody .status-badge');
        if (badge) {
            badge.textContent    = 'Đã nhận hàng';
            badge.className      = 'status-badge received';
        }

        showOrderToast('✅ Xác nhận nhận hàng thành công!');
    } catch (err) {
        showOrderToast('❌ Không thể xác nhận: ' + (err.message || 'Lỗi server'), true);
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check-circle"></i> Xác nhận đã nhận hàng'; }
    }
}

function refreshOrderCardStatus(idx, order) {
    const cards = document.querySelectorAll('#ordersContainer .order-card');
    if (cards[idx]) {
        const badge = cards[idx].querySelector('.status-badge');
        if (badge) {
            badge.textContent = order.TrangThaiDonHang;
            badge.className   = `status-badge ${getStatusClass(order.TrangThaiDonHang)}`;
        }
    }
}

// ─── FORM ĐÁNH GIÁ (CHO TỪNG SẢN PHẨM) ──────────────────
let _productStars = {};

function openRatingForm() {
    const order = customerOrders[currentOrderIdx];
    if (!order) {
        console.error('Không tìm thấy đơn hàng để đánh giá!');
        return;
    }

    const zone = document.getElementById('ratingFormZone');
    const actionZone = document.getElementById('orderActionZone');
    if (!zone) {
        console.error('Không tìm thấy #ratingFormZone!');
        return;
    }
    if (actionZone) actionZone.style.display = 'none';

    const items = order.SanPhams || [];
    _productStars = {};

    // Khởi tạo mỗi sản phẩm mặc định 5 sao
    items.forEach((item, idx) => {
        const key = item.MaSP || `item_${idx}`;
        _productStars[key] = 5;
    });

    const productsHTML = items.map((item, idx) => {
        const maSP = item.MaSP || `item_${idx}`;
        const tenSP = item.TenSP || 'Bánh ngọt';
        const img = getProductFirstImage(item, idx);
        const kichThuoc = item.TenKichThuoc ? ` (${item.TenKichThuoc})` : '';

        return `
            <div class="rating-product-item" data-masp="${maSP}" data-tensp="${escapeHTML(tenSP)}" data-hinhanh="${escapeHTML(img)}">
                <div class="rating-product-header">
                    <img src="${img}" alt="${escapeHTML(tenSP)}" class="rating-product-img" onerror="this.src='../../assets/logo.png'">
                    <div>
                        <strong class="rating-product-name">${escapeHTML(tenSP)}${escapeHTML(kichThuoc)}</strong>
                        <div class="rating-product-meta">Mã: ${escapeHTML(maSP)}</div>
                    </div>
                </div>

                <!-- Chọn số sao cho sản phẩm này -->
                <div class="rating-stars-row">
                    <span style="font-size:13px; color:var(--text-muted); margin-right:8px;">Chất lượng:</span>
                    <div class="star-selector" id="starSelector_${idx}">
                        ${[1,2,3,4,5].map(n => `
                            <button type="button" class="star-btn active" data-product-key="${maSP}" data-val="${n}" onclick="selectProductStar('${maSP}', ${n}, ${idx})" title="${n} sao">
                                <i class="fa-solid fa-star"></i>
                            </button>
                        `).join('')}
                    </div>
                    <span class="star-label" id="starLabel_${idx}" style="margin-left:8px; margin-bottom:0; font-weight:500; color:var(--text-main);">Tuyệt vời!</span>
                </div>

                <!-- Ô nhận xét cho sản phẩm này -->
                <textarea class="rating-textarea product-comment-input" 
                    id="comment_${idx}"
                    placeholder="Viết nhận xét chi tiết về chiếc bánh này (hương vị, độ ngọt, trang trí...)..."
                    maxlength="500" rows="3" oninput="resetToxicUI()"></textarea>
            </div>
        `;
    }).join('');

    zone.style.display = 'block';
    zone.innerHTML = `
        <div class="rating-form-box">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                <h4 style="margin-bottom:0; font-family:var(--font-serif); font-size:17px; color:var(--text-main);"><i class="fa-solid fa-star" style="color:#E8A427;"></i> Đánh giá từng món bánh</h4>
                <span style="font-size:12px; color:var(--text-muted);">${items.length} món bánh</span>
            </div>

            <!-- Danh sách từng sản phẩm để đánh giá riêng -->
            <div class="rating-products-list">
                ${productsHTML}
            </div>

            <!-- Khu vực cảnh báo kiểm duyệt toxic -->
            <div id="toxicAlert" class="toxic-alert" style="display:none;"></div>

            <!-- Nút hành động -->
            <div class="rating-actions" style="margin-top:16px;">
                <button class="btn btn-outline btn-sm" onclick="closeratingForm()">Huỷ</button>
                <button class="btn btn-primary btn-sm" id="btnSubmitRating" onclick="checkToxicAndSubmitAll()">
                    <i class="fa-solid fa-paper-plane"></i> Hoàn tất đánh giá
                </button>
            </div>
        </div>`;

    // Cuộn mượt xuống phần form đánh giá
    setTimeout(() => {
        zone.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
}

const starLabels = ['', 'Rất tệ', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Tuyệt vời!'];

function selectProductStar(maSP, val, idx) {
    _productStars[maSP] = val;
    const container = document.getElementById(`starSelector_${idx}`);
    if (container) {
        container.querySelectorAll('.star-btn').forEach((btn, i) => {
            const icon = btn.querySelector('i');
            if (i < val) {
                icon.className = 'fa-solid fa-star';
                btn.classList.add('active');
            } else {
                icon.className = 'fa-regular fa-star';
                btn.classList.remove('active');
            }
        });
    }
    const lbl = document.getElementById(`starLabel_${idx}`);
    if (lbl) lbl.textContent = starLabels[val] || '';
}

function closeratingForm() {
    const zone       = document.getElementById('ratingFormZone');
    const actionZone = document.getElementById('orderActionZone');
    if (zone)       zone.style.display       = 'none';
    if (actionZone) actionZone.style.display = 'flex';
}

function resetToxicUI() {
    const alert = document.getElementById('toxicAlert');
    if (alert) alert.style.display = 'none';
}

// ─── KIỂM DUYỆT TOXIC & GỬI ĐÁNH GIÁ TỪNG SẢN PHẨM ──────────
async function checkToxicAndSubmitAll() {
    const order = customerOrders[currentOrderIdx];
    if (!order) return;

    const productCards = document.querySelectorAll('#ratingFormZone .rating-product-item');
    const submitBtn = document.getElementById('btnSubmitRating');

    if (submitBtn) { 
        submitBtn.disabled = true; 
        submitBtn.textContent = 'Đang kiểm tra & gửi...'; 
    }

    const reviewsToSubmit = [];

    // Duyệt qua từng sản phẩm trong form để gom dữ liệu và kiểm tra toxic
    for (let idx = 0; idx < productCards.length; idx++) {
        const card = productCards[idx];
        const maSP = card.dataset.masp;
        const tenSP = card.dataset.tensp;
        const stars = _productStars[maSP] || 5;
        const commentInput = card.querySelector('.product-comment-input');
        const comment = commentInput ? commentInput.value.trim() : '';

        // Nếu có nhập bình luận, kiểm tra toxic
        let loaiBL = 'Tích cực';
        if (comment) {
            const toxicResult = await runToxicCheck(comment);
            if (toxicResult !== null) {
                const score = toxicResult.toxic ?? 0;
                const isToxic = toxicResult.is_toxic || (score >= TOXIC_THRESHOLD);
                if (isToxic) {
                    showToxicWarning(score, tenSP);
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Hoàn tất đánh giá';
                    }
                    commentInput.focus();
                    return; // Chặn ngay khi có bình luận tiêu cực
                }
                loaiBL = toxicResult.LoaiBL || (score >= 0.5 ? 'Tiêu cực' : 'Tích cực');
            }
        }

        const img = card.dataset.hinhanh || '';
        reviewsToSubmit.push({
            MaSP: maSP,
            TenSP: tenSP,
            HinhAnh: img,
            SoSao: stars,
            BinhLuan: comment,
            LoaiBL: loaiBL
        });
    }

    /* Gửi danh sách đánh giá của từng sản phẩm lên backend */
    await doSubmitAllRatings(reviewsToSubmit, submitBtn);
}

async function runToxicCheck(text) {
    try {
        const res = await fetch(TOXIC_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;   // Flask không chạy → bỏ qua lọc
    }
}

function showToxicWarning(score, productName = '') {
    const pct   = Math.round(score * 100);
    const alert = document.getElementById('toxicAlert');
    if (!alert) return;
    alert.style.display = 'block';
    const prodText = productName ? ` ở bánh "<strong>${escapeHTML(productName)}</strong>"` : '';
    alert.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation"></i>
        <div>
            <strong>Bình luận${prodText} bị chặn (điểm toxic: ${pct}%)</strong><br>
            Nội dung chứa ngôn từ không phù hợp hoặc tiêu cực. Vui lòng chỉnh sửa lại trước khi gửi.
        </div>`;
    alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function doSubmitAllRatings(reviewsList, submitBtn) {
    const order = customerOrders[currentOrderIdx];
    if (!order) return;

    const user  = getCurrentUser();
    const maKH  = user ? (user.MaKH || user.id || user._id || 'KH01') : 'KH01';

    try {
        const result = await fetchApi(`/orders/${order.MaDH}/rating`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reviews: reviewsList, maKH }),
        });

        /* Cập nhật local data đơn hàng */
        const savedRatings = result?.data?.DanhGia || reviewsList;
        order.DanhGia = savedRatings;
        customerOrders[currentOrderIdx] = order;

        // Cập nhật lại giao diện danh sách thẻ đơn hàng bên ngoài
        const container = document.getElementById('ordersContainer');
        if (container) {
            container.innerHTML = customerOrders.map((ord, idx) => renderOrderCard(ord, idx)).join('');
        }

        /* Ẩn form và chuyển actionZone thành Xem đánh giá */
        const zone = document.getElementById('ratingFormZone');
        if (zone) { zone.style.display = 'none'; zone.innerHTML = ''; }

        const actionZone = document.getElementById('orderActionZone');
        if (actionZone) {
            actionZone.outerHTML = buildViewRatingHTML(savedRatings);
        }

        showOrderToast('🎉 Cảm ơn bạn đã đánh giá các món bánh!');
    } catch (err) {
        const msg = err.message || 'Lỗi server';
        if (err.status === 422) {
            showToxicWarning(1);
            const alert = document.getElementById('toxicAlert');
            if (alert) alert.querySelector('strong').textContent = msg;
        } else {
            showOrderToast('❌ Gửi đánh giá thất bại: ' + msg, true);
        }
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Hoàn tất đánh giá';
        }
    }
}

// ─── XEM ĐÁNH GIÁ ────────────────────────────────────────
function buildViewRatingHTML(danhGiaData) {
    const list = Array.isArray(danhGiaData) ? danhGiaData : [danhGiaData];

    const itemsHTML = list.map((item, idx) => {
        const stars = item.SoSao || 5;

        const starsHTML = Array.from({ length: 5 }, (_, i) =>
            `<i class="${i < stars ? 'fa-solid' : 'fa-regular'} fa-star"
                style="color:${i < stars ? '#E8A427' : '#ccc'}; font-size:14px;"></i>`
        ).join('');

        const tenSP = item.TenSP || item.MaSP || 'Bánh ngọt';
        const img = getProductFirstImage(item, idx);

        const dateStr = item.NgayDang
            ? new Date(item.NgayDang).toLocaleDateString('vi-VN')
            : '';

        const loaiBL = item.LoaiBL
            ? `<span class="review-badge-sentiment ${item.LoaiBL === 'Tiêu cực' ? 'negative' : 'positive'}">
                    ${escapeHTML(item.LoaiBL)}
               </span>`
            : '';

        /* Link tới trang chi tiết sản phẩm */
        const productLink = item.MaSP
            ? `../details_cake/details.html?MaSP=${encodeURIComponent(item.MaSP)}`
            : '#';

        const productNameHTML = item.MaSP
            ? `
                <a href="${productLink}"
                   class="review-product-link"
                   title="Xem sản phẩm ${escapeHTML(tenSP)}">
                    ${escapeHTML(tenSP)}
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
              `
            : `
                <span class="review-product-name">
                    ${escapeHTML(tenSP)}
                </span>
              `;

        return `
            <div class="view-rating-item-card">

                <div class="view-rating-product-row">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${img}" alt="${escapeHTML(tenSP)}" class="rating-product-img-small" onerror="this.src='../../assets/logo.png'">
                        <strong class="review-product-title">
                            ${productNameHTML}
                        </strong>
                    </div>

                    <div class="view-rating-score">
                        ${loaiBL}
                        <span>${starsHTML}</span>
                    </div>

                </div>

                ${
                    item.BinhLuan
                        ? `<p class="view-rating-comment">
                                "${escapeHTML(item.BinhLuan)}"
                           </p>`
                        : `
                           <p class="view-rating-comment-empty">
                                (Không kèm nhận xét văn bản)
                           </p>
                          `
                }

                ${
                    dateStr
                        ? `<span class="view-rating-date">
                                ${dateStr}
                           </span>`
                        : ''
                }

            </div>
        `;
    }).join('');

    return `
        <div class="view-rating-box" id="orderActionZone">

            <div class="view-rating-header">
                <i class="fa-solid fa-circle-check"
                   style="color:var(--sage-dark);"></i>

                <span>Đã đánh giá đơn hàng</span>
            </div>

            <div class="view-rating-items-container">
                ${itemsHTML}
            </div>

        </div>
    `;
}

// ─── TOAST ───────────────────────────────────────────────
function showOrderToast(msg, isError = false) {
    let t = document.getElementById('orderToast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'orderToast';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className   = 'order-toast' + (isError ? ' error' : '');
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3200);
}
