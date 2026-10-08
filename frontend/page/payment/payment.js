/* =========================================================
   THE LITTLE PRINCE - PAYMENT PAGE
   FULL VERSION
========================================================= */


/* =========================================================
   GLOBAL
========================================================= */

let selectedCartItems = [];

let currentSubtotal = 0;

let shippingFee = 30000;

let currentOrder = null;

let paymentPolling = null;

// Voucher state
let appliedVoucher = null; // { MaKM, TenKM, LoaiKM, GiaTri, DiscountAmount }

let currentDiscountAmount = 0;


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    setupHeader('cart');

    initPaymentPage();

    const form =
        document.getElementById('paymentForm');

    if (form) {

        form.addEventListener(
            'submit',
            handleOrderSubmit
        );

    }

});


/* =========================================================
   INIT
========================================================= */

async function initPaymentPage() {

    const user =
        getCurrentUser();

    console.log(
        'Current user:',
        user
    );


    if (!user) {

        showToast(
            'Vui lòng đăng nhập trước khi thanh toán.',
            'error'
        );

        setTimeout(() => {

            window.location.href =
                '../auth/login.html';

        }, 1200);

        return;

    }

    if (typeof loadCartFromBackend === 'function') {
        await loadCartFromBackend();
    }

    loadCustomerInformation(user);

    loadSelectedCartItems();

    setupPaymentMethods();

    setupCustomerEditing();

    setupModalEvents();

    setupVoucher();

}


/* =========================================================
   CUSTOMER INFORMATION
========================================================= */

function loadCustomerInformation(user) {

    const fullName =
        user.MaKH ||
        user.fullName ||
        user.HoTen ||
        user.hoTen ||
        user.name ||
        '';


    /*
     * Lưu ý:
     * MaKH KHÔNG phải tên.
     * Chỉ dùng các field phù hợp cho từng dữ liệu.
     */

    const actualFullName =
        user.HoTen ||
        user.hoTen ||
        user.fullName ||
        user.name ||
        '';


    const phone =
        user.SDT ||
        user.sdt ||
        user.phone ||
        user.phoneNumber ||
        '';


    const address =
        user.DiaChi ||
        user.diaChi ||
        user.address ||
        '';


    const fullNameInput =
        document.getElementById(
            'orderFullName'
        );

    const phoneInput =
        document.getElementById(
            'orderPhone'
        );

    const addressInput =
        document.getElementById(
            'orderAddress'
        );


    if (fullNameInput) {

        fullNameInput.value =
            actualFullName;

    }


    if (phoneInput) {

        phoneInput.value =
            phone;

    }


    if (addressInput) {

        addressInput.value =
            address;

    }


    updateCustomerInfoView();

    // Nếu người dùng chưa có thông tin nhận hàng, tự động mở form nhập
    if (!actualFullName || !phone || !address) {
        openCustomerEditForm();
    }

}


/* =========================================================
   CUSTOMER INFO VIEW
========================================================= */

function updateCustomerInfoView() {

    const fullNameInput =
        document.getElementById(
            'orderFullName'
        );

    const phoneInput =
        document.getElementById(
            'orderPhone'
        );

    const addressInput =
        document.getElementById(
            'orderAddress'
        );


    const fullName =
        fullNameInput?.value.trim() || '';

    const phone =
        phoneInput?.value.trim() || '';

    const address =
        addressInput?.value.trim() || '';


    const displayFullName =
        document.getElementById(
            'displayFullName'
        );

    const displayPhone =
        document.getElementById(
            'displayPhone'
        );

    const displayAddress =
        document.getElementById(
            'displayAddress'
        );


    if (displayFullName) {

        displayFullName.textContent =
            fullName || '--';

    }


    if (displayPhone) {

        displayPhone.textContent =
            phone || '--';

    }


    if (displayAddress) {

        displayAddress.textContent =
            address || '--';

    }

}


/* =========================================================
   CUSTOMER EDIT
========================================================= */

