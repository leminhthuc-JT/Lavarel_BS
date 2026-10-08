let allProducts = [];
let allCategories = [];
let activeMaDM = 'all';

/* =========================================================
   PAGINATION
========================================================= */

const PRODUCTS_PER_PAGE = 12;
let currentPage = 1;


/* =========================================================
   INIT
========================================================= */

document.addEventListener('DOMContentLoaded', async () => {

    setupHeader('menu');


    /* =========================
       LẤY DANH MỤC TỪ URL
    ========================= */

    const urlParams =
        new URLSearchParams(window.location.search);

    const maDMParam =
        urlParams.get('MaDM');

    if (maDMParam) {
        activeMaDM = maDMParam;
    }


    /* =========================
       SEARCH
    ========================= */

    const searchInput =
        document.getElementById('searchInput');

    if (searchInput) {

        searchInput.addEventListener(
            'input',
            () => {

                currentPage = 1;

                applyFilters();

            }
        );

    }


    /* =========================
       CATEGORY SELECT
    ========================= */

    const categorySelect =
        document.getElementById('categorySelect');

    if (categorySelect) {

        categorySelect.addEventListener(
            'change',
            (e) => {

                activeMaDM =
                    e.target.value;

                currentPage = 1;

                syncCategoryTabs();

                applyFilters();

            }
        );

    }


    /* =========================
       PRICE SELECT
    ========================= */

    const priceRangeSelect =
        document.getElementById(
            'priceRangeSelect'
        );

    if (priceRangeSelect) {

        priceRangeSelect.addEventListener(
            'change',
            () => {

                currentPage = 1;

                syncPriceRadio();

                applyFilters();

            }
        );

    }


    /* =========================
       PRICE RADIO
    ========================= */

    document
        .querySelectorAll(
            'input[name="priceFilter"]'
        )
        .forEach(radio => {

            radio.addEventListener(
                'change',
                (e) => {

                    const priceSelect =
                        document.getElementById(
                            'priceRangeSelect'
                        );

                    if (!priceSelect) return;


                    priceSelect.value =
                        e.target.value;


                    currentPage = 1;

                    applyFilters();

                }
            );

        });


    /* =========================
       SORT
    ========================= */

    const sortSelect =
        document.getElementById(
            'sortSelect'
        );

    if (sortSelect) {

        sortSelect.addEventListener(
            'change',
            () => {

                currentPage = 1;

                applyFilters();

            }
        );

    }


    /* =========================
       LOAD DATA
    ========================= */

    await loadCategories();

    await loadProducts();

});


/* =========================================================
   LOAD CATEGORIES
========================================================= */

async function loadCategories() {

    try {

        const res =
            await fetchApi('/categories');


        if (Array.isArray(res)) {

            allCategories = res;

        }

        else if (
            res &&
            Array.isArray(res.data)
        ) {

            allCategories = res.data;

        }

        else {

            allCategories = [];

        }


        /* =========================
           FALLBACK
        ========================= */

        if (allCategories.length === 0) {

            console.warn(
                'API không trả về danh mục'
            );

            allCategories =
                getFallbackCategories();

        }

    }

    catch (error) {

        console.warn(
            'Không thể lấy danh mục từ API:',
            error
        );

        allCategories =
            getFallbackCategories();

    }


    renderCategoryFilters();

}


/* =========================================================
   RENDER CATEGORY FILTERS
========================================================= */

