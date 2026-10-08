

<?php $__env->startSection('title', 'The Little Prince / Sweet Bakery - Tiệm Bánh Ngọt Thủ Công'); ?>

<?php $__env->startSection('styles'); ?>
    <link rel="stylesheet" href="<?php echo e(asset('css/home.css')); ?>">
<?php $__env->stopSection(); ?>

<?php $__env->startSection('content'); ?>
<main>
    <!-- HERO SECTION -->
    <section class="hero">
        <div class="container hero-grid">
            <div class="hero-copy">
                <p class="eyebrow">NGHỆ THUẬT BÁNH THỦ CÔNG</p>
                <h1 style="color: #5C4033;">Một chút <in style="color:#50695F ;">ngọt ngào,</in><br>cho ngày thật đẹp.</h1>
                <p class="hero-desc">
                    Khám phá thế giới bánh ngọt tinh tế được chế tác tỉ mỉ mỗi ngày
                    từ bếp bánh của Hoàng Tử Bé. Chúng tôi kết hợp nguyên liệu
                    thượng hạng cùng sự chân thành để tạo nên những hạnh phúc trọn vẹn.
                </p>
                <div class="hero-buttons">
                    <a href="<?php echo e(route("menu")); ?>" class="btn btn-primary">Khám phá thực đơn <i class="fa-solid fa-arrow-right"></i></a>
                    <a href="<?php echo e(route("about")); ?>" class="btn btn-outline">Câu chuyện của chúng tôi</a>
                </div>
            </div>

            <div class="hero-image image-frame">
                <img src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1000&q=85"
                     alt="Bánh kem thủ công Little Prince" id="heroImage">
            </div>
        </div>
    </section>

    <!-- FEATURED CATEGORIES SECTION -->
    <section class="categories section" id="categories">
        <div class="container">
            <div class="section-heading">
                <h2>Khám phá danh mục bánh nổi bật</h2>
                <p>Thế giới đồ ngọt đa dạng chinh phục mọi khẩu vị, cho từng buổi tiệc và dịp đặc biệt.</p>
            </div>

            <div class="category-grid" id="categoryContainer">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Đang tải danh mục bánh...</p>
                </div>
            </div>
        </div>
    </section>

    <!-- FEATURED PRODUCTS SECTION -->
    <section class="products section">
        <div class="container">
            <div class="section-heading product-heading">
                <div>
                    <p class="eyebrow">MỖI NGÀY MỘT NIỀM VUI</p>
                    <h2>Bánh mới ra mắt hôm nay</h2>
                    <p>Những sáng tạo tươi mới vừa rời lò, mang hương vị ngọt ngào đến bạn.</p>
                </div>
                <a href="<?php echo e(route("menu")); ?>" class="btn btn-outline btn-sm">Xem toàn bộ thực đơn <i class="fa-solid fa-arrow-right"></i></a>
            </div>

            <div class="product-grid" id="productContainer">
                <div class="loading-spinner" style="grid-column: 1 / -1;">
                    <div class="spinner"></div>
                    <p>Đang tải danh sách bánh tươi mới...</p>
                </div>
            </div>
        </div>
    </section>

    <!-- BRAND STORY SECTION -->
    <section class="story section" id="story">
        <div class="container story-grid">
            <div class="story-image image-frame">
                <img src="<?php echo e(asset("assets/")); ?>/theShop.png" alt="Cửa hàng Little Prince">
            </div>
            <div class="story-copy">
                <p class="eyebrow">VỀ CHÚNG TÔI</p>
                <h2><b>Câu chuyện lãng mạn từ <b style="color: #50695F;">Little Prince</b></b></h2>
                <p>Khởi nguồn từ giấc mơ mang hương vị bánh ngọt chuẩn vị Pháp đến gần hơn với những tâm hồn yêu ẩm thực Việt Nam, The Little Prince Pâtisserie bắt đầu từ những nguyên liệu nhỏ bé nhưng chứa đựng đam mê mãnh liệt.</p>
                <p>Chúng tôi coi mỗi chiếc bánh là một tác phẩm nghệ thuật cần sự kiên nhẫn, nâng niu từng giác quan để biến mỗi ngày bình thường của bạn trở nên thật đặc biệt.</p>
                <a href="<?php echo e(route("about")); ?>" class="btn btn-primary">Tìm hiểu câu chuyện <i class="fa-solid fa-arrow-right"></i></a>
            </div>
        </div>
    </section>

    <!-- COLLECTION BANNER -->
    <section class="feature-banner">
        <div class="container feature-grid">
            <div>
                <p class="eyebrow">BỘ SƯU TẬP MÙA THU</p>
                <h2><b>Mùa Trung Thu – Trọn Vẹn Hương Vị Đoàn Viên</b></h2>
                <p>Trung Thu – mùa của trăng tròn, sum vầy và những khoảnh khắc ấm áp bên gia đình. Khám phá bộ sưu tập bánh Trung Thu đặc biệt với lớp vỏ mềm thơm, nhân bánh tinh tế và hương vị đậm đà, được chăm chút để trao gửi những lời chúc đoàn viên, yêu thương và hạnh phúc đến những người thân yêu.</p>
                <a href="<?php echo e(route("menu")); ?>" class="btn btn-dark">Thưởng thức ngay</a>
            </div>
            <div class="feature-image image-frame">
                <img src="<?php echo e(asset("assets/")); ?>/bttt02_3.png" alt="Tiệc trà chiều Hoàng Gia">
            </div>
        </div>
    </section>

    <!-- QUALITY COMMITMENTS -->
    <section class="quality section">
        <div class="container">
            <div class="title-line">
                <h2><b>Bảo chứng chất lượng vàng</b></h2>
                <span></span>
            </div>

            <div class="quality-list">
                <div class="quality-item">
                    <span>1</span>
                    <div>
                        <strong><b>Nguyên liệu tuyển chọn 100%</b></strong>
                        <p>Bơ Pháp cao cấp, socola Bỉ và trái cây tươi được nhập khẩu chính ngạch mỗi ngày.</p>
                    </div>
                </div>
                <div class="quality-item">
                    <span>2</span>
                    <div>
                        <strong><b>Mẻ bánh tươi nướng mới mỗi sáng</b></strong>
                        <p>Không bánh cũ, không chất bảo quản, giữ trọn hương vị nguyên bản thơm ngon nhất.</p>
                    </div>
                </div>
                <div class="quality-item">
                    <span>3</span>
                    <div>
                        <strong><b>Thợ làm bánh lành nghề &amp; Tâm huyết</b></strong>
                        <p>Đội ngũ nghệ nhân bánh được đào tạo bài bản, nâng niu từng chi tiết nhỏ nhất.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- WHY CHOOSE US -->
    <section class="why-us section">
        <div class="container">
            <div class="section-heading">
                <h2>Vì sao chọn Little Prince?</h2>
                <p><i>Quy trình làm bánh bằng cả trái tim, chú trọng nhất trải nghiệm của bạn.</i></p>
            </div>

            <div class="why-grid">
                <div class="why-card">
                    <span class="why-icon"><i class="fa-solid fa-hand-sparkles"></i></span>
                    <h3>Nghệ thuật thủ công</h3>
                    <p>Mỗi chiếc bánh là một tác phẩm được nhào nặn tỉ mỉ, đong đầy tâm huyết.</p>
                </div>

                <div class="why-card">
                    <span class="why-icon"><i class="fa-solid fa-leaf"></i></span>
                    <h3>Nguyên vị tự nhiên</h3>
                    <p>Độ ngọt thanh nhẹ, không ngấy, bảo vệ sức khỏe và hương vị tự nhiên.</p>
                </div>

                <div class="why-card">
                    <span class="why-icon"><i class="fa-solid fa-truck-fast"></i></span>
                    <h3>Giao hàng an toàn</h3>
                    <p>Đội ngũ giao hàng chuyên nghiệp, bảo quản lạnh giữ nguyên dáng bánh.</p>
                </div>

                <div class="why-card">
                    <span class="why-icon"><i class="fa-solid fa-gift"></i></span>
                    <h3>Hộp quà sang trọng</h3>
                    <p>Bao bì tinh tế, lãng mạn thích hợp làm quà tặng cho những người thân yêu.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- NEWSLETTER -->
    <section class="newsletter">
        <div class="container">
            <h2><b>Nhận tin ngọt ngào</b></h2>
            <p><i>Đăng ký email để nhận thông báo sớm nhất về các đợt bánh giới hạn và ưu đãi đặc biệt!</i></p>
            <form id="newsletterForm">
                <input type="email" placeholder="Nhập email của bạn tại đây..." required>
                <button type="submit" class="btn btn-primary"><b>Nhận tin nhóa!!!</b></button>
            </form>
        </div>
    </section>
</main>


<?php $__env->stopSection(); ?>

<?php $__env->startSection('scripts'); ?>
    <script src="<?php echo e(asset('js/home.js')); ?>"></script>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', \Illuminate\Support\Arr::except(get_defined_vars(), ['__data', '__path']))->render(); ?><?php /**PATH D:\hk7\LapTrinhMaNguonMo\laragon\www\Bakery_Shop\resources\views/client/home.blade.php ENDPATH**/ ?>