function setupCustomerEditing() {

    const editBtn =
        document.getElementById(
            'editInfoBtn'
        );

    const cancelBtn =
        document.getElementById(
            'cancelEditBtn'
        );

    const saveBtn =
        document.getElementById(
            'saveInfoBtn'
        );


    if (!editBtn ||
        !cancelBtn ||
        !saveBtn) {

        return;

    }


    editBtn.addEventListener(
        'click',
        () => {

            document
                .getElementById(
                    'customerInfoView'
                )
                ?.classList.add(
                    'hidden'
                );

            document
                .getElementById(
                    'customerInfoForm'
                )
                ?.classList.remove(
                    'hidden'
                );

            editBtn.classList.add(
                'hidden'
            );

        }
    );


    cancelBtn.addEventListener(
        'click',
        () => {

            document
                .getElementById(
                    'customerInfoForm'
                )
                ?.classList.add(
                    'hidden'
                );

            document
                .getElementById(
                    'customerInfoView'
                )
                ?.classList.remove(
                    'hidden'
                );

            editBtn.classList.remove(
                'hidden'
            );

        }
    );


    saveBtn.addEventListener(
        'click',
        () => {

            const fullName =
                document
                    .getElementById(
                        'orderFullName'
                    )
                    ?.value
                    .trim() || '';


            const phone =
                document
                    .getElementById(
                        'orderPhone'
                    )
                    ?.value
                    .trim() || '';


            const address =
                document
                    .getElementById(
                        'orderAddress'
                    )
                    ?.value
                    .trim() || '';


            if (
                !fullName ||
                !phone ||
                !address
            ) {

                showToast(
                    'Vui lòng nhập đầy đủ thông tin nhận hàng.',
                    'error'
                );

                return;

            }


            if (
                !isValidPhone(phone)
            ) {

                showToast(
                    'Số điện thoại không hợp lệ.',
                    'error'
                );

                return;

            }


            updateCustomerInfoView();


            document
                .getElementById(
                    'customerInfoForm'
                )
                ?.classList.add(
                    'hidden'
                );


            document
                .getElementById(
                    'customerInfoView'
                )
                ?.classList.remove(
                    'hidden'
                );


            editBtn.classList.remove(
                'hidden'
            );


            showToast(
                'Đã cập nhật thông tin nhận hàng.',
                'success'
            );

        }
    );

}


/* =========================================================
   PHONE VALIDATION
========================================================= */

function isValidPhone(phone) {

    const normalized =
        phone
            .replace(/\s+/g, '')
            .replace(/-/g, '');


    return /^(0|\+84)[0-9]{9,10}$/
        .test(normalized);

}


/* =========================================================
   LOAD CART
========================================================= */

function loadSelectedCartItems() {

    const cart =
        getCart();


    console.log(
        'Cart:',
        cart
    );


    selectedCartItems =
        cart.filter(
            item =>
                item.Chon !== false
        );


    console.log(
        'Selected cart items:',
        selectedCartItems
    );


    if (
        selectedCartItems.length === 0
    ) {

        showToast(
            'Chưa có sản phẩm nào được chọn để thanh toán.',
            'error'
        );


        setTimeout(() => {

            window.location.href =
                '../cart/cart.html';

        }, 1200);


        return;

    }


    renderPaymentSummary();

}


/* =========================================================
   PAYMENT SUMMARY
========================================================= */

function renderPaymentSummary() {

    const itemsList =
        document.getElementById(
            'paymentItemsList'
        );


    if (!itemsList) {

        return;

    }


    currentSubtotal =
        selectedCartItems.reduce(
            (sum, item) => {

                const price =
                    Number(
                        item.DonGia ||
                        item.Gia ||
                        item.price ||
                        0
                    );


                const quantity =
                    Number(
                        item.SoLuong ||
                        item.quantity ||
                        1
                    );


                return sum +
                    price * quantity;

            },
            0
        );


    const finalTotal =
        Math.max(0, currentSubtotal + shippingFee - currentDiscountAmount);


    itemsList.innerHTML =
        selectedCartItems
            .map(
                item => {

                    const price =
                        Number(
                            item.DonGia ||
                            item.Gia ||
                            item.price ||
                            0
                        );


                    const quantity =
                        Number(
                            item.SoLuong ||
                            item.quantity ||
                            1
                        );


                    const total =
                        price * quantity;


                    return `

                        <div class="order-item-row">

                            <div class="order-item-info">

                                <strong>
                                    ${escapeHTML(
                                        item.TenSP ||
                                        item.TenSanPham ||
                                        item.name ||
                                        'Sản phẩm'
                                    )}
                                </strong>

                                <small>
                                    Số lượng:
                                    ${quantity}
                                </small>

                            </div>

                            <strong class="order-item-price">
                                ${formatVND(total)}
                            </strong>

                        </div>

                    `;

                }
            )
            .join('');


    const countElement =
        document.getElementById(
            'paymentItemCount'
        );


    if (countElement) {

        countElement.textContent =
            `${selectedCartItems.length} sản phẩm`;

    }


    const subtotalElement =
        document.getElementById(
            'paySubtotal'
        );


    if (subtotalElement) {

        subtotalElement.textContent =
            formatVND(
                currentSubtotal
            );

    }


    const discountElement =
        document.getElementById(
            'payDiscount'
        );


    if (discountElement) {

        if (currentDiscountAmount > 0) {

            discountElement.textContent =
                '- ' + formatVND(currentDiscountAmount);

        } else {

            discountElement.textContent = '0 ₫';

        }

    }


    const shippingElement =
        document.getElementById(
            'payShipping'
        );


    if (shippingElement) {

        shippingElement.textContent =
            formatVND(
                shippingFee
            );

    }


    const totalElement =
        document.getElementById(
            'payTotal'
        );


    if (totalElement) {

        totalElement.textContent =
            formatVND(
                finalTotal
            );

    }

}


