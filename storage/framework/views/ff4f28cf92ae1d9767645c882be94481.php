

<?php $__env->startSection('title', 'Giỏ Hàng | The Little Prince Sweet Bakery'); ?>

<?php $__env->startSection('styles'); ?>
    <link rel="stylesheet" href="<?php echo e(asset('css/cart.css')); ?>">
<?php $__env->stopSection(); ?>

<?php $__env->startSection('content'); ?>
<main class="cart-page">
    <div class="container">
        <!-- PAGE HEADER -->
        <header class="cart-header">
            <div class="cart-heading-copy">
                <p class="eyebrow">GIỎ HÀNG CỦA BẠN</p>
                <h1>Giỏ Hàng Thưởng Thức</h1>
                <p class="cart-header-description">
                    Những món bánh bạn yêu thích đang chờ được mang đến bàn tiệc của bạn.
                </p>
            </div>

            <a href="<?php echo e(route('menu')); ?>" class="continue-shopping">
                <i class="fa-solid fa-arrow-left"></i>
                Tiếp tục mua sắm
            </a>
        </header>

        <!-- CART -->
        <div class="cart-layout" id="cartLayout">
            <div class="loading-spinner cart-loading">
                <div class="spinner"></div>
                <p>Đang tải giỏ hàng...</p>
            </div>
        </div>
    </div>
</main>

<!-- DELETE CONFIRMATION OVERLAY -->
<div class="delete-modal" id="deleteModal" aria-hidden="true">
    <div class="delete-modal-backdrop" id="deleteModalBackdrop"></div>
    <div class="delete-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="deleteModalTitle">
        <button type="button" class="delete-modal-close" id="deleteModalClose" aria-label="Đóng">
            <i class="fa-solid fa-xmark"></i>
        </button>

        <div class="delete-modal-icon">
            <i class="fa-regular fa-trash-can"></i>
        </div>

        <h2 id="deleteModalTitle">Xóa sản phẩm khỏi giỏ?</h2>
        <p class="delete-modal-message" id="deleteModalMessage">
            Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?
        </p>

        <div class="delete-modal-actions">
            <button type="button" class="delete-modal-btn delete-modal-cancel" id="cancelDeleteBtn">
                Giữ lại
            </button>
            <button type="button" class="delete-modal-btn delete-modal-confirm" id="confirmDeleteBtn">
                <i class="fa-regular fa-trash-can"></i>
                Xóa sản phẩm
            </button>
        </div>
    </div>
</div>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('scripts'); ?>
    <script src="<?php echo e(asset('js/cart.js')); ?>"></script>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', \Illuminate\Support\Arr::except(get_defined_vars(), ['__data', '__path']))->render(); ?><?php /**PATH D:\baitap\lap_trinh_ma_nguon_mo\tool\laragon\www\Lavarel_BS_new\resources\views/client/cart.blade.php ENDPATH**/ ?>