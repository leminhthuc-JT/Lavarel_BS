
<?php $__env->startSection('title', 'Bình luận khách hàng | The Little Prince'); ?>
<?php $__env->startSection('styles'); ?>
<meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">
<link rel="stylesheet" href="<?php echo e(asset('admin/css/reviews.css')); ?>">
<?php $__env->stopSection(); ?>
<?php $__env->startSection('scripts'); ?>
<script type="module" src="<?php echo e(asset('admin/js/reviews/reviews.js')); ?>"></script>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.admin', \Illuminate\Support\Arr::except(get_defined_vars(), ['__data', '__path']))->render(); ?><?php /**PATH D:\baitap\lap_trinh_ma_nguon_mo\tool\laragon\www\Lavarel_BS_new\resources\views/admin/reviews.blade.php ENDPATH**/ ?>