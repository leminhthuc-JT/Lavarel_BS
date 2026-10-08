@extends('layouts.app')

@section('title', 'Về Chúng Tôi | The Little Prince Sweet Bakery')

@section('styles')
    <link rel="stylesheet" href="{{ asset('css/about.css') }}">
@endsection

@section('content')
<main class="about-page">
    
    <!-- ABOUT HERO -->
    <section class="about-hero">
        <div class="container">
            <p class="eyebrow">CÂU CHUYỆN THƯƠNG HIỆU</p>
            <h1>Hành Trình Ngọt Ngào</h1>
            <p class="about-subtitle">Nơi mỗi mẻ bánh tươi được gửi gắm đam mê, sự tỉ mỉ và tình yêu nồng nàn với nghệ thuật làm bánh thủ công tinh tế.</p>
        </div>
    </section>

    <!-- BRAND STORY -->
    <section class="section story-detail">
        <div class="container grid-2-col">
            <div class="image-frame">
                <img src="{{ asset("assets/") }}/theShop.png" alt="Khởi nguồn Little Prince">
            </div>
            <div class="story-content">
                <p class="eyebrow">KHỞI NGUỒN</p>
                <h2>Câu chuyện lãng mạn từ lò nướng</h2>
                <p>Khởi nguồn từ giấc mơ mang hương vị bánh ngọt chuẩn vị Pháp tinh tế đến gần hơn với những tâm hồn yêu ẩm thực Việt Nam, The Little Prince Pâtisserie bắt đầu từ những nguyên liệu nhỏ bé nhưng chứa đựng đam mê mãnh liệt.</p>
                <p>Chúng tôi coi mỗi chiếc bánh là một tác phẩm nghệ thuật cần sự kiên nhẫn, nâng niu từng giác quan để biến mỗi ngày bình thường của bạn trở nên thật đặc biệt và ngọt ngào.</p>
            </div>
        </div>
    </section>

    <!-- BAKING PHILOSOPHY -->
    <section class="section philosophy">
        <div class="container">
            <div class="section-heading">
                <h2>Triết lý làm bánh của chúng tôi</h2>
                <p>Tôn trọng sự tự nhiên, tinh khiết và cảm xúc của người thưởng thức.</p>
            </div>
            <div class="philosophy-grid">
                <div class="philosophy-card">
                    <span class="philo-num">01</span>
                    <h3>Nguyên liệu thượng hạng</h3>
                    <p>Bơ Isigny AOP Pháp, socola Valrhona, vani Bourbon Madagascar và trái cây tươi được tuyển chọn khắt khe mỗi sáng.</p>
                </div>
                <div class="philosophy-card">
                    <span class="philo-num">02</span>
                    <h3>Thủ công tận tâm</h3>
                    <p>Không sản xuất công nghiệp đại trà. Mỗi chiếc bánh đều trải qua hàng giờ nhào nặn, tạo hình và nướng bằng sự kiên nhẫn.</p>
                </div>
                <div class="philosophy-card">
                    <span class="philo-num">03</span>
                    <h3>Độ ngọt thanh tự nhiên</h3>
                    <p>Công thức độc quyền giảm lượng đường, tôn vinh hương thơm tự nhiên nguyên bản và bảo vệ sức khỏe người dùng.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- ARTISANAL PROCESS -->
    <section class="section process">
        <div class="container">
            <div class="section-heading">
                <h2>Quy trình tạo nên chiếc bánh<br>hoàn hảo</h2>
                <p>Từ lúc 04:00 sáng mỗi ngày, bếp bánh Little Prince đã thắp sáng ngọn lửa nướng đầu tiên.</p>
            </div>
            <div class="process-steps">
                <div class="step-item">
                    <div class="step-circle">1</div>
                    <h4>Tuyển chọn nguyên liệu</h4>
                    <p>Trái cây mọng hái sáng sớm và bơ Pháp hảo hạng.</p>
                </div>
                <div class="step-item">
                    <div class="step-circle">2</div>
                    <h4>Ủ men &amp; Cán bột thủ công</h4>
                    <p>Quy trình cán ngàn lớp tỉ mỉ giữ độ giòn xốp tự nhiên.</p>
                </div>
                <div class="step-item">
                    <div class="step-circle">3</div>
                    <h4>Nướng mẻ tươi sớm</h4>
                    <p>Bánh được nướng tươi chuẩn nhiệt độ và thời gian hoàn hảo.</p>
                </div>
                <div class="step-item">
                    <div class="step-circle">4</div>
                    <h4>Trang trí nghệ thuật</h4>
                    <p>Điểm xuyết hoa tươi và kem chantilly trước khi trao tới tay bạn.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- CALL TO ACTION -->
    <section class="newsletter" style="background:var(--sage-dark);">
        <div class="container">
            <h2>Hãy để Little Prince làm ngọt ngào ngày của bạn</h2>
            <p>Ghé thăm cửa hàng hoặc khám phá ngay thực đơn bánh tươi mới vừa rời lò nướng!</p>
            <a href="{{ route("menu") }}" class="btn btn-primary btn-lg" style="background:var(--cream); color:var(--text-main);">Khám phá thực đơn <span>→</span></a>
        </div>
    </section>

</main>


@endsection

@section('scripts')
    <script src="{{ asset('js/about.js') }}"></script>
@endsection
