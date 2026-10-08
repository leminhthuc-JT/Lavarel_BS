/* =========================================================
   THE LITTLE PRINCE — PRODUCT DETAILS
========================================================= */

let currentProduct = null;
let currentSizes = [];
let selectedSizeObj = null;
let currentQuantity = 1;


/* =========================================================
   REVIEW STATE (phân trang đánh giá)
========================================================= */

const REVIEWS_PER_PAGE = 3;

/*
    Endpoint lấy thông tin khách hàng theo MaKH.
    Nếu API của bạn đặt tên khác thì chỉ cần sửa dòng này.
    Kết quả mong đợi: { MaKH, HoTen, ... }
*/
const CUSTOMER_API = '/customers';

const reviewState = {
    reviews: [],
    page: 1,
    listenerBound: false
};

const customerNameCache = new Map();     // MaKH -> HoTen
const customerPendingCache = new Map();  // MaKH -> Promise<HoTen>

/* Lưu các đánh giá mà trình duyệt này đã bấm thích */
const REVIEW_LIKES_STORAGE_KEY = 'lp_liked_reviews';


/* =========================================================
   INIT
========================================================= */

document.addEventListener('DOMContentLoaded', async () => {

    setupHeader('menu');

    const urlParams = new URLSearchParams(window.location.search);

    const maSP = urlParams.get('MaSP') || 'BK01';

    await loadProductDetail(maSP);

});


/* =========================================================
   LOAD PRODUCT DETAIL
========================================================= */

async function loadProductDetail(maSP) {

    try {

        let product = null;


        /* ---- Thử lấy sản phẩm theo MaSP ---- */

        try {

            product = await fetchApi(`/products/${maSP}`);

        } catch (e) {

            console.warn(
                'Không lấy được sản phẩm theo MaSP, thử lấy toàn bộ sản phẩm.'
            );

            const all = await fetchApi('/products');

            product = all.find(
                p => (p.MaSP || p._id) === maSP
            ) || null;

        }


        /* ---- Fallback sample ---- */

        if (!product) {

            product = getSampleProduct(maSP);

        }


        currentProduct = product;

        renderDetailsUI(product);

        renderProductReviews(product);

        loadRelatedProducts(
            product.MaDM || product.category_code || 'DM01',
            maSP
        );


    } catch (err) {

        console.error(
            'Lỗi khi tải chi tiết sản phẩm:',
            err
        );

        const sample = getSampleProduct(maSP);

        currentProduct = sample;

        renderDetailsUI(sample);

        renderProductReviews(sample);

    }

}


/* =========================================================
   RENDER PRODUCT DETAIL UI
========================================================= */

