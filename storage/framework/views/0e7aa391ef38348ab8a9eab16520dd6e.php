<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $__env->yieldContent('title', 'Quản trị | The Little Prince'); ?></title>
    <link rel="stylesheet" href="<?php echo e(asset('admin/css/admin.css')); ?>">
    <link rel="stylesheet" href="<?php echo e(asset('css/account-menu.css')); ?>">
    <?php echo $__env->yieldContent('styles'); ?>
</head>
<body>
<script src="<?php echo e(asset('js/account-menu.js')); ?>"></script>
    <?php echo $__env->yieldContent('content'); ?>
    <?php echo $__env->yieldContent('scripts'); ?>
</body>
</html>
<?php /**PATH D:\baitap\lap_trinh_ma_nguon_mo\tool\laragon\www\Lavarel_BS_new\resources\views/layouts/admin.blade.php ENDPATH**/ ?>