/* =========================================================
   VOUCHER / MÃ GIẢM GIÁ
========================================================= */

function setupVoucher() {

    const applyBtn =
        document.getElementById('applyVoucherBtn');

    const input =
        document.getElementById('discountCodeInput');

    if (!applyBtn || !input) {
        return;
    }

    applyBtn.addEventListener('click', async () => {

        const code = input.value.trim().toUpperCase();

        if (!code) {

            showVoucherMessage('Vui lòng nhập mã giảm giá.', 'error');
            return;

        }

        applyBtn.disabled = true;
        applyBtn.textContent = 'Đang kiểm tra...';

        try {

            const result = await fetchApi(
                '/vouchers/validate',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        code: code,
                        orderTotal: currentSubtotal
                    })
                }
            );

            const v = result?.data || result;

            if (v && (v.MaKM || v.GiaTri !== undefined)) {

                // Tính số tiền giảm
                let discountAmt = 0;

                if (v.LoaiKM === 'Phần trăm') {

                    discountAmt = Math.floor(
                        currentSubtotal * Number(v.GiaTri) / 100
                    );

                } else {

                    discountAmt = Number(v.GiaTri) || 0;

                }

                // Không giảm quá tổng tiền hàng
                discountAmt = Math.min(discountAmt, currentSubtotal);

                appliedVoucher = {
                    MaKM: v.MaKM || code,
                    TenKM: v.TenKM || 'Ưu đãi',
                    LoaiKM: v.LoaiKM || 'Tiền',
                    GiaTri: Number(v.GiaTri) || 0,
                    DiscountAmount: discountAmt
                };

                currentDiscountAmount = discountAmt;

                const label =
                    v.LoaiKM === 'Phần trăm'
                        ? `${v.GiaTri}%`
                        : formatVND(v.GiaTri);

                showVoucherMessage(
                    `Áp dụng thành công: ${v.TenKM || code} – Giảm ${label}`,
                    'success'
                );

                // Cập nhật lại bảng tóm tắt
                renderPaymentSummary();

                applyBtn.disabled = false;
                applyBtn.textContent = 'Đã áp dụng';

            } else {

                clearVoucher();
                showVoucherMessage(
                    result?.message || 'Mã giảm giá không hợp lệ.',
                    'error'
                );
                applyBtn.disabled = false;
                applyBtn.textContent = 'Áp dụng';

            }

        } catch (err) {

            clearVoucher();
            showVoucherMessage(
                err?.message || 'Không thể kiểm tra mã giảm giá.',
                'error'
            );
            applyBtn.disabled = false;
            applyBtn.textContent = 'Áp dụng';

        }

    });

    // Nhấn phím Enter trong ô mã giảm giá thì bấm nút Áp dụng (không submit form)
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyBtn.click();
        }
    });

    // Khi người dùng xóa input thì reset voucher
    input.addEventListener('input', () => {

        if (input.value.trim() === '' && appliedVoucher) {

            clearVoucher();
            showVoucherMessage('', '');
            applyBtn.disabled = false;
            applyBtn.textContent = 'Áp dụng';
            renderPaymentSummary();

        }

    });

    // Tải danh sách mã khuyến mãi đang hoạt động để người dùng chọn nhanh
    loadAvailableVouchers();

}