function renderDetailsUI(product) {

    const container =
        document.getElementById('detailsContainer');

    if (!container) return;


    /* ---- Images ---- */

    const images =
        Array.isArray(product.HinhAnh) &&
        product.HinhAnh.length > 0

            ? product.HinhAnh

            : [
                product.HinhAnh ||
                'bk01_1.png'
            ];


    const resolvedImages =
        images.map(
            (img, idx) =>
                resolveImageUrl(img, idx)
        );


    /* ---- Sizes ---- */

    const sizes =
        Array.isArray(product.KichThuoc) &&
        product.KichThuoc.length > 0

            ? product.KichThuoc

            : [
                {
                    Ten: 'Nhỏ',
                    Gia: product.Gia || 120000
                },
                {
                    Ten: 'Trung',
                    Gia: 180000
                },
                {
                    Ten: 'Lớn',
                    Gia: 250000
                }
            ];


    /*
        Lưu lại danh sách size đang hiển thị để selectSize()
        hoạt động cả khi sản phẩm không có KichThuoc (dùng size mặc định).
    */
    currentSizes = sizes;

    selectedSizeObj = sizes[0];

    currentQuantity = 1;

    const initialPrice =
        selectedSizeObj?.Gia || 0;


    /* ---- Basic information ---- */

    const maSP =
        product.MaSP ||
        product._id ||
        'BK01';


    const tenSP =
        product.TenSP ||
        'Bánh Ngọt Little Prince';


    const moTa =
        product.MoTa ||
        'Chiếc bánh được các nghệ nhân bánh Little Prince chế tác tỉ mỉ với nguyên liệu hữu cơ nướng tươi mỗi ngày.';


    const status =
        product.TrangThai ||
        'Còn hàng tươi mới';


    const stockCount =
        product.SoLuong !== undefined
            ? product.SoLuong
            : 15;


    const liked =
        typeof isLiked === 'function'
            ? isLiked(maSP)
            : false;


    /* ---- Render HTML ---- */

    container.innerHTML = `

        <div class="details-layout">


            <!-- GALLERY -->

            <div class="gallery-section">

                <div class="main-image-wrap">

                    <img
                        id="mainImage"
                        src="${resolvedImages[0]}"
                        alt="${escapeHTML(tenSP)}"
                    >

                </div>


                ${
                    resolvedImages.length > 1

                        ? `

                            <div class="thumbnails-wrap">

                                ${resolvedImages.map(
                                    (src, i) => `

                                        <div
                                            class="thumb-item ${
                                                i === 0
                                                    ? 'active'
                                                    : ''
                                            }"
                                            onclick="switchMainImage(
                                                '${src}',
                                                this
                                            )"
                                        >

                                            <img
                                                src="${src}"
                                                alt="Thumbnail ${
                                                    i + 1
                                                }"
                                            >

                                        </div>

                                    `
                                ).join('')}

                            </div>

                        `

                        : ''
                }

            </div>


            <!-- PRODUCT INFO -->

            <div class="info-section">

                <span class="details-tag">
                    ${escapeHTML(status)}
                </span>

                <h1 class="details-title">
                    ${escapeHTML(tenSP)}
                </h1>

                <div class="details-price-row">
                    <div
                        class="details-price"
                        id="displayedPrice"
                    >
                        ${formatVND(initialPrice)}
                    </div>
                </div>

                <p class="details-desc">
                    ${escapeHTML(moTa)}
                </p>

                <div class="details-stock">
                    <span>
                        ✓ Tình trạng:

                        ${
                            stockCount > 0
                                ? `Còn ${stockCount} mẻ bánh trong ngày`
                                : 'Tạm hết hàng'
                        }
                    </span>
                </div>


                <!-- SIZE -->

                <span class="option-label">
                    Chọn Kích Thước:
                </span>

                <div class="size-selector">

                    ${sizes.map(
                        (s, idx) => `

                            <button
                                type="button"
                                class="size-btn ${
                                    idx === 0
                                        ? 'active'
                                        : ''
                                }"
                                onclick="selectSize(
                                    ${idx},
                                    this
                                )"
                                data-price="${s.Gia}"
                            >

                                ${escapeHTML(s.Ten)}
                                (${formatVND(s.Gia)})

                            </button>

                        `
                    ).join('')}

                </div>


                <!-- QUANTITY -->

                <span class="option-label">
                    Số Lượng:
                </span>

                <div class="qty-row">

                    <div class="qty-control">

                        <button
                            type="button"
                            class="qty-btn"
                            onclick="changeQty(-1)"
                        >
                            −
                        </button>

                        <span
                            class="qty-val"
                            id="qtyVal"
                        >
                            1
                        </span>

                        <button
                            type="button"
                            class="qty-btn"
                            onclick="changeQty(1)"
                        >
                            +
                        </button>

                    </div>

                </div>


                <!-- ACTION BUTTONS -->

                <div class="action-buttons">

                    <button
                        type="button"
                        class="btn btn-primary"
                        onclick="handleAddDetailCart()"
                    >
                        <i class="fa-solid fa-bag-shopping"></i>
                        Thêm vào giỏ
                    </button>

                    <button
                        type="button"
                        class="btn btn-dark"
                        onclick="handleBuyNow()"
                    >
                        <i class="fa-solid fa-shop"></i>
                        Mua ngay
                    </button>

                    <button
                        type="button"
                        class="btn btn-outline ${
                            liked ? 'liked' : ''
                        }"
                        id="likeDetailBtn"
                        onclick="handleDetailLike('${maSP}')"
                    >
                        ${
                            liked
                                ? '♥ Đã thích'
                                : '♡ Yêu thích'
                        }
                    </button>

                </div>


                <!-- BENEFITS -->

                <div class="product-benefits">

                    <div class="product-benefit">
                        <i class="fa-solid fa-leaf"></i>
                        <span>Nguyên liệu tươi mới</span>
                    </div>

                    <div class="product-benefit">
                        <i class="fa-solid fa-box"></i>
                        <span>Đóng gói cẩn thận</span>
                    </div>

                    <div class="product-benefit">
                        <i class="fa-solid fa-heart"></i>
                        <span>Làm bằng cả tình yêu</span>
                    </div>

                </div>

            </div>

        </div>

    `;

}


