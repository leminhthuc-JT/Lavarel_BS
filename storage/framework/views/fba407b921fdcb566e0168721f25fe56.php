

<?php $__env->startSection('title', 'The Little Prince / Sweet Bakery - Tiệm Bánh Ngọt Thủ Công'); ?>

<?php $__env->startSection('styles'); ?>
    <link rel="stylesheet" href="<?php echo e(asset('css/home.css')); ?>">
    <link rel="stylesheet" href="<?php echo e(asset('css/hero-star-trail.css')); ?>">
    <link rel="stylesheet" href="<?php echo e(asset('css/hero-editorial.css')); ?>">
<?php $__env->stopSection(); ?>

<?php $__env->startSection('content'); ?>
<main>
    <!-- HERO SECTION -->
    <?php
        $heroSlides = [
            ['title' => ['SWEET', 'MOMENTS'], 'asset' => 'strawberry', 'garnish' => 'berry', 'name' => 'Bánh kem dâu',
             'alt' => 'Bánh kem nhiều lớp phủ dâu đỏ, ảnh tách nền từ bộ ảnh của tiệm',
             'details' => [['Dâu & kem', 'Điểm nhấn đỏ mọng trên lớp kem trắng.'], ['Từng lớp bánh', 'Những tầng bánh xen kẽ lớp kem mềm.'], ['Một chút ngọt ngào', 'Cho cuộc hẹn và những ngày thật đẹp.']]],
            ['title' => ['CHOCOLATE', 'DREAMS'], 'asset' => 'chocolate', 'garnish' => 'chocolate', 'name' => 'Bánh chocolate',
             'alt' => 'Bánh chocolate nhiều lớp, phủ chocolate chảy và hạt trang trí',
             'details' => [['Chocolate', 'Lớp phủ óng mượt, sắc nâu ấm áp.'], ['Tầng bánh mềm', 'Kết cấu nhiều lớp đầy cuốn hút.'], ['Khoảnh khắc sẻ chia', 'Một chiếc bánh cho những người thương.']]],
            ['title' => ['LITTLE', 'DELIGHTS'], 'asset' => 'donut', 'garnish' => 'candy', 'name' => 'Donut hồng',
             'alt' => 'Bộ bánh donut phủ đường hồng cùng cốm màu, nền trong suốt',
             'details' => [['Sắc hồng dịu ngọt', 'Lớp phủ hồng cùng những hạt cốm màu.'], ['Nhỏ xinh, vui mắt', 'Những vòng bánh tròn đầy đáng yêu.'], ['Niềm vui bé nhỏ', 'Thêm một chút ngọt ngào cho buổi trà.']]],
            ['title' => ['MADE WITH', 'LOVE'], 'asset' => 'handcrafted', 'garnish' => 'almond', 'name' => 'Bánh cuộn thủ công',
             'alt' => 'Bánh cuộn phủ kem, caramel và hạnh nhân từ ảnh sản phẩm hiện có',
             'details' => [['Caramel & hạnh nhân', 'Lớp phủ vàng nâu cùng hạt hạnh nhân.'], ['Dấu ấn thủ công', 'Những đường kem mềm, tự nhiên.'], ['Làm bằng yêu thương', 'Một chút chăm chút trong từng chiếc bánh.']]],
        ];
    ?>
    <section class="hero romantic-hero" data-romantic-hero data-star-trail aria-label="Bộ sưu tập bánh The Little Prince" aria-roledescription="carousel">
        <div class="romantic-hero__stage">
            <div class="romantic-hero__slides">
                <?php $__currentLoopData = $heroSlides; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $i => $slide): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <div class="romantic-slide <?php echo e($i === 0 ? 'is-active' : ''); ?>" data-slide="<?php echo e($i); ?>" data-name="<?php echo e($slide['name']); ?>" <?php if($i !== 0): ?> hidden <?php endif; ?>>
                        <div class="romantic-slide__headline" aria-hidden="true"><span><?php echo e($slide['title'][0]); ?></span> <span><?php echo e($slide['title'][1]); ?></span></div>
                        <figure class="romantic-slide__product">
                            <img src="<?php echo e(asset('assets/hero/' . $slide['asset'] . '.webp')); ?>" alt="<?php echo e($slide['alt']); ?>" width="1254" height="1254" decoding="async" <?php if($i === 0): ?> fetchpriority="high" <?php endif; ?>>
                        </figure>
                        <div class="romantic-slide__garnishes" aria-hidden="true">
                            <?php for($g = 0; $g < 3; $g++): ?>
                                <img src="<?php echo e(asset('assets/hero/garnish-' . $slide['garnish'] . '.webp')); ?>" width="96" height="96" alt="" decoding="async" draggable="false">
                            <?php endfor; ?>
                        </div>
                        <div class="romantic-slide__details">
                            <?php $__currentLoopData = $slide['details']; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $j => $detail): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                <div class="romantic-slide__detail" style="--detail-order: <?php echo e($j); ?>"><span class="romantic-slide__detail-number">0<?php echo e($j + 1); ?></span><div><h2><?php echo e($detail[0]); ?></h2><p><?php echo e($detail[1]); ?></p></div></div>
                            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                        </div>
                    </div>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
            </div>
            <div class="romantic-hero__copy">
                <p class="romantic-hero__eyebrow">NGHỆ THUẬT BÁNH THỦ CÔNG</p>
                <h1>Một chút ngọt ngào,<br>cho ngày thật đẹp.</h1>
                <p>Bánh thủ công và chút tinh tế kiểu Pháp. Từ bếp bánh Hoàng Tử Bé, gửi bạn những khoảnh khắc dịu ngọt.</p>
                <div class="romantic-hero__links">
                    <a href="<?php echo e(route('menu')); ?>" class="romantic-hero__primary">Khám phá thực đơn <span aria-hidden="true">↗</span></a>
                    <a href="<?php echo e(route('about')); ?>" class="romantic-hero__story">Câu chuyện của chúng tôi</a>
                </div>
            </div>
            <div class="romantic-hero__shadow" aria-hidden="true"></div>
            <div class="romantic-hero__selector" role="group" aria-label="Chọn bánh nổi bật">
                <?php $__currentLoopData = $heroSlides; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $i => $slide): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <button type="button" class="romantic-hero__thumb" data-hero-select="<?php echo e($i); ?>" aria-label="<?php echo e($slide['title'][0] . ' ' . $slide['title'][1]); ?> — <?php echo e($slide['name']); ?>" aria-current="<?php echo e($i === 0 ? 'true' : 'false'); ?>" title="<?php echo e($slide['name']); ?>">
                        <img src="<?php echo e(asset('assets/hero/' . $slide['asset'] . '.webp')); ?>" width="64" height="64" alt="" decoding="async">
                        <span><?php echo e($slide['name']); ?></span>
                    </button>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
            </div>
            <div class="romantic-hero__playback"><span data-hero-count>01 / 04</span><button type="button" data-hero-autoplay aria-label="Dừng tự động chuyển slide" title="Dừng tự động chuyển slide"><span data-hero-play-icon aria-hidden="true">Ⅱ</span></button></div>
            <p class="romantic-hero__status" data-hero-status role="status" aria-live="polite"></p>
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
    <script src="<?php echo e(asset('js/hero-star-trail.js')); ?>"></script>
    <script src="<?php echo e(asset('js/hero-editorial.js')); ?>"></script>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', \Illuminate\Support\Arr::except(get_defined_vars(), ['__data', '__path']))->render(); ?><?php /**PATH D:\baitap\lap_trinh_ma_nguon_mo\tool\laragon\www\Lavarel_BS_new\resources\views/client/home.blade.php ENDPATH**/ ?>