async function loadAvailableVouchers() {

    const container = document.getElementById('availableVouchersList');
    if (!container) return;

    try {
        const res = await fetchApi('/vouchers/available');
        const list = res?.data || (Array.isArray(res) ? res : []);

        if (Array.isArray(list) && list.length > 0) {
            container.innerHTML = list.map(v => {
                const discountText = v.LoaiKM === 'Phần trăm' ? `Giảm ${v.GiaTri}%` : `Giảm ${formatVND(v.GiaTri)}`;
                const minText = v.DonToiThieu > 0 ? `từ ${formatVND(v.DonToiThieu)}` : 'mọi đơn';
                return `
                    <button type="button" class="voucher-chip" onclick="applyVoucherCode('${escapeHTML(v.MaKM)}')" title="${escapeHTML(v.TenKM || '')} - Đơn tối thiểu: ${formatVND(v.DonToiThieu)}">
                        <i class="fa-solid fa-tag"></i>
                        <strong>${escapeHTML(v.MaKM)}</strong>: ${discountText} (${minText})
                    </button>
                `;
            }).join('');
        }
    } catch (e) {
        console.warn('Không thể tải danh sách voucher:', e);
    }

}

function applyVoucherCode(code) {

    const input = document.getElementById('discountCodeInput');
    const applyBtn = document.getElementById('applyVoucherBtn');
    if (input && applyBtn) {
        input.value = code;
        applyBtn.click();
    }

}


function showVoucherMessage(msg, type) {

    const el = document.getElementById('voucherMessage');

    if (!el) return;

    el.textContent = msg;
    el.className = 'voucher-message';

    if (type) {
        el.classList.add(type);
    }

    if (msg) {
        el.classList.remove('hidden');
    } else {
        el.classList.add('hidden');
    }

}


function clearVoucher() {

    appliedVoucher = null;
    currentDiscountAmount = 0;

}


/* =========================================================
   PAYMENT METHOD
========================================================= */

function setupPaymentMethods() {

    const radios =
        document.querySelectorAll(
            'input[name="paymentMethod"]'
        );


    radios.forEach(
        radio => {

            radio.addEventListener(
                'change',
                updatePaymentMethodUI
            );

        }
    );


    updatePaymentMethodUI();

}


/* =========================================================
   UPDATE PAYMENT METHOD UI
========================================================= */

function updatePaymentMethodUI() {

    const selected =
        document.querySelector(
            'input[name="paymentMethod"]:checked'
        );


    document
        .querySelectorAll(
            '.method-option'
        )
        .forEach(
            option => {

                option.classList.remove(
                    'active'
                );

            }
        );


    if (selected) {

        const option =
            selected.closest(
                '.method-option'
            );


        if (option) {

            option.classList.add(
                'active'
            );

        }

    }


    const buttonText =
        document.getElementById(
            'submitButtonText'
        );


    if (!buttonText) {

        return;

    }


    if (
        selected?.value === 'BANK'
    ) {

        buttonText.textContent =
            'Thanh Toán Bằng QR';

    } else {

        buttonText.textContent =
            'Xác Nhận Đặt Hàng';

    }

}


/* =========================================================
   HANDLE ORDER SUBMIT
========================================================= */