/* =========================================================
   SWITCH MAIN IMAGE
========================================================= */

function switchMainImage(src, thumbEl) {

    const mainImage =
        document.getElementById('mainImage');

    if (!mainImage) return;

    mainImage.src = src;

    document
        .querySelectorAll('.thumb-item')
        .forEach(el => el.classList.remove('active'));

    if (thumbEl) {
        thumbEl.classList.add('active');
    }

}


/* =========================================================
   SELECT SIZE
========================================================= */

function selectSize(index, btn) {

    if (!currentSizes.length) return;

    selectedSizeObj =
        currentSizes[index] ||
        currentSizes[0];

    document
        .querySelectorAll('.size-btn')
        .forEach(b => b.classList.remove('active'));

    if (btn) {
        btn.classList.add('active');
    }

    const priceElement =
        document.getElementById('displayedPrice');

    if (priceElement) {
        priceElement.textContent =
            formatVND(selectedSizeObj.Gia);
    }

}


/* =========================================================
   CHANGE QUANTITY
========================================================= */

function changeQty(delta) {

    const maxStock = currentProduct?.SoLuong !== undefined ? Number(currentProduct.SoLuong) : 999;

    if (delta > 0 && currentQuantity + delta > maxStock) {
        if (typeof showToast === 'function') {
            showToast(`Sản phẩm này chỉ còn tối đa ${maxStock} chiếc trong kho!`, 'error');
        }
        return;
    }

    currentQuantity += delta;

    if (currentQuantity < 1) {
        currentQuantity = 1;
    }

    const qtyElement =
        document.getElementById('qtyVal');

    if (qtyElement) {
        qtyElement.textContent = currentQuantity;
    }

}


/* =========================================================
   LIKE PRODUCT
========================================================= */

function handleDetailLike(maSP) {

    const btn =
        document.getElementById('likeDetailBtn');

    if (
        !btn ||
        typeof toggleLike !== 'function'
    ) {
        return;
    }

    const nowLiked = toggleLike(maSP);

    if (nowLiked) {
        btn.classList.add('liked');
        btn.innerHTML = '♥ Đã thích';
    } else {
        btn.classList.remove('liked');
        btn.innerHTML = '♡ Yêu thích';
    }

}


/* =========================================================
   ADD TO CART
========================================================= */

function handleAddDetailCart() {

    if (!currentProduct) return;

    if (typeof addToCart === 'function') {
        addToCart(
            currentProduct,
            selectedSizeObj,
            currentQuantity
        );
    }

}


/* =========================================================
   BUY NOW
========================================================= */

function handleBuyNow() {

    if (!currentProduct) return;

    if (typeof addToCart === 'function') {
        const ok = addToCart(
            currentProduct,
            selectedSizeObj,
            currentQuantity
        );
        if (ok) {
            window.location.href = '../cart/cart.html';
        }
    }

}


/* =========================================================
   RELATED PRODUCTS
========================================================= */

