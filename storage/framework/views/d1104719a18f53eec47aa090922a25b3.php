

<?php $__env->startSection('title', 'AI Dự báo doanh thu | The Little Prince'); ?>

<?php $__env->startSection('styles'); ?>
    <link rel="stylesheet" href="<?php echo e(asset('admin/css/forecast.css')); ?>">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('scripts'); ?>
    <script type="module" src="<?php echo e(asset('admin/js/forecast/forecast.js')); ?>"></script>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.admin', \Illuminate\Support\Arr::except(get_defined_vars(), ['__data', '__path']))->render(); ?><?php /**PATH D:\baitap\lap_trinh_ma_nguon_mo\tool\laragon\www\Lavarel_BS_new\resources\views/admin/forecast.blade.php ENDPATH**/ ?>