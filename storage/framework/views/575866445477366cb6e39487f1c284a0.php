<header class="site-header">
    <div class="container nav-wrap">
        <a href="<?php echo e(route('home')); ?>" class="logo">
            <span class="logo-script"><img src="<?php echo e(asset('assets/logo.png')); ?>" alt="The Little Prince Logo" width="80"></span>
        </a>

        <button class="menu-toggle" id="menuToggle" aria-label="Mở menu"><i class="fa-solid fa-bars"></i></button>

        <nav class="main-nav" id="mainNav">
            <a href="<?php echo e(route('home')); ?>" class="<?php echo e(request()->routeIs('home') ? 'active' : ''); ?>" data-nav="home">Trang chủ</a>
            <a href="<?php echo e(route('menu')); ?>" class="<?php echo e(request()->routeIs('menu') ? 'active' : ''); ?>" data-nav="menu">Sản phẩm</a>
            <a href="<?php echo e(route('categories')); ?>" class="<?php echo e(request()->routeIs('categories') ? 'active' : ''); ?>" data-nav="categories">Danh mục</a>
            <a href="<?php echo e(route('about')); ?>" class="<?php echo e(request()->routeIs('about') ? 'active' : ''); ?>" data-nav="about">Về chúng tôi</a>
            <a href="<?php echo e(route('contact')); ?>" class="<?php echo e(request()->routeIs('contact') ? 'active' : ''); ?>" data-nav="contact">Liên hệ</a>
        </nav>

        <div class="nav-actions">
            <a href="<?php echo e(route('menu')); ?>" class="nav-icon-btn" title="Tìm kiếm" aria-label="Tìm kiếm"><i class="fa-solid fa-magnifying-glass"></i></a>
            <a href="<?php echo e(route('favorites')); ?>" class="nav-icon-btn" title="Yêu thích" aria-label="Yêu thích">
                <i class="fa-regular fa-heart"></i><span class="badge-count like-count">0</span>
            </a>
            <a href="<?php echo e(route('cart')); ?>" class="nav-icon-btn" title="Giỏ hàng" aria-label="Giỏ hàng">
                <i class="fa-solid fa-bag-shopping"></i><span class="badge-count cart-count">0</span>
            </a>
            <button class="avatar-btn" id="headerAvatarBtn" title="Tài khoản"><i class="fa-regular fa-user"></i></button>
        </div>
    </div>
</header>
<?php /**PATH D:\hk7\LapTrinhMaNguonMo\laragon\www\Bakery_Shop\resources\views/components/header.blade.php ENDPATH**/ ?>