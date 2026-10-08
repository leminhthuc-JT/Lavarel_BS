@extends('layouts.app')

@section('title', 'Danh Mục Bánh | The Little Prince Sweet Bakery')

@section('styles')
    <link rel="stylesheet" href="{{ asset('css/cate.css') }}">
@endsection

@section('content')
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


@endsection

@section('scripts')
    <script src="{{ asset('js/cate.js') }}"></script>
@endsection
