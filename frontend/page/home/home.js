document.addEventListener("DOMContentLoaded", async () => {
    // Initialize Header Navigation
    setupHeader('home');

    // Year footer
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // 1. Load Featured Categories from API
    loadFeaturedCategories();

    // 2. Load Featured Products from API
    loadFeaturedProducts();

    // Newsletter Form
    const newsletterForm = document.getElementById("newsletterForm");
    if (newsletterForm) {
        newsletterForm.addEventListener("submit", event => {
            event.preventDefault();
            showToast("Cảm ơn bạn đã đăng ký nhận tin từ Little Prince! ♥", "success");
            newsletterForm.reset();
        });
    }
});

const CATEGORY_ICONS = [
    'fa-solid fa-cake-candles',
    'fa-solid fa-bread-slice',
    'fa-solid fa-cookie-bite',
    'fa-solid fa-ice-cream',
    'fa-solid fa-mug-hot',
    'fa-solid fa-gift'
];

async function loadFeaturedCategories() {
    const container = document.getElementById('categoryContainer');
    if (!container) return;

    try {
        // Lấy danh mục và sản phẩm từ MongoDB thông qua API
        const [categoryRes, productRes] = await Promise.all([
            fetchApi('/categories'),
            fetchApi('/products')
        ]);

        const categories = Array.isArray(categoryRes)
            ? categoryRes
            : (categoryRes && Array.isArray(categoryRes.data)
                ? categoryRes.data
                : []);

        const products = Array.isArray(productRes)
            ? productRes
            : (productRes && Array.isArray(productRes.data)
                ? productRes.data
                : []);

        if (categories.length === 0) {
            console.warn('No categories returned from API');
            return;
        }

        // Chỉ lấy 6 danh mục đầu tiên
        const featuredCategories = categories.slice(0, 6);

        container.innerHTML = featuredCategories.map((cat, index) => {

            const icon = CATEGORY_ICONS[index];

            const maDM = cat.MaDM || cat._id || '';
            const tenDM = cat.TenDM || cat.name || 'Danh mục';

            // Đếm số sản phẩm thuộc danh mục này
            const count = products.filter(product => {
                const productMaDM =
                    product.MaDM ||
                    product.maDM ||
                    product.MaDanhMuc ||
                    product.maDanhMuc;

                return String(productMaDM) === String(maDM);
            }).length;

            return `
                <a class="category-card"
                   href="../menu/menu.html?MaDM=${encodeURIComponent(maDM)}">

                    <div class="category-icon">
                        <i class="${icon}"></i>
                    </div>

                    <strong>${tenDM}</strong>

                    <small>${count} sản phẩm</small>

                </a>
            `;
        }).join('');

    } catch (error) {
        console.warn(
            'API error categories/products, using fallback',
            error
        );

        renderFallbackCategories(container);
    }
}


function renderFallbackCategories(container) {
    const fallbackCats = [
        { MaDM: 'DM01', TenDM: 'Bánh Kem Sinh Nhật', count: '12 loại' },
        { MaDM: 'DM02', TenDM: 'Bánh Mousse', count: '8 loại' },
        { MaDM: 'DM03', TenDM: 'Bánh Quy Thủ Công', count: '18 loại' },
        { MaDM: 'DM04', TenDM: 'Bánh Su Kem & Tart', count: '10 loại' },
        { MaDM: 'DM05', TenDM: 'Bánh Mì Ngọt', count: '6 sản phẩm' },
        { MaDM: 'DM06', TenDM: 'Trà & Cà Phê', count: '10 loại' }
    ];
    container.innerHTML = fallbackCats.map((cat, index) => `
        <a class="category-card" href="../menu/menu.html?MaDM=${cat.MaDM}">
            <div class="category-icon">${CATEGORY_ICONS[index]}</div>
            <strong>${cat.TenDM}</strong>
            <small>${cat.count}</small>
        </a>
    `).join('');
}

async function loadFeaturedProducts() {
    const container = document.getElementById('productContainer');
    if (!container) return;

    try {
        const res = await fetchApi('/products');
        const products = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : []);
        
        if (!Array.isArray(products) || products.length === 0) {
            console.warn('No products returned from API');
            return;
        }

        const featuredList = products.slice(0, 8);
        container.innerHTML = featuredList.map((product, index) => renderProductCard(product, index)).join('');
        attachProductCardEvents();

    } catch (error) {
        console.warn('API error products, using sample product items', error);
        renderFallbackProducts(container);
    }
}

