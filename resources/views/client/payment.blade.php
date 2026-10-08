@extends('layouts.app')

@section('title', 'Thanh Toán | The Little Prince Sweet Bakery')

@section('styles')
    <link rel="stylesheet" href="{{ asset('css/payment.css') }}">
@endsection

@section('content')
<main class="payment-page">

    <div class="container">

        <header class="payment-header">

            <p class="eyebrow">
                XÁC NHẬN & THANH TOÁN
            </p>

            <h1>
                Hoàn Tất Đặt Bánh
            </h1>

            <p class="payment-description">
                Kiểm tra thông tin nhận hàng và lựa chọn phương thức thanh toán.
            </p>

        </header>


        <form id="paymentForm"
              class="payment-layout">


            <!-- ================= LEFT ================= -->

            <div class="payment-info-panel">


                <!-- THÔNG TIN NHẬN HÀNG -->

                <section class="checkout-card">

                    <div class="card-heading">

                        <div>

                            <span class="step-number">
                                1
                            </span>

                            <div>

                                <h2>
                                    Thông Tin Nhận Hàng
                                </h2>

                                <p class="section-description">
                                    Thông tin được lấy từ tài khoản của bạn
                                </p>

                            </div>

                        </div>

                        <button type="button"
                                class="edit-info-btn"
                                id="editInfoBtn">

                            <i class="fa-solid fa-pen"></i>

                            Chỉnh sửa

                        </button>

                    </div>


                    <!-- THÔNG TIN HIỂN THỊ -->

                    <div id="customerInfoView"
                         class="customer-info-view">

                        <div class="customer-info-row">

                            <span>
                                <i class="fa-regular fa-user"></i>
                                Người nhận
                            </span>

                            <strong id="displayFullName">
                                --
                            </strong>

                        </div>


                        <div class="customer-info-row">

                            <span>
                                <i class="fa-solid fa-phone"></i>
                                Số điện thoại
                            </span>

                            <strong id="displayPhone">
                                --
                            </strong>

                        </div>


                        <div class="customer-info-row">

                            <span>
                                <i class="fa-solid fa-location-dot"></i>
                                Địa chỉ
                            </span>

                            <strong id="displayAddress">
                                --
                            </strong>

                        </div>

                    </div>


                    <!-- FORM CHỈNH SỬA -->

                    <div id="customerInfoForm"
                         class="customer-info-form hidden">

                        <div class="form-group">

                            <label for="orderFullName">
                                Họ và tên người nhận *
                            </label>

                            <input
                                type="text"
                                id="orderFullName"
                                class="form-control"
                                placeholder="Nguyễn Văn A">

                        </div>


                        <div class="form-group">

                            <label for="orderPhone">
                                Số điện thoại *
                            </label>

                            <input
                                type="tel"
                                id="orderPhone"
                                class="form-control"
                                placeholder="0987654321">

                        </div>


                        <div class="form-group">

                            <label for="orderAddress">
                                Địa chỉ nhận bánh *
                            </label>

                            <textarea
                                id="orderAddress"
                                class="form-control"
                                rows="3"
                                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/TP"></textarea>

                        </div>


                        <div class="form-actions">

                            <button type="button"
                                    class="btn btn-light"
                                    id="cancelEditBtn">

                                Hủy

                            </button>

                            <button type="button"
                                    class="btn btn-primary"
                                    id="saveInfoBtn">

                                <i class="fa-solid fa-check"></i>

                                Lưu thông tin

                            </button>

                        </div>

                    </div>

                </section>


                <!-- GHI CHÚ -->

                <section class="checkout-card">

                    <div class="card-heading">

                        <div>

                            <span class="step-number">
                                2
                            </span>

                            <div>

                                <h2>
                                    Ghi Chú Đơn Hàng
                                </h2>

                                <p class="section-description">
                                    Yêu cầu riêng dành cho đơn bánh
                                </p>

                            </div>

                        </div>

                    </div>


                    <div class="form-group">

                        <label for="orderNotes">
                            Ghi chú cho cửa hàng
                        </label>

                        <textarea
                            id="orderNotes"
                            class="form-control"
                            rows="3"
                            placeholder="Ví dụ: Giao lúc 18h, viết lời chúc lên bánh..."></textarea>

                    </div>

                </section>


                <!-- PHƯƠNG THỨC THANH TOÁN -->

                <section class="checkout-card">

                    <div class="card-heading">

                        <div>

                            <span class="step-number">
                                3
                            </span>

                            <div>

                                <h2>
                                    Phương Thức Thanh Toán
                                </h2>

                                <p class="section-description">
                                    Chọn phương thức phù hợp với bạn
                                </p>

                            </div>

                        </div>

                    </div>


                    <div class="payment-methods">


                        <!-- COD -->

                        <label class="method-option active"
                               id="methodCod">

                            <input
                                type="radio"
                                name="paymentMethod"
                                value="COD"
                                checked>

                            <div class="method-icon">

                                <i class="fa-solid fa-money-bill-wave"></i>

                            </div>

                            <div class="method-content">

                                <strong>
                                    Thanh toán khi nhận hàng
                                </strong>

                                <p>
                                    Thanh toán bằng tiền mặt cho shipper khi nhận bánh.
                                </p>

                            </div>

                            <i class="fa-solid fa-circle-check method-check"></i>

                        </label>


                        <!-- BANK -->

                        <label class="method-option"
                               id="methodBank">

                            <input
                                type="radio"
                                name="paymentMethod"
                                value="BANK">

                            <div class="method-icon">

                                <i class="fa-solid fa-qrcode"></i>

                            </div>

                            <div class="method-content">

                                <strong>
                                    Chuyển khoản ngân hàng
                                </strong>

                                <p>
                                    Quét mã QR để thanh toán nhanh chóng.
                                </p>

                            </div>

                            <i class="fa-solid fa-circle-check method-check"></i>

                        </label>

                    </div>

                </section>

            </div>


            <!-- ================= RIGHT ================= -->

            <aside class="checkout-card order-summary-panel">

                <div class="summary-title">

                    <h2>
                        Đơn Bánh Của Bạn
                    </h2>

                    <span id="paymentItemCount">
                        0 sản phẩm
                    </span>

                </div>


                <div class="order-items-list"
                     id="paymentItemsList">

                    <!-- JS render -->

                </div>


                <div class="summary-breakdown">

                    <!-- MÃ GIẢM GIÁ -->
                    <div class="voucher-box">
                        <div class="voucher-header-title">
                            <i class="fa-solid fa-ticket"></i>
                            <span>Mã giảm giá / Ưu đãi</span>
                        </div>
                        <div class="voucher-input-row">
                            <input
                                type="text"
                                id="discountCodeInput"
                                class="form-control voucher-input"
                                placeholder="Nhập mã ưu đãi (ví dụ: KM001)...">
                            <button
                                type="button"
                                id="applyVoucherBtn"
                                class="btn voucher-apply-btn">
                                Áp dụng
                            </button>
                        </div>
                        <div id="voucherMessage" class="voucher-message hidden"></div>
                        <div id="availableVouchersList" class="available-vouchers-list"></div>
                    </div>

                    <div class="summary-row">

                        <span>
                            Tổng tiền hàng
                        </span>

                        <span id="paySubtotal">
                            0 ₫
                        </span>

                    </div>


                    <div class="summary-row">

                        <span>
                            Giảm giá
                        </span>

                        <span id="payDiscount" class="discount-value">
                            0 ₫
                        </span>

                    </div>


                    <div class="summary-row">

                        <span>
                            Phí vận chuyển
                        </span>

                        <span id="payShipping">
                            30.000 ₫
                        </span>

                    </div>


                    <div class="summary-row total">

                        <span>
                            Tổng thanh toán
                        </span>

                        <strong id="payTotal">
                            0 ₫
                        </strong>

                    </div>

                </div>


                <button
                    type="submit"
                    class="btn btn-primary btn-submit-order"
                    id="submitOrderBtn">

                    <span id="submitButtonText">
                        Xác Nhận Đặt Hàng
                    </span>

                    <i class="fa-solid fa-arrow-right"></i>

                </button>


                <div class="secure-payment">

                    <i class="fa-solid fa-shield-halved"></i>

                    Thông tin thanh toán được bảo mật

                </div>

            </aside>

        </form>

    </div>