function renderCategoryFilters() {

    const categoryTabs =
        document.getElementById(
            'categoryTabs'
        );

    if (!categoryTabs) return;


    if (
        !Array.isArray(allCategories) ||
        allCategories.length === 0
    ) {

        allCategories =
            getFallbackCategories();

    }


    /* =====================================================
       CATEGORY TABS
    ===================================================== */

    let html = `

        <button
            type="button"
            class="tab-btn ${
                activeMaDM === 'all'
                    ? 'active'
                    : ''
            }"
            data-madm="all"
        >
            <span>Tất cả sản phẩm</span>
        </button>

    `;


    allCategories.forEach(category => {

        const maDM =
            category.MaDM ||
            category._id;

        const tenDM =
            category.TenDM ||
            category.name ||
            'Danh mục';


        html += `

            <button
                type="button"
                class="tab-btn ${
                    activeMaDM === maDM
                        ? 'active'
                        : ''
                }"
                data-madm="${maDM}"
            >
                <span>${tenDM}</span>
            </button>

        `;

    });


    categoryTabs.innerHTML =
        html;


    /* =====================================================
       CATEGORY TAB EVENTS
    ===================================================== */

    categoryTabs
        .querySelectorAll('.tab-btn')
        .forEach(button => {

            button.addEventListener(
                'click',
                () => {

                    activeMaDM =
                        button.dataset.madm;


                    /* Đồng bộ dropdown */

                    const categorySelect =
                        document.getElementById(
                            'categorySelect'
                        );

                    if (categorySelect) {

                        categorySelect.value =
                            activeMaDM;

                    }


                    currentPage = 1;

                    syncCategoryTabs();

                    applyFilters();

                }
            );

        });

}


/* =========================================================
   SYNC CATEGORY TABS
========================================================= */

function syncCategoryTabs() {

    document
        .querySelectorAll(
            '#categoryTabs .tab-btn'
        )
        .forEach(button => {

            button.classList.toggle(
                'active',
                button.dataset.madm ===
                    String(activeMaDM)
            );

        });

}


/* =========================================================
   SYNC PRICE RADIO
========================================================= */

function syncPriceRadio() {

    const priceSelect =
        document.getElementById(
            'priceRangeSelect'
        );

    if (!priceSelect) return;


    const value =
        priceSelect.value;


    document
        .querySelectorAll(
            'input[name="priceFilter"]'
        )
        .forEach(radio => {

            radio.checked =
                radio.value === value;

        });

}


/* =========================================================
   LOAD PRODUCTS
========================================================= */

async function loadProducts() {

    const grid =
        document.getElementById(
            'productGrid'
        );

    if (!grid) return;


    /* =========================
       LOADING
    ========================= */

    grid.innerHTML = `

        <div
            class="loading-spinner"
            style="grid-column:1/-1;"
        >

            <div class="spinner"></div>

            <p>
                Đang tải danh sách bánh ngọt...
            </p>

        </div>

    `;


    try {

        const res =
            await fetchApi('/products');


        if (Array.isArray(res)) {

            allProducts = res;

        }

        else if (
            res &&
            Array.isArray(res.data)
        ) {

            allProducts =
                res.data;

        }

        else {

            allProducts = [];

        }


        /* =========================
           FALLBACK
        ========================= */

        if (allProducts.length === 0) {

            console.warn(
                'API không trả về sản phẩm'
            );

            allProducts =
                getFallbackProducts();

        }

    }

    catch (error) {

        console.warn(
            'Không thể lấy sản phẩm từ API:',
            error
        );

        allProducts =
            getFallbackProducts();

    }


    currentPage = 1;

    applyFilters();

}


/* =========================================================
   APPLY FILTERS
========================================================= */

