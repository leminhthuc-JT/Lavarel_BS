

<?php $__env->startSection('title', 'Sản Phẩm Yêu Thích | The Little Prince Sweet Bakery'); ?>

<?php $__env->startSection('styles'); ?>
    <link rel="stylesheet" href="<?php echo e(asset('css/like.css')); ?>">
<?php $__env->stopSection(); ?>

<?php $__env->startSection('content'); ?>
<main class="like-page">
    <div class="container">

        <header class="like-header">
            <p class="eyebrow">BÁNH YÊU THÍCH CỦA BẠN</p>
            <div class="title-row">
                <span class="title-line left"></span>
                <h1>Danh Sách Yêu Thích <i class="fa-solid fa-heart"></i></h1>
                <span class="title-line right"></span>
            </div>
            <p class="like-subtitle">Những chiếc bánh bạn đã lưu lại để đặt vào dịp thật đặc biệt.</p>
        </header>

        <div class="product-grid" id="likeGrid">
            <div class="loading-spinner" style="grid-column: 1 / -1;">
                <div class="spinner"></div>
                <p>Đang tải danh sách yêu thích...</p>
            </div>
        </div>

    </div>
</main>

<!-- FOOTER -->

<?php $__env->stopSection(); ?>

<?php $__env->startSection('scripts'); ?>
    <script src="<?php echo e(asset('js/like.js')); ?>"></script>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', \Illuminate\Support\Arr::except(get_defined_vars(), ['__data', '__path']))->render(); ?><?php /**PATH D:\baitap\lap_trinh_ma_nguon_mo\tool\laragon\www\Lavarel_BS_new\resources\views/client/like.blade.php ENDPATH**/ ?>