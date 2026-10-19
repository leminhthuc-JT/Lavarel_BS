

<?php $__env->startSection('title', 'Danh Mục Bánh | The Little Prince Sweet Bakery'); ?>

<?php $__env->startSection('styles'); ?>
    <link rel="stylesheet" href="<?php echo e(asset('css/cate.css')); ?>">
<?php $__env->stopSection(); ?>

<?php $__env->startSection('content'); ?>
<main class="cate-page">
    <header class="cate-header">
            <p class="eyebrow">BÁNH TƯƠI MỖI NGÀY</p>
            <h1>Danh Mục Sản Phẩm</h1>
            <p class="cate-subtitle">Khám phá các thế giới đồ ngọt phong phú được chuẩn bị tươi mới mỗi sáng tại tiệm bánh Little Prince.</p>
        </header>
    <div class="container">
        
        

        <!-- CATEGORIES GRID -->
        <section class="cate-grid" id="categoryGrid">
            <div class="loading-spinner" style="grid-column: 1 / -1;">
                <div class="spinner"></div>
                <p>Đang tải danh mục sản phẩm...</p>
            </div>
        </section>

    </div>
</main>


<?php $__env->stopSection(); ?>

<?php $__env->startSection('scripts'); ?>
    <script src="<?php echo e(asset('js/cate.js')); ?>"></script>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', \Illuminate\Support\Arr::except(get_defined_vars(), ['__data', '__path']))->render(); ?><?php /**PATH D:\baitap\lap_trinh_ma_nguon_mo\tool\laragon\www\Lavarel_BS_new\resources\views/client/categories.blade.php ENDPATH**/ ?>