function applyFilters() {

    const grid =
        document.getElementById(
            'productGrid'
        );

    if (!grid) return;


    /* =========================
       SEARCH
    ========================= */

    const searchInput =
        document.getElementById(
            'searchInput'
        );


    const searchVal =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : '';


    /* =========================
       PRICE
    ========================= */

    const priceRangeSelect =
        document.getElementById(
            'priceRangeSelect'
        );


    const priceRangeVal =
        priceRangeSelect
            ? priceRangeSelect.value
            : 'all';


    /* =========================
       SORT
    ========================= */

    const sortSelect =
        document.getElementById(
            'sortSelect'
        );


    const sortVal =
        sortSelect
            ? sortSelect.value
            : 'newest';


    /* =========================
       COPY PRODUCTS
    ========================= */

    if (!Array.isArray(allProducts)) {

        allProducts =
            getFallbackProducts();

    }


    let filtered =
        [...allProducts];


    /* =====================================================
       FILTER CATEGORY
    ===================================================== */

    if (activeMaDM !== 'all') {

        filtered =
            filtered.filter(product => {

                const productMaDM =
                    product.MaDM ||
                    product.category_code ||
                    product.maDM ||
                    '';


                return String(productMaDM) ===
                    String(activeMaDM);

            });

    }


    /* =====================================================
       FILTER SEARCH
    ===================================================== */

    if (searchVal) {

        filtered =
            filtered.filter(product => {

                const productName =
                    product.TenSP ||
                    product.name ||
                    product.tenSP ||
                    '';


                const description =
                    product.MoTa ||
                    product.description ||
                    '';


                return (

                    String(productName)
                        .toLowerCase()
                        .includes(searchVal)

                    ||

                    String(description)
                        .toLowerCase()
                        .includes(searchVal)

                );

            });

    }


    /* =====================================================
       FILTER PRICE
    ===================================================== */

    if (priceRangeVal !== 'all') {

        filtered =
            filtered.filter(product => {

                const price =
                    getMinPrice(product);


                /* Dưới 100.000 */

                if (
                    priceRangeVal ===
                    'under100'
                ) {

                    return price < 100000;

                }


                /* 100.000 - 200.000 */

                if (
                    priceRangeVal ===
                    '100to200'
                ) {

                    return (
                        price >= 100000 &&
                        price <= 200000
                    );

                }


                /* Trên 200.000 */

                if (
                    priceRangeVal ===
                    'over200'
                ) {

                    return price > 200000;

                }


                return true;

            });

    }


    /* =====================================================
       SORT
    ===================================================== */

    if (sortVal === 'priceAsc') {

        filtered.sort(
            (a, b) =>
                getMinPrice(a) -
                getMinPrice(b)
        );

    }

    else if (sortVal === 'priceDesc') {

        filtered.sort(
            (a, b) =>
                getMinPrice(b) -
                getMinPrice(a)
        );

    }

    else {

        /* =========================
           MỚI NHẤT
        ========================= */

        filtered.sort((a, b) => {

            const dateA =
                new Date(
                    a.NgayBan ||
                    a.createdAt ||
                    a.created_at ||
                    0
                );


            const dateB =
                new Date(
                    b.NgayBan ||
                    b.createdAt ||
                    b.created_at ||
                    0
                );


            return dateB - dateA;

        });

    }


    /* =====================================================
       EMPTY
    ===================================================== */

    if (filtered.length === 0) {

        grid.innerHTML = `

            <div
                class="empty-state"
                style="grid-column:1/-1;"
            >

                <div class="empty-state-icon">

                    <i
                        class="fa-solid fa-cake-candles"
                    ></i>

                </div>


                <h3>
                    Không tìm thấy bánh phù hợp
                </h3>


                <p>
                    Thử thay đổi từ khóa,
                    danh mục hoặc khoảng giá.
                </p>


                <button
                    type="button"
                    class="empty-reset-btn"
                    onclick="resetFilters()"
                >
                    Xóa bộ lọc
                </button>

            </div>

        `;


        renderPagination(0);

        return;

    }


    /* =====================================================
       PAGINATION CALCULATION
    ===================================================== */

    const totalProducts =
        filtered.length;


    const totalPages =
        Math.ceil(
            totalProducts /
            PRODUCTS_PER_PAGE
        );


    /* =====================================================
       ĐẢM BẢO CURRENT PAGE HỢP LỆ
    ===================================================== */

    if (currentPage > totalPages) {

        currentPage =
            totalPages;

    }


    if (currentPage < 1) {

        currentPage = 1;

    }


    /* =====================================================
       SLICE CURRENT PAGE
    ===================================================== */

    const startIndex =
        (currentPage - 1) *
        PRODUCTS_PER_PAGE;


    const endIndex =
        startIndex +
        PRODUCTS_PER_PAGE;


    const currentProducts =
        filtered.slice(
            startIndex,
            endIndex
        );


    /* =====================================================
       RENDER PRODUCTS
    ===================================================== */

    grid.innerHTML =
        currentProducts
            .map(
                (product, index) =>
                    renderMenuCard(
                        product,
                        startIndex + index
                    )
            )
            .join('');


    /* =====================================================
       EVENTS
    ===================================================== */

    attachMenuCardEvents();


    /* =====================================================
       RENDER PAGINATION
    ===================================================== */

    renderPagination(
        totalPages
    );

}