async function loadRelatedProducts(
    maDM,
    currentMaSP
) {

    const relatedSec =
        document.getElementById('relatedSection');

    const grid =
        document.getElementById('relatedProductGrid');

    if (!relatedSec || !grid) return;


    try {

        const all = await fetchApi('/products');

        const related =
            all
                .filter(
                    p =>
                        (p.MaDM || p.category_code) === maDM
                        &&
                        (p.MaSP || p._id) !== currentMaSP
                )
                .slice(0, 4);


        if (related.length === 0) {
            relatedSec.style.display = 'none';
            return;
        }

        relatedSec.style.display = 'block';


        grid.innerHTML =
            related.map(
                (p, idx) => {

                    const price =
                        Array.isArray(p.KichThuoc) &&
                        p.KichThuoc.length > 0

                            ? p.KichThuoc[0].Gia

                            : (p.Gia || 0);

                    const pMaSP = p.MaSP || p._id;

                    return `

                        <article
                            class="product-card"
                            onclick="
                                window.location.href =
                                'details.html?MaSP=${pMaSP}'
                            "
                            style="cursor:pointer;"
                        >

                            <div class="product-image-wrap">

                                <img
                                    src="${resolveImageUrl(
                                        p.HinhAnh,
                                        idx
                                    )}"
                                    alt="${escapeHTML(
                                        p.TenSP || ''
                                    )}"
                                >

                            </div>

                            <div class="product-content">

                                <h3 class="product-title">
                                    ${escapeHTML(p.TenSP || '')}
                                </h3>

                                <div class="product-footer">

                                    <span class="product-price">
                                        ${formatVND(price)}
                                    </span>

                                    <button
                                        type="button"
                                        class="btn-add-cart"
                                        title="Xem"
                                        onclick="event.stopPropagation();"
                                    >
                                        →
                                    </button>

                                </div>

                            </div>

                        </article>

                    `;

                }
            ).join('');


    } catch (e) {

        console.warn(
            'Không thể tải sản phẩm liên quan:',
            e
        );

        relatedSec.style.display = 'none';

    }

}


/* =========================================================
   SAMPLE PRODUCT
========================================================= */

function getSampleProduct(maSP) {

    return {

        MaSP: maSP,

        TenSP: 'Strawberry Shortcake Hoàng Gia',

        MoTa:
            'Cốt bánh chiffon Nhật Bản siêu tơi xốp, kết hợp cùng lớp kem tươi whipping cream nhập khẩu Pháp ngọt thanh và dâu tây Đà Lạt tươi mọng được hái lúc sáng sớm.',

        SoLuong: 18,

        TrangThai: 'Bán chạy nhất',

        MaDM: 'DM01',

        HinhAnh: [
            'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80'
        ],

        KichThuoc: [
            { Ten: 'Nhỏ (12cm)',  Gia: 180000 },
            { Ten: 'Trung (16cm)', Gia: 320000 },
            { Ten: 'Lớn (20cm)',  Gia: 450000 }
        ],

        DanhGia: []

    };

}


/* =========================================================
   PRODUCT REVIEWS — ENTRY POINT
========================================================= */

function renderProductReviews(product) {

    const reviewContainer =
        document.getElementById('productReviews');

    if (!reviewContainer) {
        console.warn('Không tìm thấy #productReviews');
        return;
    }


    /* ---- Chuẩn hoá dữ liệu: DanhGia có thể là undefined / object / array ---- */

    let reviews = product?.DanhGia || [];

    if (!Array.isArray(reviews)) {
        reviews = [reviews];
    }

    reviews = reviews.filter(
        review =>
            review &&
            (review.BinhLuan || review.SoSao)
    );


    /* ---- Mới nhất lên đầu ---- */

    reviews.sort(
        (a, b) =>
            getTimeValue(b.NgayDang) -
            getTimeValue(a.NgayDang)
    );


    /* ---- Khởi tạo trạng thái thích cho từng đánh giá ---- */

    const likedKeys = loadLikedReviewKeys();
    const maKH      = getCurrentMaKH();

    reviews.forEach(review => {

        const id = getReviewId(review);

        review._reviewId = id;                       // có _id => lưu like vào MongoDB
        review._likeKey  = id || getReviewKey(review);

        const baseLikes = Number(review.LuotThich) || 0;

        if (id) {

            /* Chế độ server: LuotThich đã gồm cả like của mình */

            review._likes = baseLikes;

            review._liked =
                review.DaThich === true ||
                (
                    Boolean(maKH) &&
                    Array.isArray(review.NguoiThich) &&
                    review.NguoiThich.includes(maKH)
                );

        } else {

            /* Chế độ cục bộ (đánh giá chưa có _id): lưu trong localStorage */

            review._liked = likedKeys.has(review._likeKey);
            review._likes = baseLikes + (review._liked ? 1 : 0);

        }

    });


    reviewState.reviews = reviews;
    reviewState.page = 1;


    bindReviewEvents(reviewContainer);

    renderReviewPage(false);

}