async function handleOrderSubmit(
    event
) {

    event.preventDefault();


    console.log(
        'Bắt đầu tạo đơn hàng...'
    );


    /*
     * =====================================================
     * USER
     * =====================================================
     */

    const user =
        getCurrentUser();


    console.log(
        'USER:',
        user
    );


    if (!user) {

        showToast(
            'Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.',
            'error'
        );

        return;

    }


    /*
     * =====================================================
     * LẤY MaKH
     * =====================================================
     */

    const maKH =
        user.MaKH ||
        user.maKH ||
        user.id ||
        user._id ||
        user.email ||
        '';


    console.log(
        'MaKH:',
        maKH
    );


    if (!maKH) {

        showToast(
            'Không xác định được mã khách hàng.',
            'error'
        );

        console.error(
            'USER KHÔNG CÓ MaKH:',
            user
        );

        return;

    }


    /*
     * =====================================================
     * THÔNG TIN KHÁCH HÀNG
     * =====================================================
     */

    const fullName =
        document
            .getElementById(
                'orderFullName'
            )
            ?.value
            .trim() || '';


    const phone =
        document
            .getElementById(
                'orderPhone'
            )
            ?.value
            .trim() || '';


    const address =
        document
            .getElementById(
                'orderAddress'
            )
            ?.value
            .trim() || '';


    const notes =
        document
            .getElementById(
                'orderNotes'
            )
            ?.value
            .trim() || '';


    /*
     * =====================================================
     * VALIDATE
     * =====================================================
     */

    if (
        !fullName ||
        !phone ||
        !address
    ) {

        showToast(
            'Vui lòng nhập đầy đủ thông tin nhận hàng.',
            'error'
        );

        openCustomerEditForm();

        return;

    }


    if (
        !isValidPhone(phone)
    ) {

        showToast(
            'Số điện thoại không hợp lệ.',
            'error'
        );

        return;

    }


    if (
        !selectedCartItems.length
    ) {

        showToast(
            'Không có sản phẩm để tạo đơn hàng.',
            'error'
        );

        return;

    }


    /*
     * =====================================================
     * PAYMENT METHOD
     * =====================================================
     */

    const paymentMethod =
        document.querySelector(
            'input[name="paymentMethod"]:checked'
        )?.value || 'COD';


    /*
     * =====================================================
     * ORDER CODE
     * =====================================================
     */

    const maDH =
        generateOrderCode();


    const now =
        new Date().toISOString();


    /*
     * =====================================================
     * ORDER DATA
     * =====================================================
     */

    const orderData = {

        MaDH:
            maDH,

        MaKH:
            maKH,

        HoTenNguoiNhan:
            fullName,

        SDTNguoiNhan:
            phone,

        DiaChiNhan:
            address,

        GhiChu:
            notes,

        SanPhams:
            selectedCartItems.map(
                item => ({
                    ...item,

                    MaSP:
                        item.MaSP ||
                        item.maSP ||
                        item._id ||
                        '',

                    TenSP:
                        item.TenSP ||
                        item.TenSanPham ||
                        item.name ||
                        'Sản phẩm',

                    SoLuong:
                        Number(
                            item.SoLuong ||
                            item.quantity ||
                            1
                        ),

                    DonGia:
                        Number(
                            item.DonGia ||
                            item.Gia ||
                            item.price ||
                            0
                        )

                })
            ),

        TongTienHang:
            Number(
                currentSubtotal
            ),

        GiamGia:
            Number(currentDiscountAmount),

        ...(appliedVoucher ? {
            MaKM: appliedVoucher.MaKM,
            TenKM: appliedVoucher.TenKM,
            LoaiKM: appliedVoucher.LoaiKM,
            GiaTriKM: appliedVoucher.GiaTri
        } : {}),

        PhiVanChuyen:
            Number(
                shippingFee
            ),

        TongThanhToan:
            Number(
                Math.max(0, currentSubtotal + shippingFee - currentDiscountAmount)
            ),

        PhuongThucThanhToan:
            paymentMethod === 'BANK'
                ? 'Chuyển khoản ngân hàng'
                : 'Thanh toán khi nhận hàng (COD)',

        TrangThaiThanhToan:
            paymentMethod === 'BANK'
                ? 'Chờ thanh toán'
                : 'Chưa thanh toán',

        TrangThaiDonHang:
            paymentMethod === 'BANK'
                ? 'Chờ thanh toán'
                : 'Chờ xác nhận',

        NgayDat:
            now,

        NgayCapNhat:
            now

    };


    /*
     * =====================================================
     * PAYLOAD CHO BACKEND
     *
     * Backend đang báo:
     * "Missing maKH or order data"
     *
     * => phải gửi:
     *
     * {
     *    maKH: "...",
     *    order: {...}
     * }
     * =====================================================
     */

    const payload = {

        maKH:
            maKH,

        order:
            orderData

    };


    console.log(
        'ORDER DATA:',
        orderData
    );


    console.log(
        'PAYLOAD GỬI BACKEND:',
        payload
    );


    /*
     * =====================================================
     * BANK
     * =====================================================
     */

    if (
        paymentMethod === 'BANK'
    ) {

        await startBankPayment(
            orderData,
            payload
        );

        return;

    }


    /*
     * =====================================================
     * COD
     * =====================================================
     */

    await createCodOrder(
        orderData,
        payload
    );

}


/* =========================================================
   CREATE COD ORDER
========================================================= */

async function createCodOrder(
    orderData,
    payload
) {

    setSubmitLoading(true);


    try {

        console.log(
            'POST /orders - COD:',
            payload
        );


        const response =
            await fetchApi(
                '/orders',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify(
                            payload
                        )

                }
            );


        console.log(
            'RESPONSE /orders:',
            response
        );


        /*
         * =================================================
         * KIỂM TRA RESPONSE
         * =================================================
         */

        if (
            response &&
            response.success === false
        ) {

            throw new Error(
                response.message ||
                'Backend không thể tạo đơn hàng.'
            );

        }


        /*
         * =================================================
         * BACKEND THÀNH CÔNG
         * =================================================
         */

        saveOrderToHistory(
            orderData
        );


        removeSelectedCartItems();


        setSubmitLoading(false);


        showToast(
            'Đặt hàng thành công!',
            'success'
        );


        setTimeout(() => {

            window.location.href =
                '../orders/orders.html';

        }, 1200);


    } catch (error) {

        console.error(
            'CREATE COD ORDER ERROR:',
            error
        );


        setSubmitLoading(false);


        /*
         * Không xóa cart
         * Không lưu local
         * nếu backend thất bại.
         */

        showToast(
            `Không thể tạo đơn hàng: ${
                error?.message ||
                'Lỗi máy chủ.'
            }`,
            'error'
        );

    }

}