/* =========================================================
   RENDER PAGINATION
========================================================= */

function renderPagination(totalPages) {

    const pagination =
        document.getElementById(
            'productPagination'
        );

    if (!pagination) return;


    /* =========================
       KHÔNG CẦN PHÂN TRANG
    ========================= */

    if (totalPages <= 1) {

        pagination.innerHTML = '';

        pagination.style.display =
            'none';

        return;

    }


    pagination.style.display =
        'flex';


    let html = '';


    /* =====================================================
       PREVIOUS
    ===================================================== */

    html += `

        <button
            type="button"
            class="pagination-btn pagination-prev"
            ${
                currentPage === 1
                    ? 'disabled'
                    : ''
            }
            data-page="${currentPage - 1}"
            aria-label="Trang trước"
        >
            <i class="fa-solid fa-chevron-left"></i>
        </button>

    `;


    /* =====================================================
       PAGE NUMBERS
    ===================================================== */

    const pages =
        getPaginationPages(
            currentPage,
            totalPages
        );


    pages.forEach(page => {

        if (page === '...') {

            html += `

                <span
                    class="pagination-dots"
                >
                    ...
                </span>

            `;

            return;

        }


        html += `

            <button
                type="button"
                class="pagination-btn ${
                    page === currentPage
                        ? 'active'
                        : ''
                }"
                data-page="${page}"
                aria-label="Trang ${page}"
                ${
                    page === currentPage
                        ? 'aria-current="page"'
                        : ''
                }
            >
                ${page}
            </button>

        `;

    });


    /* =====================================================
       NEXT
    ===================================================== */

    html += `

        <button
            type="button"
            class="pagination-btn pagination-next"
            ${
                currentPage === totalPages
                    ? 'disabled'
                    : ''
            }
            data-page="${currentPage + 1}"
            aria-label="Trang sau"
        >
            <i class="fa-solid fa-chevron-right"></i>
        </button>

    `;


    pagination.innerHTML =
        html;


    /* =====================================================
       EVENTS
    ===================================================== */

    pagination
        .querySelectorAll(
            '.pagination-btn'
        )
        .forEach(button => {

            button.addEventListener(
                'click',
                () => {

                    if (
                        button.disabled
                    ) {
                        return;
                    }


                    const page =
                        Number(
                            button.dataset.page
                        );


                    if (
                        !page ||
                        page === currentPage
                    ) {
                        return;
                    }


                    currentPage =
                        page;


                    applyFilters();


                    /* =====================
                       CUỘN VỀ KHU VỰC
                       SẢN PHẨM
                    ===================== */

                    const productsSection =
                        document.querySelector(
                            '.products-section'
                        );


                    if (
                        productsSection
                    ) {

                        productsSection.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });

                    }

                    else {

                        window.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                        });

                    }

                }
            );

        });

}


/* =========================================================
   GET PAGINATION PAGES
========================================================= */