/* =========================================================
   RENDER MỘT TRANG ĐÁNH GIÁ
========================================================= */

function renderReviewPage(shouldScroll = false) {

    const reviewContainer =
        document.getElementById('productReviews');

    if (!reviewContainer) return;

    const { reviews } = reviewState;
    const total = reviews.length;


    /* ---- Chưa có đánh giá ---- */

    if (total === 0) {

        reviewContainer.innerHTML = `

            <div class="no-reviews">

                <div class="no-reviews-icon">
                    <i class="fa-regular fa-comment-dots"></i>
                </div>

                <h3>Chưa có bài đánh giá</h3>

                <p>
                    Sản phẩm hiện tại chưa có
                    bài đánh giá nào từ khách hàng.
                </p>

            </div>

        `;

        return;

    }


    /* ---- Tính trang ---- */

    const totalPages =
        Math.ceil(total / REVIEWS_PER_PAGE);

    reviewState.page =
        Math.min(
            Math.max(1, reviewState.page),
            totalPages
        );

    const start =
        (reviewState.page - 1) * REVIEWS_PER_PAGE;

    const end =
        Math.min(start + REVIEWS_PER_PAGE, total);

    const pageReviews =
        reviews.slice(start, end);


    /* ---- Render ---- */

    reviewContainer.innerHTML = `

        <div class="reviews-meta">
            Hiển thị ${start + 1}–${end}
            trên ${total} đánh giá
        </div>

        <div class="review-list">

            ${pageReviews
                .map(review => createReviewHTML(review))
                .join('')}

        </div>

        ${createPaginationHTML(reviewState.page, totalPages)}

    `;


    /* ---- Điền tên khách hàng (bất đồng bộ) ---- */

    hydrateCustomerNames(reviewContainer, pageReviews);


    /* ---- Cuộn về đầu phần đánh giá khi người dùng đổi trang ---- */

    if (shouldScroll) {

        const section =
            document.querySelector('.product-reviews-section');

        if (section) {
            section.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }

    }

}


/* =========================================================
   PAGINATION UI
========================================================= */

function createPaginationHTML(current, totalPages) {

    if (totalPages <= 1) return '';

    const items = getPaginationItems(current, totalPages);

    const pageButtons = items.map(item => {

        if (item === '…') {
            return `<span class="page-ellipsis" aria-hidden="true">…</span>`;
        }

        const isActive = item === current;

        return `

            <button
                type="button"
                class="page-btn ${isActive ? 'active' : ''}"
                data-page="${item}"
                aria-label="Trang ${item}"
                ${isActive ? 'aria-current="page"' : ''}
            >
                ${item}
            </button>

        `;

    }).join('');


    return `

        <nav
            class="reviews-pagination"
            aria-label="Phân trang đánh giá"
        >

            <button
                type="button"
                class="page-btn page-nav"
                data-page="${current - 1}"
                aria-label="Trang trước"
                ${current === 1 ? 'disabled' : ''}
            >
                <i class="fa-solid fa-chevron-left"></i>
            </button>

            ${pageButtons}

            <button
                type="button"
                class="page-btn page-nav"
                data-page="${current + 1}"
                aria-label="Trang sau"
                ${current === totalPages ? 'disabled' : ''}
            >
                <i class="fa-solid fa-chevron-right"></i>
            </button>

        </nav>

    `;

}


/*
    Trả về danh sách số trang cần hiển thị, ví dụ:
    tổng 10, đang ở trang 5  ->  1 … 4 5 6 … 10
*/
function getPaginationItems(current, total) {

    if (total <= 5) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = new Set([1, total, current, current - 1, current + 1]);

    const sorted =
        [...pages]
            .filter(p => p >= 1 && p <= total)
            .sort((a, b) => a - b);

    const result = [];

    sorted.forEach((p, i) => {

        if (i > 0 && p - sorted[i - 1] > 1) {
            result.push('…');
        }

        result.push(p);

    });

    return result;

}


