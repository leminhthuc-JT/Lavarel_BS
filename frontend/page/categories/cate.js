document.addEventListener('DOMContentLoaded', async () => {
    if (typeof setupHeader === 'function') {
        setupHeader('categories');
    }

    await loadCategoriesPage();
});


/* =========================================================
   CATEGORY ICONS
========================================================= */

const CATE_ICONS = {
    DM01: 'fa-solid fa-cake-candles',
    DM02: 'fa-solid fa-cake-candles',
    DM03: 'fa-solid fa-layer-group',
    DM04: 'fa-solid fa-mug-hot',
    DM05: 'fa-solid fa-bread-slice',
    DM06: 'fa-solid fa-cake-candles',
    DM07: 'fa-solid fa-cookie-bite',
    DM08: 'fa-solid fa-circle-dot',
    DM09: 'fa-solid fa-cookie',
    DM10: 'fa-solid fa-bread-slice',
    DM11: 'fa-solid fa-bread-slice',
    DM12: 'fa-solid fa-cheese',
    DM13: 'fa-solid fa-apple-whole',
    DM14: 'fa-solid fa-box-archive',
    DM15: 'fa-solid fa-utensils',
    DM16: 'fa-solid fa-moon',
    DM17: 'fa-solid fa-snowflake',
    DM18: 'fa-solid fa-leaf',
    DM19: 'fa-solid fa-glass-water',
    DM20: 'fa-solid fa-whiskey-glass'
};


/* =========================================================
   CATEGORY IMAGES
========================================================= */

const CATE_IMAGES = {
    DM01: '../../assets/bk01_1.png',
    DM02: '../../assets/bsn01_1.png',
    DM03: '../../assets/bm01_1.png',
    DM04: '../../assets/bt01_1.png',
    DM05: '../../assets/bbl01_1.png',
    DM06: '../../assets/bc01_1.png',
    DM07: '../../assets/bsk01_1.png',
    DM08: '../../assets/bd01_1.png',
    DM09: '../../assets/bq01_1.png',
    DM10: '../../assets/bmn01_1.png',
    DM11: '../../assets/bmm01_1.png',
    DM12: '../../assets/bpm01_1.png',
    DM13: '../../assets/btc02_1.png',
    DM14: '../../assets/bch01_1.png',
    DM15: '../../assets/btt01_1.png',
    DM16: '../../assets/bttt01_1.png',
    DM17: '../../assets/bl01_1.png',
    DM18: '../../assets/bkd01_1.png',
    DM19: '../../assets/ntc01_1.png',
    DM20: '../../assets/s01_1.png'
};


/* =========================================================
   LOAD CATEGORIES
========================================================= */

async function loadCategoriesPage() {

    const grid = document.getElementById('categoryGrid');

    if (!grid) return;

    let categories = [];

    try {

        const res = await fetchApi('/categories');

        categories = Array.isArray(res)
            ? res
            : (
                res && Array.isArray(res.data)
                    ? res.data
                    : []
            );

        if (!categories.length) {
            console.warn('API không trả về danh mục.');
            categories = getFallbackCategories();
        }

    } catch (error) {

        console.warn(
            'Không thể tải danh mục từ API. Sử dụng dữ liệu mặc định.',
            error
        );

        categories = getFallbackCategories();
    }


    /* =====================================================
       RENDER
    ===================================================== */

    grid.innerHTML = categories.map((cat, index) => {

        const maDM =
            cat.MaDM ||
            cat._id ||
            `DM${String(index + 1).padStart(2, '0')}`;


        const tenDM =
            cat.TenDM ||
            cat.name ||
            'Danh mục bánh';


        const moTa =
            cat.MoTa ||
            cat.description ||
            'Những sản phẩm bánh được làm mới mỗi ngày.';


        const icon =
            CATE_ICONS[maDM] ||
            'fa-solid fa-cake-candles';


        const image =
            cat.HinhAnh ||
            cat.image ||
            cat.image_url ||
            CATE_IMAGES[maDM] ||
            '../../assets/categories/default.jpg';


        return `
            <a
                href="../menu/menu.html?MaDM=${encodeURIComponent(maDM)}"
                class="cate-box"
            >

                <!-- IMAGE -->
                <div class="cate-image">

                    <img
                        src="${image}"
                        alt="${tenDM}"
                        loading="lazy"
                        onerror="this.onerror=null; this.src='../../assets/categories/default.jpg';"
                    >

                    <span class="cate-box-code">
                        ${maDM}
                    </span>

                </div>


                <!-- CONTENT -->
                <div class="cate-content">

                    <div class="cate-box-icon">
                        <i class="${icon}"></i>
                    </div>

                    <h3>${tenDM}</h3>

                    <p>${moTa}</p>

                    <div class="cate-box-action">
                        <span>Xem danh sách bánh</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    </div>

                </div>

            </a>
        `;

    }).join('');
}