function getPaginationPages(
    current,
    total
) {

    /* Nếu ít trang */

    if (total <= 7) {

        return Array.from(
            {
                length: total
            },
            (_, index) =>
                index + 1
        );

    }


    const pages = [];


    /* =========================
       TRANG ĐẦU
    ========================= */

    pages.push(1);


    /* =====================================================
       KHOẢNG GIỮA
    ===================================================== */

    if (current > 4) {

        pages.push('...');

    }


    /* =====================================================
       CÁC TRANG XUNG QUANH
    ===================================================== */

    const start =
        Math.max(
            2,
            current - 1
        );


    const end =
        Math.min(
            total - 1,
            current + 1
        );


    for (
        let i = start;
        i <= end;
        i++
    ) {

        pages.push(i);

    }


    /* =========================
       DẤU ...
    ========================= */

    if (current < total - 3) {

        pages.push('...');

    }


    /* =========================
       TRANG CUỐI
    ========================= */

    pages.push(total);


    return pages;

}


/* =========================================================
   GET MIN PRICE
========================================================= */

function getMinPrice(product) {

    /* =====================================================
       KÍCH THƯỚC
    ===================================================== */

    if (
        Array.isArray(
            product.KichThuoc
        ) &&
        product.KichThuoc.length > 0
    ) {

        const prices =
            product.KichThuoc
                .map(size =>
                    parseInt(
                        size.Gia ||
                        size.price ||
                        0
                    )
                )
                .filter(
                    price =>
                        price > 0
                );


        if (
            prices.length > 0
        ) {

            return Math.min(
                ...prices
            );

        }

    }


    /* =====================================================
       GIÁ TRỰC TIẾP
    ===================================================== */

    return parseInt(
        product.Gia ||
        product.price ||
        0
    );

}


/* =========================================================
   RENDER PRODUCT CARD
========================================================= */

function renderMenuCard(
    product,
    index = 0
) {

    /* =========================
       MÃ SẢN PHẨM
    ========================= */

    const maSP =
        product.MaSP ||
        product._id ||
        `BK0${index + 1}`;


    /* =========================
       TÊN SẢN PHẨM
    ========================= */

    const tenSP =
        product.TenSP ||
        product.name ||
        product.tenSP ||
        'Bánh ngọt Little Prince';


    /* =========================
       MÔ TẢ
    ========================= */

    const moTa =
        product.MoTa ||
        product.description ||
        'Hương vị ngọt ngào chế tác thủ công.';


    /* =========================
       HÌNH ẢNH
    ========================= */

    const imgUrl =
        resolveImageUrl(
            product.HinhAnh,
            index
        );


    /* =========================
       GIÁ
    ========================= */

    const price =
        getMinPrice(product);


    /* =========================
       LIKE
    ========================= */

    const liked =
        isLiked(maSP);


    /* =========================
       TRẠNG THÁI
    ========================= */

    const status =
        product.TrangThai ||
        product.status ||
        'Đang bán';


    /* =========================
       FALLBACK IMAGE
    ========================= */

    const fallbackImage =
        DEFAULT_CAKE_IMAGES[
            index %
            DEFAULT_CAKE_IMAGES.length
        ];


    return `

        <article
            class="product-card"
            data-masp="${maSP}"
        >

            <!-- ================= IMAGE ================= -->

            <div
                class="product-image-wrap"
                onclick="
                    window.location.href=
                    '../details_cake/details.html?MaSP=${maSP}'
                "
            >

                <img
                    src="${imgUrl}"
                    alt="${tenSP}"
                    loading="lazy"
                    onerror="
                        this.onerror=null;
                        this.src='${fallbackImage}'
                    "
                >


                <span class="product-tag">
                    ${status}
                </span>


                <button
                    type="button"
                    class="btn-like-heart ${
                        liked
                            ? 'liked'
                            : ''
                    }"
                    data-masp="${maSP}"
                    title="Lưu yêu thích"
                    aria-label="Yêu thích"
                >

                    <i class="${
                        liked
                            ? 'fa-solid fa-heart'
                            : 'fa-regular fa-heart'
                    }"></i>

                </button>

            </div>


            <!-- ================= CONTENT ================= -->

            <div class="product-content">

                <h3
                    class="product-title"
                    onclick="
                        window.location.href=
                        '../details_cake/details.html?MaSP=${maSP}'
                    "
                >
                    ${tenSP}
                </h3>


                <p class="product-desc">
                    ${moTa}
                </p>


                <div class="product-footer">

                    <span class="product-price">
                        ${formatVND(price)}
                    </span>


                    <button
                        type="button"
                        class="btn-add-cart"
                        data-masp="${maSP}"
                        title="Thêm vào giỏ"
                        aria-label="Thêm vào giỏ"
                    >

                        <i
                            class="fa-solid fa-bag-shopping"
                        ></i>

                    </button>

                </div>

            </div>

        </article>

    `;

}


