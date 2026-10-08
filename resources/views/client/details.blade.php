@extends('layouts.app')

@section('title', 'Chi Tiết Bánh Ngọt | The Little Prince Sweet Bakery')

@section('styles')
    <link rel="stylesheet" href="{{ asset('css/details.css') }}">
@endsection

@section('content')
<main class="details-page">

    <!-- PAGE INTRO -->
    <section class="details-intro">
        <div class="container">
            <!-- Breadcrumb -->
            <nav class="details-breadcrumb" aria-label="Breadcrumb">
                <a href="{{ route('home') }}">Trang chủ</a>
                <span><i class="fa-solid fa-chevron-right"></i></span>
                <a href="{{ route('menu') }}">Sản phẩm</a>
                <span><i class="fa-solid fa-chevron-right"></i></span>
                <span class="current">Chi tiết sản phẩm</span>
            </nav>
        </div>
    </section>

    <!-- PRODUCT DETAILS -->
    <section class="product-details-section">
        <div class="container" id="detailsContainer">
            <!-- Loading -->
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Đang tải thông tin bánh ngọt...</p>
            </div>
        </div>
    </section>

    <!-- PRODUCT REVIEWS -->
    <section class="product-reviews-section">
        <div class="container">
            <!-- REVIEW HEADER -->
            <div class="reviews-heading">
                <div>
                    <p class="reviews-eyebrow">CẢM NHẬN TỪ KHÁCH HÀNG</p>
                    <h2>Đánh giá sản phẩm</h2>
                    <p class="reviews-description">
                        <i>Những chia sẻ chân thật từ khách hàng đã trải nghiệm sản phẩm.</i>
                    </p>
                </div>
            </div>

            <!-- REVIEW CONTENT -->
            <div class="product-reviews" id="productReviews">
                <!-- Nội dung đánh giá sẽ được details.js render -->
            </div>
        </div>
    </section>

    <!-- RELATED PRODUCTS -->
    <section class="related-products section" id="relatedSection">
        <div class="section-heading">
            <h2>Bánh cùng loại bạn có thể thích</h2>
            <p>Những sáng tạo thơm ngon thuộc cùng danh mục tại tiệm.</p>
        </div>
        <div class="container">
            <!-- Related products -->
            <div class="product-grid" id="relatedProductGrid"></div>
        </div>
    </section>

</main>
@endsection

@section('scripts')
    <script src="{{ asset('js/details.js') }}"></script>
@endsection