function renderFallbackProducts(container) {
    const fallbackProducts = [
        {
            MaSP: 'BK01',
            TenSP: 'Strawberry Shortcake',
            MoTa: 'Cốt bánh chiffon Nhật Bản tơi xốp, kem tươi whipping cream cùng dâu tây tươi mọng.',
            HinhAnh: ['https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80'],
            KichThuoc: [{ Ten: 'Nhỏ', Gia: 180000 }],
            TrangThai: 'Đang bán'
        },
        {
            MaSP: 'BK02',
            TenSP: 'Classic Tiramisu',
            MoTa: 'Sự kết hợp hoàn hảo giữa cà phê espresso đậm đà, phô mai mascarpone béo ngậy.',
            HinhAnh: ['https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80'],
            KichThuoc: [{ Ten: 'Nhỏ', Gia: 165000 }],
            TrangThai: 'Đang bán'
        },
        {
            MaSP: 'BK03',
            TenSP: 'Matcha Chiffon Cake',
            MoTa: 'Bột trà xanh Matcha Uji Nhật Bản thượng hạng mang vị đắng nhẹ, mềm xốp.',
            HinhAnh: ['https://images.unsplash.com/photo-1623689046286-01d4b7a2d8f3?auto=format&fit=crop&w=800&q=80'],
            KichThuoc: [{ Ten: 'Nhỏ', Gia: 150000 }],
            TrangThai: 'Đang bán'
        },
        {
            MaSP: 'BK04',
            TenSP: 'Fresh Fruit Tart',
            MoTa: 'Đế tart bơ nướng giòn rụm, nhân kem custard béo nhẹ cùng việt quất và mâm xôi.',
            HinhAnh: ['https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=800&q=80'],
            KichThuoc: [{ Ten: 'Nhỏ', Gia: 175000 }],
            TrangThai: 'Đang bán'
        }
    ];

    container.innerHTML = fallbackProducts.map((p, idx) => renderProductCard(p, idx)).join('');
    attachProductCardEvents();
}

function renderProductCard(product, index = 0) {
    const maSP = product.MaSP || product._id || `BK0${index + 1}`;
    const tenSP = product.TenSP || 'Bánh ngọt Little Prince';
    const moTa = product.MoTa || 'Hương vị ngọt ngào chế tác thủ công mỗi sáng.';
    const imgUrl = resolveImageUrl(product.HinhAnh, index);
    
    let price = 0;
    if (Array.isArray(product.KichThuoc) && product.KichThuoc.length > 0) {
        price = product.KichThuoc[0].Gia || 0;
    } else if (product.Gia) {
        price = product.Gia;
    }

    const liked = isLiked(maSP);
    const tag = product.TrangThai || (index === 0 ? 'Bán chạy nhất' : index === 1 ? 'Mới ra mắt' : 'Yêu thích');

    return `
        <article class="product-card" data-masp="${maSP}">
            <div class="product-image-wrap" onclick="window.location.href='../details_cake/details.html?MaSP=${maSP}'" style="cursor:pointer;">
                <img src="${imgUrl}" alt="${tenSP}" onerror="this.src='${DEFAULT_CAKE_IMAGES[index % DEFAULT_CAKE_IMAGES.length]}'">
                <span class="product-tag">${tag}</span>
                <button class="btn-like-heart ${liked ? 'liked' : ''}" data-masp="${maSP}" title="Lưu yêu thích">
                    ${liked ? '♥' : '♡'}
                </button>
            </div>
            <div class="product-content">
                <h3 class="product-title" onclick="window.location.href='../details_cake/details.html?MaSP=${maSP}'" style="cursor:pointer;">${tenSP}</h3>
                
                <div class="product-footer">
                    <span class="product-price">${formatVND(price)}</span>
                    <button class="btn-add-cart" data-masp="${maSP}" title="Thêm vào giỏ hàng"><i class="fa-solid fa-bag-shopping"></i></button>
                </div>
            </div>
        </article>
    `;
}

function attachProductCardEvents() {
    document.querySelectorAll('.btn-like-heart').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const maSP = btn.dataset.masp;
            const nowLiked = toggleLike(maSP);
            if (nowLiked) {
                btn.classList.add('liked');
                btn.textContent = '♥';
            } else {
                btn.classList.remove('liked');
                btn.textContent = '♡';
            }
        };
    });

    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const maSP = btn.dataset.masp;
            
            try {
                const product = await fetchApi(`/products/${maSP}`);
                addToCart(product);
            } catch (err) {
                const card = btn.closest('.product-card');
                const title = card.querySelector('.product-title').textContent;
                const priceText = card.querySelector('.product-price').textContent;
                const rawPrice = parseInt(priceText.replace(/\D/g, '')) || 100000;
                const img = card.querySelector('img').src;

                addToCart({
                    MaSP: maSP,
                    TenSP: title,
                    HinhAnh: [img],
                    KichThuoc: [{ Ten: 'Nhỏ', Gia: rawPrice }]
                });
            }
        };
    });
}