/* Dùng event delegation: chỉ gắn listener một lần (phân trang + thích) */

function bindReviewEvents(container) {

    if (reviewState.listenerBound) return;

    container.addEventListener('click', e => {

        /* ---- Bấm thích đánh giá ---- */

        const likeBtn = e.target.closest('.review-like[data-review-key]');

        if (likeBtn) {
            toggleReviewLike(likeBtn);
            return;
        }


        /* ---- Chuyển trang ---- */

        const btn = e.target.closest('.page-btn[data-page]');

        if (!btn || btn.disabled) return;

        const page = Number(btn.dataset.page);

        if (!Number.isInteger(page) || page === reviewState.page) return;

        reviewState.page = page;

        renderReviewPage(true);

    });

    reviewState.listenerBound = true;

}


/* =========================================================
   REVIEW LIKES
========================================================= */

/* Khoá định danh một đánh giá (đánh giá không có _id riêng) */

function getReviewKey(review) {

    const maSP =
        currentProduct?.MaSP ||
        currentProduct?._id ||
        '';

    return `${maSP}|${review.MaKH || ''}|${getTimeValue(review.NgayDang)}`;

}


function loadLikedReviewKeys() {

    try {

        const raw = localStorage.getItem(REVIEW_LIKES_STORAGE_KEY);

        const list = raw ? JSON.parse(raw) : [];

        return new Set(Array.isArray(list) ? list : []);

    } catch (e) {

        return new Set();

    }

}


function saveLikedReviewKeys(keys) {

    try {

        localStorage.setItem(
            REVIEW_LIKES_STORAGE_KEY,
            JSON.stringify([...keys])
        );

    } catch (e) {

        console.warn('Không thể lưu trạng thái thích:', e);

    }

}


function getReviewId(review) {

    const id = review._id;

    if (!id) return '';

    return typeof id === 'object' ? (id.$oid || '') : String(id);

}


/*
    Lấy MaKH của khách đang đăng nhập.
    !!! Đây là chỗ DUY NHẤT cần chỉnh cho khớp cách web bạn lưu đăng nhập.
*/
function getCurrentMaKH() {

    try {

        if (typeof getCurrentUser === 'function') {

            const u = getCurrentUser();

            if (u && (u.MaKH || u.khachHang?.MaKH)) {
                return u.MaKH || u.khachHang.MaKH;
            }

        }

        const keys = [
            'user', 'currentUser', 'userInfo',
            'khachHang', 'KhachHang', 'loggedInUser'
        ];

        for (const store of [localStorage, sessionStorage]) {

            for (const k of keys) {

                const raw = store.getItem(k);

                if (!raw) continue;

                const u = JSON.parse(raw);

                const ma = u?.MaKH || u?.khachHang?.MaKH || u?.user?.MaKH;

                if (ma) return ma;

            }

        }

    } catch (e) { /* bỏ qua */ }

    return '';

}


function notifyUser(message) {

    if (typeof showToast === 'function') {
        showToast(message);
    } else {
        alert(message);
    }

}


function updateLikeButton(btn, review) {

    btn.classList.toggle('liked', review._liked);

    btn.setAttribute('aria-pressed', String(review._liked));

    const icon = btn.querySelector('i');

    if (icon) {
        icon.classList.toggle('fa-solid', review._liked);
        icon.classList.toggle('fa-regular', !review._liked);
    }

    const countEl = btn.querySelector('.review-like-count');

    if (countEl) {
        countEl.textContent = review._likes;
    }

}


