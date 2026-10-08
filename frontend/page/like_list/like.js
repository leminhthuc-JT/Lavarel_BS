document.addEventListener('DOMContentLoaded', async () => {
    setupHeader('like');
    await loadLikedProducts();
});

async function loadLikedProducts() {
    const grid = document.getElementById('likeGrid');
    const likes = getLikes();

    if (!likes || likes.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon"><i class="fa-regular fa-heart"></i></div>
                <h3>Bạn chưa có sản phẩm yêu thích</h3>
                <p>Hãy bấm vào biểu tượng trái tim ở các sản phẩm để lưu lại chiếc bánh bạn yêu thích nhé!</p>
                <a href="../menu/menu.html" class="btn btn-primary">Khám phá thực đơn <span>→</span></a>
            </div>
        `;
        return;
    }

    try {
        let allProducts = [];
        try {
            const res = await fetchApi('/products');
            allProducts = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            allProducts = [];
        }

        const likedProducts = likes.map(maSP => {
            const found = Array.isArray(allProducts) ? allProducts.find(p => (p.MaSP || p._id) === maSP) : null;
            return found || {
                MaSP: maSP,
                TenSP: 'Strawberry Shortcake',
                MoTa: 'Cốt bánh chiffon Nhật Bản tơi xốp, kem tươi whipping cream cùng dâu tây tươi mọng.',
                HinhAnh: ['https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80'],
                KichThuoc: [{ Ten: 'Nhỏ', Gia: 180000 }],
                TrangThai: 'Đang bán'
            };
        });

        grid.innerHTML = likedProducts.map((product, idx) => renderLikedCard(product, idx)).join('');
        attachLikedCardEvents();

    } catch (err) {
        grid.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><p>Có lỗi khi tải danh sách yêu thích.</p></div>`;
    }
}

function renderLikedCard(product, index) {
    const maSP = product.MaSP || product._id || `BK0${index + 1}`;
    const tenSP = product.TenSP || 'Bánh ngọt Little Prince';
    const moTa = product.MoTa || 'Hương vị ngọt ngào chế tác thủ công.';
    const imgUrl = resolveImageUrl(product.HinhAnh, index);
    const price = Array.isArray(product.KichThuoc) && product.KichThuoc.length > 0 ? product.KichThuoc[0].Gia : (product.Gia || 100000);
    const status = product.TrangThai || 'Đang bán';

    return `
        <article class="product-card" data-masp="${maSP}">
            <div class="product-image-wrap" onclick="window.location.href='../details_cake/details.html?MaSP=${maSP}'" style="cursor:pointer;">
                <img src="${imgUrl}" alt="${tenSP}" onerror="this.src='${DEFAULT_CAKE_IMAGES[index % DEFAULT_CAKE_IMAGES.length]}'">
                <span class="product-tag">${status}</span>
                <button class="btn-like-heart liked" data-masp="${maSP}" title="Bỏ yêu thích"><i class="fa-solid fa-heart"></i></button>
            </div>
            <div class="product-content">
                <h3 class="product-title" onclick="window.location.href='../details_cake/details.html?MaSP=${maSP}'" style="cursor:pointer;">${tenSP}</h3>
                <p class="product-desc">${moTa}</p>
                <div class="product-footer">
                    <span class="product-price">${formatVND(price)}</span>
                    <div class="product-actions-group">
                        <button class="btn btn-outline btn-sm" onclick="window.location.href='../details_cake/details.html?MaSP=${maSP}'">Xem</button>
                        <button class="btn-add-cart" data-masp="${maSP}" title="Thêm vào giỏ"><i class="fa-solid fa-cart-plus"></i></button>
                    </div>
                </div>
            </div>
        </article>
    `;
}

function attachLikedCardEvents() {
    document.querySelectorAll('.btn-like-heart').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const maSP = btn.dataset.masp;
            toggleLike(maSP);
            loadLikedProducts();
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
                addToCart({ MaSP: maSP, TenSP: title, KichThuoc: [{ Ten: 'Nhỏ', Gia: rawPrice }] });
            }
        };
    });
}