</main>


<!-- ================= QR MODAL ================= -->

<div class="payment-modal"
     id="qrPaymentModal">

    <div class="payment-modal-overlay"></div>

    <div class="payment-modal-content">

        <button
            type="button"
            class="modal-close"
            id="closeQrModal">

            <i class="fa-solid fa-xmark"></i>

        </button>


        <div class="qr-header">

            <div class="qr-success-icon">

                <i class="fa-solid fa-qrcode"></i>

            </div>

            <h2>
                Quét mã để thanh toán
            </h2>

            <p>
                Sử dụng ứng dụng ngân hàng để quét mã QR bên dưới.
            </p>

        </div>


        <div class="qr-code-container">

            <img
                id="paymentQrImage"
                src=""
                alt="QR thanh toán">

        </div>


        <div class="qr-payment-amount">

            <span>
                Số tiền thanh toán
            </span>

            <strong id="qrAmount">
                0 ₫
            </strong>

        </div>


        <div class="bank-transfer-info">

            <div>

                <span>
                    Ngân hàng
                </span>

                <strong>
                    Vietcombank
                </strong>

            </div>


            <div>

                <span>
                    Số tài khoản
                </span>

                <strong>
                    1040408564
                </strong>

            </div>


            <div>

                <span>
                    Chủ tài khoản
                </span>

                <strong>
                    LE MINH THUC
                </strong>

            </div>


            <div>

                <span>
                    Nội dung
                </span>

                <strong id="qrTransferContent">
                    --
                </strong>

            </div>

        </div>


        <div class="payment-waiting">

            <div>

                <strong>
                    Đang chờ thanh toán...
                </strong>

                <p>
                    Hệ thống sẽ tự động xác nhận khi nhận được thanh toán.
                </p>

            </div>

        </div>


        <div class="qr-action-buttons">
            <button
                type="button"
                class="btn btn-primary qr-confirm-btn"
                id="confirmQrPayment">
                <i class="fa-solid fa-circle-check"></i>
                Tôi đã chuyển khoản
            </button>

            <button
                type="button"
                class="btn btn-light qr-cancel-btn"
                id="cancelQrPayment">
                Đóng
            </button>
        </div>

    </div>

</div>



@endsection

@section('scripts')
    <script src="{{ asset('js/payment.js') }}"></script>
@endsection