/* =========================================================
   START BANK PAYMENT
========================================================= */

async function startBankPayment(
    orderData,
    payload
) {

    setSubmitLoading(true);


    try {

        /*
         * =================================================
         * STEP 1
         * Tạo order trong MongoDB trước
         * =================================================
         */

        console.log(
            'POST /orders - BANK:',
            payload
        );


        const orderResponse =
            await fetchApi(
                '/orders',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify(
                            payload
                        )

                }
            );


        console.log(
            'ORDER RESPONSE:',
            orderResponse
        );


        if (
            orderResponse &&
            orderResponse.success === false
        ) {

            throw new Error(
                orderResponse.message ||
                'Không thể tạo đơn hàng.'
            );

        }


        /*
         * =================================================
         * STEP 2
         * Tạo payment
         * =================================================
         */

        let paymentData = {};


        try {

            const paymentResponse =
                await fetchApi(
                    '/payments/create',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify({

                                orderId:
                                    orderData.MaDH,

                                amount:
                                    orderData.TongThanhToan,

                                description:
                                    `LP ${orderData.MaDH}`

                            })

                    }
                );


            console.log(
                'PAYMENT RESPONSE:',
                paymentResponse
            );


            paymentData =
                paymentResponse?.data ||
                paymentResponse ||
                {};


        } catch (
            paymentError
        ) {

            console.warn(
                'Payment gateway lỗi:',
                paymentError
            );

        }


        /*
         * =================================================
         * CURRENT ORDER
         * =================================================
         */

        currentOrder = {

            ...orderData,

            PaymentId:
                paymentData?.paymentId ||
                paymentData?.PaymentId ||
                paymentData?.id ||
                null,

            QRCode:
                paymentData?.qrCodeUrl ||
                paymentData?.QRCode ||
                paymentData?.qrCode ||
                null

        };


        /*
         * =================================================
         * QR
         * =================================================
         */

        const qrUrl =
            currentOrder.QRCode ||
            generateDemoVietQR(
                orderData
            );


        showQrPaymentModal(
            currentOrder,
            qrUrl
        );


        /*
         * =================================================
         * POLLING
         * =================================================
         */

        startPaymentPolling(
            orderData.MaDH,
            currentOrder.PaymentId
        );


        setSubmitLoading(false);


    } catch (error) {

        console.error(
            'BANK ORDER ERROR:',
            error
        );


        currentOrder = null;

        stopPaymentPolling();

        setSubmitLoading(false);


        showToast(
            `Không thể tạo đơn hàng: ${
                error?.message ||
                'Lỗi máy chủ.'
            }`,
            'error'
        );

    }

}


/* =========================================================
   GENERATE VIETQR
========================================================= */

function generateDemoVietQR(
    orderData
) {

    const bankCode =
        'VCB';


    const accountNumber =
        '987654321000';


    const amount =
        Number(
            orderData.TongThanhToan
        );


    const description =
        `LP ${orderData.MaDH}`;


    return (
        `https://img.vietqr.io/image/` +
        `${bankCode}-${accountNumber}-compact2.png` +
        `?amount=${amount}` +
        `&addInfo=${encodeURIComponent(
            description
        )}` +
        `&accountName=THE%20LITTLE%20PRINCE%20SWEET%20BAKERY`
    );

}


/* =========================================================
   SHOW QR MODAL
========================================================= */

function showQrPaymentModal(
    orderData,
    qrUrl
) {

    const modal =
        document.getElementById(
            'qrPaymentModal'
        );


    if (!modal) {

        console.warn(
            'Không tìm thấy qrPaymentModal'
        );

        return;

    }


    const qrImage =
        document.getElementById(
            'paymentQrImage'
        );


    const amount =
        document.getElementById(
            'qrAmount'
        );


    const transferContent =
        document.getElementById(
            'qrTransferContent'
        );


    if (qrImage) {

        qrImage.src =
            qrUrl;

    }


    if (amount) {

        amount.textContent =
            formatVND(
                orderData.TongThanhToan
            );

    }


    if (transferContent) {

        transferContent.textContent =
            `LP ${orderData.MaDH}`;

    }


    modal.classList.add(
        'show'
    );


    document.body.style.overflow =
        'hidden';

}


