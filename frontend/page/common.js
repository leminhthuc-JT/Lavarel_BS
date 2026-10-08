
/**
 * Common Frontend Script - The Little Prince / Sweet Bakery
 * Provides API client, Session, Cart, Favorites, Header/Footer controls, and UI Helpers.
 */

// ============================================================
// API CONFIGURATION
// ============================================================

// Backend API hiện tại
const API_BASE = 'http://localhost:8080/New/backend/public/api';


// ============================================================
// AUTH SESSION MANAGEMENT
// ============================================================

function getCurrentUser() {
    try {
        const userData =
            localStorage.getItem('user') ||
            sessionStorage.getItem('user');

        return userData
            ? JSON.parse(userData)
            : null;

    } catch (e) {
        console.error('getCurrentUser error:', e);
        return null;
    }
}

function setCurrentUser(user, remember = true) {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');

    if (user) {
        if (remember) {
            localStorage.setItem(
                'user',
                JSON.stringify(user)
            );
        } else {
            sessionStorage.setItem(
                'user',
                JSON.stringify(user)
            );
        }
    }
}

function logoutUser() {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');

    showToast(
        'Đã đăng xuất tài khoản.',
        'success'
    );

    setTimeout(() => {
        window.location.reload();
    }, 500);
}


// ============================================================
// CART STORAGE MANAGEMENT
// ============================================================

function getCartStorageKey() {
    const user = getCurrentUser();

    return user
        ? `sweet_bakery_cart_${user.MaKH || user.id || user._id || user.email}`
        : 'sweet_bakery_cart_guest';
}

let _cartLoadedFromBackend = false;

function getCart() {
    try {
        const data = localStorage.getItem(
            getCartStorageKey()
        );

        return data
            ? JSON.parse(data)
            : [];

    } catch (e) {
        console.error('getCart error:', e);
        return [];
    }
}

/**
 * Tải giỏ hàng từ MongoDB GioHangs về localStorage khi đăng nhập hoặc mở trình duyệt mới
 */
async function loadCartFromBackend() {
    const user = getCurrentUser();
    if (!user) return getCart();

    const maKH = user.MaKH || user.id || user._id || user.email;
    if (!maKH) return getCart();

    try {
        const res = await fetchApi(`/cart?maKH=${encodeURIComponent(maKH)}`);
        const cartDoc = res?.data || res;
        const serverItems = cartDoc?.SanPhams || [];

        if (Array.isArray(serverItems) && serverItems.length > 0) {
            // Chuẩn hóa item từ server về format đầy đủ của frontend
            const formatted = serverItems.map(item => ({
                MaSP: item.MaSP,
                TenSP: item.TenSP || 'Sản phẩm',
                HinhAnh: item.HinhAnh || '',
                TenKichThuoc: item.TenKichThuoc || 'Nhỏ',
                DonGia: Number(item.DonGia || item.Gia || 0),
                SoLuong: Number(item.SoLuong || 1),
                Chon: item.Chon !== false,
                TonKho: Number(item.TonKho || 999)
            }));

            localStorage.setItem(getCartStorageKey(), JSON.stringify(formatted));
            updateCartBadge();
            _cartLoadedFromBackend = true;
            return formatted;
        } else if (!_cartLoadedFromBackend) {
            const localItems = getCart();
            if (localItems.length > 0) {
                syncEntireCartToBackend(localItems);
            }
        }

        _cartLoadedFromBackend = true;
    } catch (err) {
        console.warn('loadCartFromBackend error:', err);
    }

    return getCart();
}

function saveCart(cart) {
    localStorage.setItem(
        getCartStorageKey(),
        JSON.stringify(cart)
    );

    updateCartBadge();

    // Tự động đồng bộ lên collection GioHangs trên database
    syncEntireCartToBackend(cart);
}

/**
 * Đồng bộ toàn bộ giỏ hàng lên collection GioHangs
 */