async function toggleReviewLike(btn) {

    const review =
        reviewState.reviews.find(
            r => r._likeKey === btn.dataset.reviewKey
        );

    if (!review || review._likeBusy) return;

    const useServer = Boolean(review._reviewId);
    const maKH      = getCurrentMaKH();

    if (useServer && !maKH) {
        notifyUser('Vui lòng đăng nhập để thích đánh giá.');
        return;
    }


    /* ---- Cập nhật giao diện ngay (optimistic) ---- */

    const prevLiked = review._liked;
    const prevLikes = review._likes;
    const nextLiked = !prevLiked;

    review._liked = nextLiked;
    review._likes = Math.max(0, prevLikes + (nextLiked ? 1 : -1));

    updateLikeButton(btn, review);


    /* ---- Đánh giá chưa có _id: chỉ lưu trên trình duyệt ---- */

    if (!useServer) {

        const keys = loadLikedReviewKeys();

        if (nextLiked) {
            keys.add(review._likeKey);
        } else {
            keys.delete(review._likeKey);
        }

        saveLikedReviewKeys(keys);

        return;

    }


    /* ---- Lưu vào MongoDB ---- */

    review._likeBusy = true;

    try {

        const maSP =
            currentProduct?.MaSP ||
            currentProduct?._id;

        const res = await fetchApi(
            `/products/${encodeURIComponent(maSP)}` +
            `/reviews/${encodeURIComponent(review._reviewId)}/like`,
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ MaKH: maKH, liked: nextLiked })
            }
        );

        /* Đồng bộ số thật từ server */

        if (res && typeof res.LuotThich === 'number') {
            review._likes = res.LuotThich;
            review._liked = Boolean(res.DaThich);
        }

    } catch (e) {

        console.warn('Không thể cập nhật lượt thích:', e);

        review._liked = prevLiked;
        review._likes = prevLikes;

        notifyUser('Không thể cập nhật lượt thích. Vui lòng thử lại.');

    } finally {

        review._likeBusy = false;

        /* Người dùng có thể đã chuyển trang trong lúc chờ -> tìm lại nút */

        const current =
            document.querySelector(
                `.review-like[data-review-key="${CSS.escape(review._likeKey)}"]`
            );

        if (current) {
            updateLikeButton(current, review);
        }

    }

}


/* =========================================================
   CUSTOMER NAME
========================================================= */

/* Tên hiển thị tạm thời khi chưa có / không tra được tên */
const DEFAULT_CUSTOMER_NAME = 'Khách hàng';


/* Lấy tên nếu backend đã trả sẵn ngay trong đánh giá */
function getInlineCustomerName(review) {

    return (
        review.HoTen ||
        review.TenKH ||
        review.KhachHang?.HoTen ||
        ''
    );

}


function getCustomerDisplayName(review) {

    const inline = getInlineCustomerName(review);

    if (inline) return inline;

    if (review.MaKH && customerNameCache.has(review.MaKH)) {
        return customerNameCache.get(review.MaKH);
    }

    return DEFAULT_CUSTOMER_NAME;

}


/* Tra tên khách hàng theo MaKH (có cache, không gọi trùng) */

function fetchCustomerName(maKH) {

    if (!maKH) return Promise.resolve('');

    if (customerNameCache.has(maKH)) {
        return Promise.resolve(customerNameCache.get(maKH));
    }

    if (customerPendingCache.has(maKH)) {
        return customerPendingCache.get(maKH);
    }

    const promise = (async () => {

        try {

            let data =
                await fetchApi(
                    `${CUSTOMER_API}/${encodeURIComponent(maKH)}`
                );

            /* Một số API trả về mảng hoặc { data: ... } */

            if (Array.isArray(data)) {
                data = data.find(c => c.MaKH === maKH) || data[0];
            } else if (data && data.data) {
                data = data.data;
            }

            const name =
                data?.HoTen ||
                data?.fullName ||
                data?.TenKH ||
                data?.customer?.HoTen ||
                data?.data?.HoTen ||
                data?.data?.fullName ||
                '';

            if (name) {
                customerNameCache.set(maKH, name);
            }

            return name;

        } catch (e) {

            console.warn(
                `Không lấy được tên khách hàng ${maKH}:`,
                e
            );

            return '';

        } finally {

            customerPendingCache.delete(maKH);

        }

    })();

    customerPendingCache.set(maKH, promise);

    return promise;

}


/* Sau khi render, tra tên rồi cập nhật lại từng dòng */

async function hydrateCustomerNames(container, reviews) {

    const codes = [
        ...new Set(
            reviews
                .filter(r => r.MaKH && !getInlineCustomerName(r))
                .map(r => r.MaKH)
        )
    ];

    if (codes.length === 0) return;

    await Promise.all(codes.map(fetchCustomerName));

    /* Container có thể đã render trang khác trong lúc chờ -> chỉ cập nhật phần tử còn tồn tại */

    container
        .querySelectorAll('[data-makh]')
        .forEach(el => {

            const name = customerNameCache.get(el.dataset.makh);

            if (name) {
                el.textContent = name;
            }

        });

}