/* =========================================================
   MODAL EVENTS
========================================================= */

function setupModalEvents() {

    const closeBtn =
        document.getElementById(
            'closeQrModal'
        );


    const cancelBtn =
        document.getElementById(
            'cancelQrPayment'
        );


    if (closeBtn) {

        closeBtn.addEventListener(
            'click',
            closeQrPaymentModal
        );

    }


    if (cancelBtn) {

        cancelBtn.addEventListener(
            'click',
            closeQrPaymentModal
        );

    }


    const confirmBtn =
        document.getElementById(
            'confirmQrPayment'
        );


    if (confirmBtn) {

        confirmBtn.addEventListener(
            'click',
            () => {

                stopPaymentPolling();

                if (currentOrder) {
                    saveOrderToHistory(currentOrder);
                }

                removeSelectedCartItems();

                closeQrPaymentModal();

                showToast(
                    'Đã ghi nhận thanh toán! Đơn hàng đang chờ xử lý.',
                    'success'
                );

                setTimeout(() => {
                    window.location.href = '../orders/orders.html';
                }, 1200);

            }
        );

    }


    const modal =
        document.getElementById(
            'qrPaymentModal'
        );


    if (modal) {

        modal.addEventListener(
            'click',
            event => {

                if (
                    event.target === modal
                ) {

                    closeQrPaymentModal();

                }

            }
        );

    }

}


/* =========================================================
   CLOSE QR MODAL
========================================================= */

function closeQrPaymentModal() {

    const modal =
        document.getElementById(
            'qrPaymentModal'
        );


    if (modal) {

        modal.classList.remove(
            'show'
        );

    }


    document.body.style.overflow =
        '';


    stopPaymentPolling();


    currentOrder = null;


    setSubmitLoading(false);

}


/* =========================================================
   START PAYMENT POLLING
========================================================= */

function startPaymentPolling(
    orderId,
    paymentId
) {

    stopPaymentPolling();


    /*
     * Không có paymentId:
     * không tự động xác nhận thanh toán.
     */

    if (!paymentId) {

        console.log(
            'Không có PaymentId - đang sử dụng QR demo.'
        );

        return;

    }


    paymentPolling =
        setInterval(
            async () => {

                try {

                    const status =
                        await checkPaymentStatus(
                            orderId,
                            paymentId
                        );


                    console.log(
                        'Payment status:',
                        status
                    );


                    if (
                        status === 'PAID' ||
                        status === 'SUCCESS' ||
                        status === 'COMPLETED'
                    ) {

                        await paymentSuccess(
                            orderId
                        );

                    }

                } catch (error) {

                    console.warn(
                        'Payment polling error:',
                        error
                    );

                }

            },
            3000
        );

}


/* =========================================================
   CHECK PAYMENT STATUS
========================================================= */

async function checkPaymentStatus(
    orderId,
    paymentId
) {

    if (!paymentId) {

        return 'PENDING';

    }


    const response =
        await fetchApi(
            `/payments/status/${encodeURIComponent(
                orderId
            )}`,
            {
                method: 'GET'
            }
        );


    return (
        response?.status ||
        response?.data?.status ||
        response?.TrangThai ||
        'PENDING'
    );

}


/* =========================================================
   PAYMENT SUCCESS
========================================================= */

async function paymentSuccess(
    orderId
) {

    stopPaymentPolling();


    if (!currentOrder) {

        return;

    }


    currentOrder.TrangThaiThanhToan =
        'Đã thanh toán';


    currentOrder.TrangThaiDonHang =
        'Chờ xác nhận';


    currentOrder.NgayCapNhat =
        new Date().toISOString();


    try {

        const response =
            await fetchApi(
                `/orders/${encodeURIComponent(
                    orderId
                )}`,
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({

                            TrangThaiThanhToan:
                                'Đã thanh toán',

                            TrangThaiDonHang:
                                'Chờ xác nhận',

                            NgayCapNhat:
                                currentOrder.NgayCapNhat

                        })

                }
            );


        console.log(
            'UPDATE ORDER:',
            response
        );


        if (
            response &&
            response.success === false
        ) {

            throw new Error(
                response.message ||
                'Không thể cập nhật đơn hàng.'
            );

        }


    } catch (error) {

        console.error(
            'UPDATE PAYMENT ERROR:',
            error
        );


        showToast(
            'Thanh toán thành công nhưng cập nhật đơn hàng thất bại.',
            'error'
        );

        return;

    }


    saveOrderToHistory(
        currentOrder
    );


    removeSelectedCartItems();


    showPaymentSuccess();


    setTimeout(() => {

        window.location.href =
            '../orders/orders.html';

    }, 1800);

}