/* =========================================================
   PRODUCT CARD EVENTS
========================================================= */

function attachMenuCardEvents() {


    /* =====================================================
       LIKE
    ===================================================== */

    document
        .querySelectorAll(
            '.btn-like-heart'
        )
        .forEach(button => {

            button.onclick =
                (event) => {

                    event.stopPropagation();


                    const maSP =
                        button.dataset.masp;


                    const nowLiked =
                        toggleLike(
                            maSP
                        );


                    button.classList.toggle(
                        'liked',
                        nowLiked
                    );


                    button.innerHTML =
                        nowLiked

                            ? `
                                <i
                                    class="fa-solid fa-heart"
                                ></i>
                            `

                            : `
                                <i
                                    class="fa-regular fa-heart"
                                ></i>
                            `;

                };

        });


    /* =====================================================
       CART
    ===================================================== */

    document
        .querySelectorAll(
            '.btn-add-cart'
        )
        .forEach(button => {

            button.onclick =
                (event) => {

                    event.stopPropagation();


                    const maSP =
                        button.dataset.masp;


                    const product =
                        allProducts.find(
                            product => {

                                const productId =
                                    product.MaSP ||
                                    product._id;


                                return (
                                    String(
                                        productId
                                    ) ===
                                    String(
                                        maSP
                                    )
                                );

                            }
                        );


                    if (product) {

                        addToCart(
                            product
                        );

                    }

                };

        });

}


/* =========================================================
   RESET FILTERS
========================================================= */

function resetFilters() {

    /* =========================
       PAGE
    ========================= */

    currentPage = 1;


    /* =========================
       CATEGORY
    ========================= */

    activeMaDM = 'all';


    /* =========================
       SEARCH
    ========================= */

    const searchInput =
        document.getElementById(
            'searchInput'
        );

    if (searchInput) {

        searchInput.value = '';

    }


    /* =========================
       CATEGORY SELECT
    ========================= */

    const categorySelect =
        document.getElementById(
            'categorySelect'
        );

    if (categorySelect) {

        categorySelect.value =
            'all';

    }


    /* =========================
       PRICE
    ========================= */

    const priceSelect =
        document.getElementById(
            'priceRangeSelect'
        );

    if (priceSelect) {

        priceSelect.value =
            'all';

    }


    /* =========================
       PRICE RADIO
    ========================= */

    const radioAll =
        document.querySelector(
            'input[name="priceFilter"][value="all"]'
        );

    if (radioAll) {

        radioAll.checked =
            true;

    }


    /* =========================
       SORT
    ========================= */

    const sortSelect =
        document.getElementById(
            'sortSelect'
        );

    if (sortSelect) {

        sortSelect.value =
            'newest';

    }


    syncCategoryTabs();

    syncPriceRadio();

    applyFilters();

}


/* =========================================================
   FALLBACK CATEGORIES
========================================================= */

function getFallbackCategories() {

    return [

        {
            MaDM: 'DM01',
            TenDM: 'Bánh Kem Sinh Nhật'
        },

        {
            MaDM: 'DM02',
            TenDM: 'Bánh Mousse'
        },

        {
            MaDM: 'DM03',
            TenDM: 'Bánh Quy Thủ Công'
        },

        {
            MaDM: 'DM04',
            TenDM: 'Bánh Su Kem & Tart'
        },

        {
            MaDM: 'DM05',
            TenDM: 'Bánh Mì Ngọt'
        },

        {
            MaDM: 'DM06',
            TenDM: 'Trà & Cà Phê'
        }

    ];

}


