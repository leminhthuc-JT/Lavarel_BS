<?php $__env->startSection('title', 'Lịch Sử Đơn Hàng | The Little Prince Sweet Bakery'); ?>

<?php $__env->startSection('styles'); ?>
    <link rel="stylesheet" href="<?php echo e(asset('css/orders.css')); ?>">
<?php $__env->stopSection(); ?>

<?php $__env->startSection('content'); ?>
<main class="orders-page">
    <div class="container">
        <header class="orders-header">
            <p class="eyebrow">QUẢN LÝ ĐƠN HÀNG</p>
            <h1>Lịch Sử Đặt Bánh</h1>
        </header>

        <div class="orders-list" id="ordersContainer">
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Đang tải danh sách đơn hàng...</p>
            </div>
        </div>
    </div>
</main>

<!-- ORDER DETAIL MODAL -->
<div class="modal-overlay" id="orderModal" style="display:none;">
    <div class="modal-content">
        <div class="modal-header">
            <h3 id="modalTitle">Chi Tiết Đơn Hàng #</h3>
            <button class="modal-close" onclick="closeOrderModal()">✕</button>
        </div>
        <div class="modal-body" id="modalBody"></div>
    </div>
</div>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('scripts'); ?>
    <script src="<?php echo e(asset('js/orders.js')); ?>"></script>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', \Illuminate\Support\Arr::except(get_defined_vars(), ['__data', '__path']))->render(); ?><?php /**PATH D:\hk7\LapTrinhMaNguonMo\laragon\www\Bakery_Shop\resources\views/client/orders.blade.php ENDPATH**/ ?>