/* =========================================================
   FALLBACK DATA
========================================================= */

function getFallbackCategories() {

    return [

        {
            MaDM: 'DM01',
            TenDM: 'Bánh Kem Sinh Nhật',
            MoTa: 'Bánh kem mềm mịn, trang trí tinh tế cho những dịp đặc biệt.'
        },

        {
            MaDM: 'DM02',
            TenDM: 'Bánh Mousse',
            MoTa: 'Mousse mềm mượt với hương vị nhẹ nhàng và thanh thoát.'
        },

        {
            MaDM: 'DM03',
            TenDM: 'Bánh Quy Thủ Công',
            MoTa: 'Bánh quy bơ thơm giòn, nướng thủ công mỗi ngày.'
        },

        {
            MaDM: 'DM04',
            TenDM: 'Bánh Su Kem & Tart',
            MoTa: 'Su kem béo mịn cùng tart trái cây tươi ngon.'
        },

        {
            MaDM: 'DM05',
            TenDM: 'Bánh Mì Ngọt',
            MoTa: 'Bánh mì mềm thơm, lớp bơ vàng và hương vị dịu nhẹ.'
        },

        {
            MaDM: 'DM06',
            TenDM: 'Trà Hoa & Cà Phê',
            MoTa: 'Những thức uống nhẹ nhàng dùng cùng bánh ngọt.'
        },

        {
            MaDM: 'DM07',
            TenDM: 'Bánh Su Kem',
            MoTa: 'Vỏ bánh nhẹ xốp, nhân kem mềm mịn.'
        },

        {
            MaDM: 'DM08',
            TenDM: 'Bánh Donut',
            MoTa: 'Donut mềm xốp với nhiều lớp phủ hấp dẫn.'
        },

        {
            MaDM: 'DM09',
            TenDM: 'Bánh Quy',
            MoTa: 'Bánh quy giòn thơm với vị bơ đặc trưng.'
        },

        {
            MaDM: 'DM10',
            TenDM: 'Bánh Mì Ngọt',
            MoTa: 'Bánh mì ngọt mềm thơm cho bữa sáng nhẹ nhàng.'
        },

        {
            MaDM: 'DM11',
            TenDM: 'Bánh Mì Mặn',
            MoTa: 'Bánh mì mặn thơm ngon với nhân phong phú.'
        },

        {
            MaDM: 'DM12',
            TenDM: 'Bánh Phô Mai',
            MoTa: 'Hương phô mai béo nhẹ, mềm mịn và thơm ngon.'
        },

        {
            MaDM: 'DM13',
            TenDM: 'Bánh Trái Cây',
            MoTa: 'Bánh kết hợp trái cây tươi theo mùa.'
        },

        {
            MaDM: 'DM14',
            TenDM: 'Bánh Chocolate',
            MoTa: 'Chocolate đậm đà dành cho những ai yêu vị cacao.'
        },

        {
            MaDM: 'DM15',
            TenDM: 'Bánh Truyền Thống',
            MoTa: 'Những hương vị quen thuộc được làm mới tinh tế.'
        },

        {
            MaDM: 'DM16',
            TenDM: 'Bánh Trung Thu',
            MoTa: 'Bánh trung thu thơm ngon cho mùa đoàn viên.'
        },

        {
            MaDM: 'DM17',
            TenDM: 'Bánh Lạnh',
            MoTa: 'Bánh mát lạnh, mềm mịn và dễ thưởng thức.'
        },

        {
            MaDM: 'DM18',
            TenDM: 'Bánh Không Đường',
            MoTa: 'Lựa chọn nhẹ nhàng với hương vị tự nhiên.'
        },

        {
            MaDM: 'DM19',
            TenDM: 'Nước Trái Cây',
            MoTa: 'Thức uống trái cây tươi mát mỗi ngày.'
        },

        {
            MaDM: 'DM20',
            TenDM: 'Sữa & Đồ Uống',
            MoTa: 'Các loại đồ uống thơm ngon dùng cùng bánh.'
        }

    ];
}