/* =========================================================
   CREATE REVIEW HTML
========================================================= */

function createReviewHTML(review) {

    const rating = Number(review.SoSao) || 0;

    const stars = createStars(rating);

    const date = formatReviewDate(review.NgayDang);

    const customerName = getCustomerDisplayName(review);

    let replyHTML = '';


    /* ---- Staff reply ---- */

    if (
        review.TraLoi &&
        (
            review.TraLoi.BinhLuan ||
            review.TraLoi.MaNV
        )
    ) {

        const replyDate = formatReviewDate(review.TraLoi.NgayDang);

        replyHTML = `

            <div class="review-reply">

                <div class="review-reply-header">

                    <div class="review-reply-author">
                        <i class="fa-solid fa-store"></i>
                        <span>The Little Prince</span>
                    </div>

                    ${
                        replyDate
                            ? `<span class="review-reply-date">${replyDate}</span>`
                            : ''
                    }

                </div>

                ${
                    review.TraLoi.BinhLuan
                        ? `
                            <p class="review-reply-text">
                                ${escapeHTML(review.TraLoi.BinhLuan)}
                            </p>
                          `
                        : ''
                }

            </div>

        `;

    }


    /* ---- Card ---- */

    return `

        <article class="review-item">

            <div class="review-top">

                <div class="review-user">

                    <div class="review-avatar">
                        <i class="fa-regular fa-user"></i>
                    </div>

                    <div class="review-user-info">

                        <span
                            class="review-user-name"
                            data-makh="${escapeHTML(review.MaKH || '')}"
                        >${escapeHTML(customerName)}</span>

                        ${
                            date
                                ? `<span class="review-date">${date}</span>`
                                : ''
                        }

                    </div>

                </div>

                <div
                    class="review-stars"
                    aria-label="${rating} sao"
                >
                    ${stars}
                </div>

            </div>


            <div class="review-content">

                ${
                    review.BinhLuan
                        ? `
                            <p class="review-comment">
                                ${escapeHTML(review.BinhLuan)}
                            </p>
                          `
                        : ''
                }

                ${
                    review.LoaiBL
                        ? `
                            <span class="review-type">
                                ${escapeHTML(review.LoaiBL)}
                            </span>
                          `
                        : ''
                }

            </div>


            <div class="review-footer">

                <button
                    type="button"
                    class="review-like ${review._liked ? 'liked' : ''}"
                    data-review-key="${escapeHTML(review._likeKey || '')}"
                    aria-pressed="${review._liked ? 'true' : 'false'}"
                    aria-label="Thích đánh giá này"
                >
                    <i class="${
                        review._liked
                            ? 'fa-solid'
                            : 'fa-regular'
                    } fa-thumbs-up"></i>
                    <span class="review-like-count">${review._likes ?? 0}</span>
                </button>

            </div>

            ${replyHTML}

        </article>

    `;

}


/* =========================================================
   CREATE STARS
========================================================= */

function createStars(rating) {

    const score =
        Math.max(0, Math.min(5, Number(rating) || 0));

    let html = '';

    for (let i = 1; i <= 5; i++) {

        html += i <= score
            ? `<i class="fa-solid fa-star"></i>`
            : `<i class="fa-regular fa-star empty"></i>`;

    }

    return html;

}


/* =========================================================
   DATE HELPERS
========================================================= */

/* Chấp nhận string ISO, Date, hoặc dạng MongoDB { $date: "..." } */

function getTimeValue(value) {

    if (!value) return 0;

    const raw =
        typeof value === 'object' && value.$date
            ? value.$date
            : value;

    const time = new Date(raw).getTime();

    return Number.isNaN(time) ? 0 : time;

}


function formatReviewDate(dateString) {

    const time = getTimeValue(dateString);

    if (!time) return '';

    return new Date(time).toLocaleDateString(
        'vi-VN',
        {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}