<header class="site-header">
    <div class="container nav-wrap">
        <a href="{{ route('home') }}" class="logo">
            <span class="logo-script"><img src="{{ asset('admin/assets/brand-logo.png') }}" alt="The Little Prince Logo" width="112" height="55"></span>
        </a>

        <button class="menu-toggle" id="menuToggle" aria-label="Mở menu"><i class="fa-solid fa-bars"></i></button>

        <nav class="main-nav" id="mainNav">
            <a href="{{ route('home') }}" class="{{ request()->routeIs('home') ? 'active' : '' }}" data-nav="home">Trang chủ</a>
            <a href="{{ route('menu') }}" class="{{ request()->routeIs('menu') ? 'active' : '' }}" data-nav="menu">Sản phẩm</a>
            <a href="{{ route('categories') }}" class="{{ request()->routeIs('categories') ? 'active' : '' }}" data-nav="categories">Danh mục</a>
            <a href="{{ route('about') }}" class="{{ request()->routeIs('about') ? 'active' : '' }}" data-nav="about">Về chúng tôi</a>
            <a href="{{ route('contact') }}" class="{{ request()->routeIs('contact') ? 'active' : '' }}" data-nav="contact">Liên hệ</a>
        </nav>

        <div class="nav-actions">
            <a href="{{ route('menu') }}" class="nav-icon-btn" title="Tìm kiếm" aria-label="Tìm kiếm"><i class="fa-solid fa-magnifying-glass"></i></a>
            <a href="{{ route('favorites') }}" class="nav-icon-btn" title="Yêu thích" aria-label="Yêu thích">
                <i class="fa-regular fa-heart"></i><span class="badge-count like-count">0</span>
            </a>
            <a href="{{ route('cart') }}" class="nav-icon-btn" title="Giỏ hàng" aria-label="Giỏ hàng">
                <i class="fa-solid fa-bag-shopping"></i><span class="badge-count cart-count">0</span>
            </a>
            <button class="avatar-btn" id="headerAvatarBtn" data-account-role="{{ data_get(request()->attributes->get('account'), 'TaiKhoan.Quyen.MaQ', '') }}" title="Tài khoản"><i class="fa-regular fa-user"></i></button>
        </div>
    </div>
</header>