/* =========================================================
   FALLBACK PRODUCTS
========================================================= */

function getFallbackProducts() {

    return [

        {
            MaSP: 'BK01',

            TenSP:
                'Strawberry Shortcake',

            MoTa:
                'Cốt bánh chiffon Nhật Bản tơi xốp, kem tươi whipping cream cùng dâu tây tươi mọng.',

            HinhAnh: [
                'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80'
            ],

            KichThuoc: [
                {
                    Ten: 'Nhỏ',
                    Gia: 180000
                },
                {
                    Ten: 'Trung',
                    Gia: 320000
                },
                {
                    Ten: 'Lớn',
                    Gia: 450000
                }
            ],

            TrangThai:
                'Đang bán',

            MaDM:
                'DM01',

            NgayBan:
                '2026-09-20'
        },


        {
            MaSP: 'BK02',

            TenSP:
                'Classic Tiramisu',

            MoTa:
                'Sự kết hợp hoàn hảo giữa cà phê espresso đậm đà, phô mai mascarpone béo ngậy.',

            HinhAnh: [
                'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80'
            ],

            KichThuoc: [
                {
                    Ten: 'Nhỏ',
                    Gia: 165000
                },
                {
                    Ten: 'Trung',
                    Gia: 290000
                }
            ],

            TrangThai:
                'Đang bán',

            MaDM:
                'DM02',

            NgayBan:
                '2026-09-19'
        },


        {
            MaSP: 'BK03',

            TenSP:
                'Matcha Chiffon Cake',

            MoTa:
                'Bột trà xanh Matcha Uji Nhật Bản thượng hạng mang vị đắng nhẹ, mềm xốp.',

            HinhAnh: [
                'https://images.unsplash.com/photo-1623689046286-01d4b7a2d8f3?auto=format&fit=crop&w=800&q=80'
            ],

            KichThuoc: [
                {
                    Ten: 'Nhỏ',
                    Gia: 150000
                },
                {
                    Ten: 'Trung',
                    Gia: 270000
                }
            ],

            TrangThai:
                'Đang bán',

            MaDM:
                'DM01',

            NgayBan:
                '2026-09-18'
        },


        {
            MaSP: 'BK04',

            TenSP:
                'Fresh Fruit Tart',

            MoTa:
                'Đế tart bơ nướng giòn rụm, nhân kem custard béo nhẹ cùng việt quất và mâm xôi.',

            HinhAnh: [
                'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=800&q=80'
            ],

            KichThuoc: [
                {
                    Ten: 'Nhỏ',
                    Gia: 175000
                }
            ],

            TrangThai:
                'Đang bán',

            MaDM:
                'DM04',

            NgayBan:
                '2026-09-17'
        },


        {
            MaSP: 'BK05',

            TenSP:
                'Croissant Bơ Pháp Isigny',

            MoTa:
                'Cán 36 lớp với bơ Isigny AOP Pháp, giòn xốp thơm lừng mẻ nướng sáng sớm.',

            HinhAnh: [
                'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80'
            ],

            KichThuoc: [
                {
                    Ten: 'Nhỏ',
                    Gia: 45000
                }
            ],

            TrangThai:
                'Đang bán',

            MaDM:
                'DM05',

            NgayBan:
                '2026-09-16'
        },


        {
            MaSP: 'BK06',

            TenSP:
                'Bánh Su Kem Vani Madagascar',

            MoTa:
                'Vỏ choux giòn rụm nhân kem tươi vani Bourbon nồng nàn.',

            HinhAnh: [
                'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'
            ],

            KichThuoc: [
                {
                    Ten: 'Nhỏ',
                    Gia: 65000
                }
            ],

            TrangThai:
                'Đang bán',

            MaDM:
                'DM04',

            NgayBan:
                '2026-09-15'
        }

    ];

}