function syncEntireCartToBackend(cart) {
    const user = getCurrentUser();
    if (!user) return;

    const maKH = user.MaKH || user.id || user._id || user.email;
    if (!maKH) return;

    const payloadCart = (cart || []).map(item => ({
        MaSP:         item.MaSP || item.id || item._id,
        TenSP:        item.TenSP || '',
        HinhAnh:      item.HinhAnh || '',
        TenKichThuoc: item.TenKichThuoc || 'Nhỏ',
        DonGia:       Number(item.DonGia || item.Gia || 0),
        SoLuong:      Number(item.SoLuong) || 1,
        Chon:         item.Chon !== false,
        TonKho:       Number(item.TonKho || 999)
    }));

    fetch(`${API_BASE}/cart/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maKH, cart: payloadCart })
    }).catch(err => {
        console.warn('Không thể đồng bộ giỏ hàng lên server:', err);
    });
}

function addToCart(
    product,
    selectedSize = null,
    quantity = 1
) {
    if (!product) return false;

    const cart = getCart();

    const maSP =
        product.MaSP ||
        product.id ||
        product._id;

    let sizeObj = selectedSize;

    if (
        !sizeObj &&
        Array.isArray(product.KichThuoc) &&
        product.KichThuoc.length > 0
    ) {
        sizeObj = product.KichThuoc[0];
    }

    const sizeName = sizeObj
        ? (
            sizeObj.Ten ||
            sizeObj.name ||
            'Nhỏ'
        )
        : 'Nhỏ';

    const unitPrice = sizeObj
        ? parseInt(
            sizeObj.Gia ||
            sizeObj.price ||
            0
        )
        : parseInt(
            product.Gia || 0
        );

    const maxStock = Number(product.SoLuong ?? 999);

    // Kiểm tra nếu sản phẩm đã hết hàng
    if (maxStock <= 0) {
        showToast(`Rất tiếc, sản phẩm "${product.TenSP || 'Sản phẩm'}" hiện đã hết hàng!`, 'error');
        return false;
    }

    const existingIndex = cart.findIndex(
        item =>
            item.MaSP === maSP &&
            (item.TenKichThuoc || '') === sizeName
    );

    const currentQtyInCart = existingIndex > -1 ? (Number(cart[existingIndex].SoLuong) || 0) : 0;

    // Cơ chế chặn: Không được thêm quá số lượng tồn kho
    if (currentQtyInCart + quantity > maxStock) {
        const canAdd = maxStock - currentQtyInCart;
        if (canAdd <= 0) {
            showToast(
                `Bạn đã có ${currentQtyInCart} sản phẩm "${product.TenSP || 'Sản phẩm'}" (${sizeName}) trong giỏ, đã đạt tối đa số lượng trong kho (${maxStock})!`,
                'error'
            );
        } else {
            showToast(
                `Kho chỉ còn ${maxStock} sản phẩm (trong giỏ đã có ${currentQtyInCart}). Bạn chỉ có thể thêm tối đa ${canAdd} chiếc nữa!`,
                'error'
            );
        }
        return false;
    }

    let cartItem;

    if (existingIndex > -1) {

        cart[existingIndex].SoLuong += quantity;
        cart[existingIndex].TonKho = maxStock;
        cartItem = cart[existingIndex];

    } else {

        cartItem = {
            MaSP: maSP,

            TenSP:
                product.TenSP ||
                product.name ||
                'Bánh ngọt',

            HinhAnh:
                Array.isArray(product.HinhAnh)
                    ? product.HinhAnh[0]
                    : (
                        product.HinhAnh || ''
                    ),

            TenKichThuoc: sizeName,

            DonGia: unitPrice,

            SoLuong: quantity,

            Chon: true,

            TonKho: maxStock
        };

        cart.push(cartItem);
    }

    saveCart(cart);

    showToast(
        `Đã thêm "${product.TenSP || 'Sản phẩm'}" (${sizeName}) vào giỏ!`,
        'success'
    );
    return true;
}

function updateCartBadge() {
    const cart = getCart();

    const totalCount = cart.reduce(
        (sum, item) =>
            sum +
            (parseInt(item.SoLuong) || 1),
        0
    );

    document
        .querySelectorAll('.cart-count')
        .forEach(el => {
            el.textContent = totalCount;
        });
}


// ============================================================
// FAVORITES / LIKES
// ============================================================

function getLikesStorageKey() {
    const user = getCurrentUser();

    return user
        ? `sweet_bakery_likes_${user.MaKH || user.id || user._id || user.email}`
        : 'sweet_bakery_likes_guest';
}

function getLikes() {
    try {
        const data = localStorage.getItem(
            getLikesStorageKey()
        );

        return data
            ? JSON.parse(data)
            : [];

    } catch (e) {
        console.error('getLikes error:', e);
        return [];
    }
}

function isLiked(maSP) {
    return getLikes().includes(maSP);
}


// ============================================================
// LOAD FAVORITES FROM BACKEND
// ============================================================

async function loadFavorites() {

    const user = getCurrentUser();

    if (!user) {
        return [];
    }

    const maKH =
        user.MaKH ||
        user.id ||
        user._id;

    if (!maKH) {
        return [];
    }

    try {

        const data = await fetchApi(
            `/favorites?maKH=${encodeURIComponent(maKH)}`
        );

        const products =
            Array.isArray(data)
                ? data
                : [];

        const ids = products
            .map(item =>
                item.MaSP ||
                item.id ||
                item._id
            )
            .filter(Boolean);

        localStorage.setItem(
            getLikesStorageKey(),
            JSON.stringify(ids)
        );

        updateLikesBadge();

        return products;

    } catch (error) {

        console.error(
            'loadFavorites error:',
            error
        );

        return getLikes();
    }
}


// ============================================================
// TOGGLE FAVORITE
// ============================================================

async function toggleLike(product) {

    const user = getCurrentUser();

    if (!user) {

        showToast(
            'Vui lòng đăng nhập để lưu sản phẩm yêu thích!',
            'error'
        );

        setTimeout(() => {
            window.location.href =
                '../auth/login.html';
        }, 1000);

        return false;
    }

    const maSP =
        typeof product === 'string'
            ? product
            : (
                product.MaSP ||
                product.id ||
                product._id
            );

    if (!maSP) {

        showToast(
            'Không xác định được sản phẩm!',
            'error'
        );

        return false;
    }

    const maKH =
        user.MaKH ||
        user.id ||
        user._id;

    if (!maKH) {

        showToast(
            'Không xác định được mã khách hàng!',
            'error'
        );

        return false;
    }

    const liked = isLiked(maSP);

    try {

        // ----------------------------------------------------
        // XÓA YÊU THÍCH
        // ----------------------------------------------------

        if (liked) {

            await fetchApi(
                `/favorites/${encodeURIComponent(maSP)}`,
                {
                    method: 'DELETE',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({
                        maKH: maKH
                    })
                }
            );

        }

        // ----------------------------------------------------
        // THÊM YÊU THÍCH
        // ----------------------------------------------------

        else {

            await fetchApi(
                '/favorites',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({
                        maKH: maKH,

                        item: {
                            MaSP: maSP
                        }
                    })
                }
            );
        }

        // ----------------------------------------------------
        // CẬP NHẬT LOCAL STORAGE
        // ----------------------------------------------------

        const likes = getLikes();

        const nextLikes = liked
            ? likes.filter(
                id => id !== maSP
            )
            : [
                ...new Set([
                    ...likes,
                    maSP
                ])
            ];

        localStorage.setItem(
            getLikesStorageKey(),
            JSON.stringify(nextLikes)
        );

        updateLikesBadge();

        showToast(
            liked
                ? 'Đã bỏ yêu thích sản phẩm'
                : 'Đã thêm sản phẩm vào danh sách yêu thích ♥',
            'success'
        );

        return !liked;

    } catch (error) {

        console.error(
            'toggleLike error:',
            error
        );

        showToast(
            error.message ||
            'Không thể cập nhật yêu thích!',
            'error'
        );

        return liked;
    }
}

function updateLikesBadge() {

    const likes = getLikes();

    document
        .querySelectorAll('.like-count')
        .forEach(el => {
            el.textContent =
                likes.length;
        });
}


// ============================================================
// API FETCH
// ============================================================

async function fetchApi(
    endpoint,
    options = {}
) {

    const cleanEndpoint =
        endpoint.startsWith('/')
            ? endpoint
            : `/${endpoint}`;

    const url =
        `${API_BASE}${cleanEndpoint}`;

    console.log(
        '[API REQUEST]',
        options.method || 'GET',
        url
    );

    try {

        const response = await fetch(
            url,
            {
                ...options,

                headers: {
                    'Accept':
                        'application/json',

                    ...(options.headers || {})
                }
            }
        );

        const contentType =
            response.headers.get(
                'content-type'
            ) || '';

        let result;

        if (
            contentType.includes(
                'application/json'
            )
        ) {

            result =
                await response.json();

        } else {

            const text =
                await response.text();

            console.error(
                '[API NON-JSON RESPONSE]',
                response.status,
                text
            );

            throw new Error(
                `API trả về dữ liệu không hợp lệ (${response.status})`
            );
        }

        console.log(
            '[API RESPONSE]',
            response.status,
            result
        );

        if (!response.ok) {

            const message =
                result?.message ||
                result?.error ||
                `API Error ${response.status}`;

            throw new Error(message);
        }

        if (
            result &&
            result.success === false
        ) {

            throw new Error(
                result.message ||
                'API request thất bại.'
            );
        }

        if (
            result &&
            Object.prototype.hasOwnProperty.call(
                result,
                'data'
            )
        ) {

            return result.data;
        }

        return result;

    } catch (error) {

        console.error(
            '[API ERROR]',
            url,
            error
        );

        throw error;
    }
}


// ============================================================
// IMAGE RESOLUTION & FALLBACKS
// ============================================================

const DEFAULT_CAKE_IMAGES = [
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1623689046286-01d4b7a2d8f3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=800&q=80'
];

function resolveImageUrl(
    imgSrc,
    fallbackIndex = 0
) {

    if (!imgSrc) {

        return DEFAULT_CAKE_IMAGES[
            fallbackIndex %
            DEFAULT_CAKE_IMAGES.length
        ];
    }

    if (Array.isArray(imgSrc)) {
        imgSrc = imgSrc[0];
    }

    if (typeof imgSrc !== 'string') {

        return DEFAULT_CAKE_IMAGES[
            fallbackIndex %
            DEFAULT_CAKE_IMAGES.length
        ];
    }

    // Làm sạch trường hợp bị lặp ../../assets/
    imgSrc = imgSrc.replace(/^(\.\.\/\.\.\/assets\/)+/g, '../../assets/');

    if (
        imgSrc.startsWith('http://') ||
        imgSrc.startsWith('https://') ||
        imgSrc.startsWith('data:') ||
        imgSrc.startsWith('/') ||
        imgSrc.startsWith('./') ||
        imgSrc.startsWith('../')
    ) {
        return imgSrc;
    }

    return `../../assets/${imgSrc}`;
}


// ============================================================
// PRICE FORMATTER
// ============================================================

function formatVND(amount) {

    const num =
        parseInt(amount) || 0;

    return (
        new Intl.NumberFormat('vi-VN')
            .format(num) +
        ' ₫'
    );
}


// ============================================================
// TOAST
// ============================================================

function showToast(
    message,
    type = 'info'
) {

    let container =
        document.getElementById(
            'toast-container'
        );

    if (!container) {

        container =
            document.createElement(
                'div'
            );

        container.id =
            'toast-container';

        document.body.appendChild(
            container
        );
    }

    const toast =
        document.createElement(
            'div'
        );

    toast.className =
        `toast ${type}`;

    toast.innerHTML =
        `<span>${
            type === 'success'
                ? '✓'
                : type === 'error'
                    ? '✕'
                    : 'ℹ'
        }</span> ${message}`;

    container.appendChild(
        toast
    );

    setTimeout(() => {

        toast.style.opacity =
            '0';

        toast.style.transform =
            'translateY(20px)';

        setTimeout(
            () => toast.remove(),
            300
        );

    }, 3000);
}


// ============================================================
// HEADER
// ============================================================

function setupHeader(
    activeKey = 'home'
) {

    const user =
        getCurrentUser();

    const avatarEl =
        document.getElementById(
            'headerAvatarBtn'
        );

    if (avatarEl) {

        avatarEl.type = 'button';

        const goToAccount = () => {
            window.location.assign('../accout_info/info.html');
        };

        const goToLogin = () => {
            window.location.assign('../auth/login.html');
        };

        avatarEl.onclick = null;

        if (user) {

            const initials =
                user.fullName
                    ? user.fullName
                        .charAt(0)
                        .toUpperCase()
                    : (
                        user.email
                            ? user.email
                                .charAt(0)
                                .toUpperCase()
                            : 'U'
                    );

            avatarEl.textContent =
                initials;

            avatarEl.title =
                user.fullName ||
                user.email;

            avatarEl.addEventListener(
                'click',
                goToAccount,
                { once: false }
            );

        } else {

            avatarEl.innerHTML =
                '<i class="fa-regular fa-user"></i>';

            avatarEl.title =
                'Đăng nhập';

            avatarEl.addEventListener(
                'click',
                goToLogin,
                { once: false }
            );
        }
    }

    document
        .querySelectorAll(
            '.main-nav a'
        )
        .forEach(link => {

            if (
                link.dataset.nav ===
                activeKey
            ) {

                link.classList.add(
                    'active'
                );

            } else {

                link.classList.remove(
                    'active'
                );
            }
        });

    const toggleBtn =
        document.getElementById(
            'menuToggle'
        );

    const mainNav =
        document.getElementById(
            'mainNav'
        );

    if (
        toggleBtn &&
        mainNav
    ) {

        toggleBtn.onclick = () => {

            mainNav.classList.toggle(
                'open'
            );
        };
    }

    updateCartBadge();
    updateLikesBadge();
}


// ============================================================
// DOM READY
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        updateCartBadge();
        updateLikesBadge();

        const user = getCurrentUser();
        if (user) {
            loadCartFromBackend();
            loadFavorites();
        }
    }
);