/* =========================================================
   PAYMENT SUCCESS UI
========================================================= */

function showPaymentSuccess() {

    const waiting =
        document.querySelector(
            '.payment-waiting'
        );


    if (!waiting) {

        return;

    }


    waiting.innerHTML = `

        <i
            class="fa-solid fa-circle-check"
            style="
                color: var(--sage);
                font-size: 22px;
            ">
        </i>

        <div>

            <strong>
                Thanh toán thành công!
            </strong>

            <p>
                Đơn hàng đã được xác nhận.
                Đang chuyển đến đơn hàng của bạn...
            </p>

        </div>

    `;

}


/* =========================================================
   STOP POLLING
========================================================= */

function stopPaymentPolling() {

    if (paymentPolling) {

        clearInterval(
            paymentPolling
        );

        paymentPolling = null;

    }

}


/* =========================================================
   REMOVE SELECTED CART ITEMS
========================================================= */

function removeSelectedCartItems() {

    try {

        const cart =
            getCart();


        const remainingCart =
            cart.filter(
                item =>
                    item.Chon === false
            );


        saveCart(
            remainingCart
        );


        console.log(
            'Đã xóa sản phẩm đã đặt:',
            remainingCart
        );


    } catch (error) {

        console.error(
            'Lỗi xóa cart:',
            error
        );

    }

}


/* =========================================================
   SAVE ORDER HISTORY
========================================================= */

function saveOrderToHistory(
    order
) {

    if (
        !order ||
        !order.MaDH
    ) {

        console.warn(
            'Không thể lưu order local.'
        );

        return;

    }


    const user =
        getCurrentUser();


    const maKH =
        order.MaKH ||
        user?.MaKH ||
        user?.maKH ||
        user?.id ||
        user?._id ||
        user?.email ||
        'KH_GUEST';


    order.MaKH =
        maKH;


    const storageKey =
        `sweet_bakery_orders_${maKH}`;


    let orders = [];


    try {

        const oldData =
            localStorage.getItem(
                storageKey
            );


        if (oldData) {

            const parsed =
                JSON.parse(
                    oldData
                );


            if (
                Array.isArray(parsed)
            ) {

                orders =
                    parsed;

            }

        }

    } catch (error) {

        console.warn(
            'Không đọc được order history:',
            error
        );

        orders = [];

    }


    const existingIndex =
        orders.findIndex(
            item =>
                String(
                    item.MaDH
                ) ===
                String(
                    order.MaDH
                )
        );


    if (
        existingIndex !== -1
    ) {

        orders[
            existingIndex
        ] = {

            ...orders[
                existingIndex
            ],

            ...order

        };

    } else {

        orders.unshift(
            order
        );

    }


    localStorage.setItem(
        storageKey,
        JSON.stringify(
            orders
        )
    );


    console.log(
        'ORDER SAVED LOCAL:',
        storageKey,
        order
    );

}


/* =========================================================
   GENERATE ORDER CODE
========================================================= */

function generateOrderCode() {

    const timestamp =
        Date.now()
            .toString()
            .slice(-8);


    const random =
        Math.floor(
            10 +
            Math.random() * 90
        );


    return `DH${timestamp}${random}`;

}


/* =========================================================
   OPEN CUSTOMER FORM
========================================================= */

function openCustomerEditForm() {

    document
        .getElementById(
            'customerInfoView'
        )
        ?.classList.add(
            'hidden'
        );


    document
        .getElementById(
            'customerInfoForm'
        )
        ?.classList.remove(
            'hidden'
        );


    document
        .getElementById(
            'editInfoBtn'
        )
        ?.classList.add(
            'hidden'
        );

}


/* =========================================================
   SUBMIT LOADING
========================================================= */

function setSubmitLoading(
    isLoading
) {

    const button =
        document.getElementById(
            'submitOrderBtn'
        );


    if (!button) {

        return;

    }


    button.disabled =
        isLoading;


    if (isLoading) {

        button.innerHTML = `

            <span class="loading-spinner"></span>

            Đang xử lý...

        `;

        return;

    }


    button.innerHTML = `

        <span
            id="submitButtonText">
        </span>

    `;


    updatePaymentMethodUI();

}


/* =========================================================
   FORMAT MONEY
========================================================= */

function formatVND(
    value
) {

    const number =
        Number(value) || 0;


    return number.toLocaleString(
        'vi-VN'
    ) + ' ₫';

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ?? ''
    )
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