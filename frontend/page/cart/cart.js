/* =========================================================
   CART PAGE
   The Little Prince Sweet Bakery
========================================================= */

let pendingDeleteIndex = null;



/* =========================================================
   INIT
========================================================= */

document.addEventListener('DOMContentLoaded', async () => {

    setupHeader('cart');

    if (typeof loadCartFromBackend === 'function') {
        await loadCartFromBackend();
    }

    renderCartPage();

    initDeleteModal();

    updateCurrentYear();

});



/* =========================================================
   RENDER CART
========================================================= */

function renderCartPage() {

    const layout =
        document.getElementById('cartLayout');

    if (!layout) {
        return;
    }


    const cart =
        getCart();


    /* =====================================================
       EMPTY CART
    ===================================================== */

    if (!Array.isArray(cart) || cart.length === 0) {

        layout.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">

                    <i class="fa-solid fa-bag-shopping"></i>

                </div>


                <h3>
                    Giỏ hàng của bạn đang trống
                </h3>


                <p>
                    Hãy chọn những chiếc bánh tươi mới
                    ngọt ngào từ thực đơn của chúng tôi nhé!
                </p>


                <a
                    href="../menu/menu.html"
                    class="btn btn-primary"
                >
                    Khám phá thực đơn

                    <i class="fa-solid fa-arrow-right"></i>
                </a>

            </div>

        `;

        updateCartBadge();

        return;
    }



    /* =====================================================
       ITEMS
    ===================================================== */

    const itemsHtml = cart
        .map((item, index) => {

            const maSP =
                item.MaSP || '';

            const sizeName =
                item.TenKichThuoc ||
                'Tiêu chuẩn';

            const unitPrice =
                Number(item.DonGia) || 0;

            const qty =
                Math.max(
                    1,
                    Number(item.SoLuong) || 1
                );

            const isSelected =
                item.Chon !== false;

            const lineTotal =
                unitPrice * qty;

            const image =
                resolveImageUrl(
                    item.HinhAnh,
                    index
                );

            const productName =
                escapeCartHTML(
                    item.TenSP ||
                    'Sản phẩm'
                );


            return `

                <article
                    class="cart-item"
                    data-index="${index}"
                >

                    <!-- CHECKBOX -->

                    <input
                        type="checkbox"
                        class="cart-item-checkbox"
                        ${isSelected ? 'checked' : ''}
                        onchange="
                            toggleItemSelect(
                                ${index},
                                this.checked
                            )
                        "
                        aria-label="Chọn ${productName}"
                    >


                    <!-- IMAGE -->

                    <div class="cart-item-thumb">

                        <img
                            src="${image}"
                            alt="${productName}"
                            loading="lazy"
                            onerror="
                                this.onerror=null;
                                this.src='../../assets/logo.png';
                            "
                        >

                    </div>


                    <!-- INFO -->

                    <div class="cart-item-info">

                        <h3 title="${productName}">
                            ${productName}
                        </h3>


                        <p class="cart-item-spec">

                            Kích thước:
                            ${escapeCartHTML(sizeName)}

                        </p>


                        <span class="cart-item-price">
                            ${formatVND(unitPrice)}
                        </span>

                    </div>


                    <!-- ACTIONS -->

                    <div class="cart-item-actions">

                        <span class="cart-line-total">
                            ${formatVND(lineTotal)}
                        </span>


                        <div class="qty-control">

                            <button
                                type="button"
                                class="qty-btn"
                                onclick="
                                    updateCartItemQty(
                                        ${index},
                                        -1
                                    )
                                "
                                aria-label="Giảm số lượng"
                            >
                                −
                            </button>


                            <span class="qty-val">
                                ${qty}
                            </span>


                            <button
                                type="button"
                                class="qty-btn"
                                onclick="
                                    updateCartItemQty(
                                        ${index},
                                        1
                                    )
                                "
                                aria-label="Tăng số lượng"
                            >
                                +
                            </button>

                        </div>


                        <button
                            type="button"
                            class="btn-remove-item"
                            onclick="
                                removeCartItem(${index})
                            "
                        >
                            <i class="fa-regular fa-trash-can"></i>
                            Xóa
                        </button>

                    </div>

                </article>

            `;

        })
        .join('');



    /* =====================================================
       SELECT ALL STATE
    ===================================================== */

    const allSelected =
        cart.every(
            item => item.Chon !== false
        );



    /* =====================================================
       FULL CART UI
    ===================================================== */

    layout.innerHTML = `

        <!-- =================================================
             ITEMS
        ================================================= -->

        <section class="cart-items-panel">

            <div class="cart-panel-top">

                <label class="select-all-label">

                    <input
                        type="checkbox"
                        id="selectAllCheckbox"
                        ${allSelected ? 'checked' : ''}
                        onchange="
                            toggleSelectAll(
                                this.checked
                            )
                        "
                    >

                    <span>
                        Chọn tất cả
                    </span>

                    <span class="cart-count-label">
                        (${cart.length} món)
                    </span>

                </label>


                <button
                    type="button"
                    class="clear-cart-btn"
                    onclick="clearCart()"
                >

                    <i class="fa-regular fa-trash-can"></i>

                    Xóa toàn bộ

                </button>

            </div>


            <!-- ITEMS -->

            <div class="cart-items-list">

                ${itemsHtml}

            </div>

        </section>



        <!-- =================================================
             SUMMARY
        ================================================= -->

        <aside class="summary-card">

            <div class="summary-card-inner">

                <p class="summary-label">
                    TÓM TẮT ĐƠN HÀNG
                </p>


                <h2>
                    Tổng Đơn Hàng
                </h2>


                <div class="summary-row">

                    <span>
                        Tạm tính
                    </span>

                    <span id="subtotalText">
                        0 ₫
                    </span>

                </div>


                <div class="summary-row discount">

                    <span>
                        Giảm giá
                    </span>

                    <span>
                        0 ₫
                    </span>

                </div>


                <div class="summary-row">

                    <span>
                        Phí vận chuyển
                    </span>

                    <span id="shippingText">
                        0 ₫
                    </span>

                </div>


                <div class="summary-row total">

                    <span>
                        Tổng thanh toán
                    </span>

                    <strong id="totalText">
                        0 ₫
                    </strong>

                </div>


                <button
                    type="button"
                    class="btn btn-primary btn-checkout-link"
                    onclick="proceedToPayment()"
                >

                    Tiến hành thanh toán

                    <i class="fa-solid fa-arrow-right"></i>

                </button>


                <p class="summary-note">

                    <i class="fa-solid fa-circle-info"></i>

                    Phí vận chuyển được áp dụng cố định
                    30.000 ₫ cho đơn hàng có sản phẩm được chọn.

                </p>

            </div>

        </aside>

    `;


    recalculateTotals();

    updateCartBadge();

}



/* =========================================================
   UPDATE QUANTITY
========================================================= */

function updateCartItemQty(index, delta) {

    const cart =
        getCart();

    if (
        !Array.isArray(cart) ||
        !cart[index]
    ) {
        return;
    }

    const currentQty =
        Number(cart[index].SoLuong) || 1;

    const maxStock =
        Number(cart[index].TonKho ?? 999);

    let newQty =
        currentQty + delta;

    // Cơ chế chặn: Không cho tăng quá tồn kho
    if (delta > 0 && newQty > maxStock) {
        showToast(
            `Sản phẩm "${cart[index].TenSP || 'này'}" chỉ còn tối đa ${maxStock} chiếc trong kho!`,
            'error'
        );
        return;
    }

    if (newQty < 1) {
        newQty = 1;
    }

    cart[index].SoLuong =
        newQty;

    saveCart(cart);

    renderCartPage();

}



/* =========================================================
   SELECT ITEM
========================================================= */

function toggleItemSelect(
    index,
    isChecked
) {

    const cart =
        getCart();


    if (!cart[index]) {
        return;
    }


    cart[index].Chon =
        isChecked;


    saveCart(cart);


    recalculateTotals();

    updateSelectAllCheckbox();

}



/* =========================================================
   SELECT ALL
========================================================= */

function toggleSelectAll(
    isChecked
) {

    const cart =
        getCart();


    if (!Array.isArray(cart)) {
        return;
    }


    cart.forEach(item => {

        item.Chon =
            isChecked;

    });


    saveCart(cart);


    renderCartPage();

}



/* =========================================================
   REMOVE ONE ITEM
========================================================= */

function removeCartItem(index) {

    const cart =
        getCart();


    if (
        !Array.isArray(cart) ||
        !cart[index]
    ) {
        return;
    }


    /*
     * KHÔNG XÓA NGAY.
     * Lưu lại index để overlay xác nhận.
     */

    pendingDeleteIndex =
        index;


    const productName =
        cart[index].TenSP ||
        'sản phẩm này';


    openDeleteModal(
        productName
    );

}



/* =========================================================
   OPEN DELETE MODAL
========================================================= */

function openDeleteModal(
    productName
) {

    const modal =
        document.getElementById(
            'deleteModal'
        );

    const message =
        document.getElementById(
            'deleteModalMessage'
        );


    if (!modal) {
        return;
    }


    if (message) {

        message.innerHTML = `

            Bạn có chắc muốn xóa
            <strong>${escapeCartHTML(productName)}</strong>
            khỏi giỏ hàng không?

        `;

    }


    modal.classList.add(
        'is-open'
    );

    modal.setAttribute(
        'aria-hidden',
        'false'
    );


    document.body.classList.add(
        'delete-modal-open'
    );


    /*
     * Đưa focus vào nút Hủy
     * để thao tác bàn phím thuận tiện.
     */

    setTimeout(() => {

        const cancel =
            document.getElementById(
                'cancelDeleteBtn'
            );

        if (cancel) {
            cancel.focus();
        }

    }, 50);

}



/* =========================================================
   CLOSE DELETE MODAL
========================================================= */

function closeDeleteModal() {

    const modal =
        document.getElementById(
            'deleteModal'
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        'is-open'
    );

    modal.setAttribute(
        'aria-hidden',
        'true'
    );


    document.body.classList.remove(
        'delete-modal-open'
    );


    pendingDeleteIndex =
        null;

}



/* =========================================================
   CONFIRM DELETE
========================================================= */

function confirmDeleteItem() {

    if (
        pendingDeleteIndex === null
    ) {
        closeDeleteModal();
        return;
    }


    const cart =
        getCart();


    if (
        !Array.isArray(cart) ||
        !cart[pendingDeleteIndex]
    ) {

        closeDeleteModal();

        renderCartPage();

        return;
    }


    /*
     * XÓA THẬT SỰ SAU KHI
     * NGƯỜI DÙNG BẤM XÁC NHẬN.
     */

    cart.splice(
        pendingDeleteIndex,
        1
    );


    saveCart(cart);


    pendingDeleteIndex =
        null;


    closeDeleteModal();


    renderCartPage();


    /*
     * Thông báo nhẹ sau khi xóa.
     */

    if (typeof showToast === 'function') {

        showToast(
            'Đã xóa sản phẩm khỏi giỏ hàng.',
            'success'
        );

    }

}



/* =========================================================
   CLEAR ENTIRE CART
========================================================= */

function clearCart() {

    const cart =
        getCart();


    if (
        !Array.isArray(cart) ||
        cart.length === 0
    ) {
        return;
    }


    /*
     * Dùng cùng overlay.
     * Đặt index đặc biệt -1 để biết đây
     * là thao tác xóa toàn bộ.
     */

    pendingDeleteIndex =
        -1;


    const modal =
        document.getElementById(
            'deleteModal'
        );

    const message =
        document.getElementById(
            'deleteModalMessage'
        );


    if (!modal) {
        return;
    }


    if (message) {

        message.innerHTML = `

            Bạn có chắc muốn
            <strong>xóa toàn bộ ${cart.length} món</strong>
            khỏi giỏ hàng không?

        `;

    }


    modal.classList.add(
        'is-open'
    );

    modal.setAttribute(
        'aria-hidden',
        'false'
    );


    document.body.classList.add(
        'delete-modal-open'
    );


    const cancel =
        document.getElementById(
            'cancelDeleteBtn'
        );

    if (cancel) {
        setTimeout(
            () => cancel.focus(),
            50
        );
    }

}



/* =========================================================
   HANDLE CONFIRM BUTTON
========================================================= */

function handleDeleteConfirmation() {

    if (
        pendingDeleteIndex === -1
    ) {

        const cart =
            getCart();


        if (
            Array.isArray(cart) &&
            cart.length > 0
        ) {

            saveCart([]);

        }


        pendingDeleteIndex =
            null;


        closeDeleteModal();


        renderCartPage();


        if (typeof showToast === 'function') {

            showToast(
                'Đã xóa toàn bộ giỏ hàng.',
                'success'
            );

        }

        return;
    }


    confirmDeleteItem();

}



/* =========================================================
   INITIALIZE DELETE MODAL
========================================================= */

function initDeleteModal() {

    const modal =
        document.getElementById(
            'deleteModal'
        );

    const closeBtn =
        document.getElementById(
            'deleteModalClose'
        );

    const cancelBtn =
        document.getElementById(
            'cancelDeleteBtn'
        );

    const confirmBtn =
        document.getElementById(
            'confirmDeleteBtn'
        );

    const backdrop =
        document.getElementById(
            'deleteModalBackdrop'
        );


    if (!modal) {
        return;
    }


    /*
     * Nút X
     */

    if (closeBtn) {

        closeBtn.addEventListener(
            'click',
            closeDeleteModal
        );

    }


    /*
     * Nút Hủy
     */

    if (cancelBtn) {

        cancelBtn.addEventListener(
            'click',
            closeDeleteModal
        );

    }


    /*
     * Nút Xóa sản phẩm
     */

    if (confirmBtn) {

        confirmBtn.addEventListener(
            'click',
            handleDeleteConfirmation
        );

    }


    /*
     * Click vùng tối bên ngoài
     */

    if (backdrop) {

        backdrop.addEventListener(
            'click',
            closeDeleteModal
        );

    }


    /*
     * ESC = Hủy
     */

    document.addEventListener(
        'keydown',
        event => {

            if (
                event.key === 'Escape' &&
                modal.classList.contains('is-open')
            ) {

                closeDeleteModal();

            }

        }
    );

}



/* =========================================================
   RECALCULATE TOTALS
========================================================= */

function recalculateTotals() {

    const cart =
        getCart();


    if (!Array.isArray(cart)) {
        return;
    }


    const selectedItems =
        cart.filter(
            item => item.Chon !== false
        );


    const subtotal =
        selectedItems.reduce(
            (sum, item) => {

                const price =
                    Number(item.DonGia) || 0;

                const quantity =
                    Math.max(
                        1,
                        Number(item.SoLuong) || 1
                    );

                return sum +
                    (price * quantity);

            },
            0
        );


    const shipping =
        subtotal > 0
            ? 30000
            : 0;


    const total =
        subtotal + shipping;



    const subtotalEl =
        document.getElementById(
            'subtotalText'
        );

    const shippingEl =
        document.getElementById(
            'shippingText'
        );

    const totalEl =
        document.getElementById(
            'totalText'
        );


    if (subtotalEl) {

        subtotalEl.textContent =
            formatVND(subtotal);

    }


    if (shippingEl) {

        shippingEl.textContent =
            shipping > 0
                ? formatVND(shipping)
                : '0 ₫';

    }


    if (totalEl) {

        totalEl.textContent =
            formatVND(total);

    }

}



/* =========================================================
   UPDATE SELECT ALL CHECKBOX
========================================================= */

function updateSelectAllCheckbox() {

    const cart =
        getCart();

    const checkbox =
        document.getElementById(
            'selectAllCheckbox'
        );


    if (
        !checkbox ||
        !Array.isArray(cart)
    ) {
        return;
    }


    checkbox.checked =
        cart.length > 0 &&
        cart.every(
            item => item.Chon !== false
        );

}



/* =========================================================
   UPDATE HEADER CART BADGE
========================================================= */

function updateCartBadge() {

    const cart =
        getCart();


    if (!Array.isArray(cart)) {
        return;
    }


    const count =
        cart.reduce(
            (total, item) => {

                return total +
                    (
                        Number(item.SoLuong) || 1
                    );

            },
            0
        );


    document
        .querySelectorAll('.cart-count')
        .forEach(badge => {

            badge.textContent =
                count;

        });

}



/* =========================================================
   PAYMENT
========================================================= */

function proceedToPayment() {

    const cart =
        getCart();


    if (!Array.isArray(cart)) {
        return;
    }


    const selectedItems =
        cart.filter(
            item => item.Chon !== false
        );


    if (
        selectedItems.length === 0
    ) {

        if (
            typeof showToast === 'function'
        ) {

            showToast(
                'Vui lòng chọn ít nhất 1 sản phẩm để thanh toán!',
                'error'
            );

        } else {

            alert(
                'Vui lòng chọn ít nhất 1 sản phẩm để thanh toán!'
            );

        }

        return;
    }


    window.location.href =
        '../payment/payment.html';

}



/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeCartHTML(value) {

    return String(value ?? '')
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#039;'
        );

}



/* =========================================================
   YEAR
========================================================= */

function updateCurrentYear() {

    const year =
        document.getElementById(
            'year'
        );


    if (year) {

        year.textContent =
            new Date().getFullYear();

    }

}