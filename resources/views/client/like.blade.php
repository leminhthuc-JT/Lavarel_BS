@extends('layouts.app')

@section('title', 'Sản Phẩm Yêu Thích | The Little Prince Sweet Bakery')

@section('styles')
    <link rel="stylesheet" href="{{ asset('css/like.css') }}">
@endsection

@section('content')
<main class="like-page">
    <div class="container">

        <header class="like-header">
            <p class="eyebrow">BÁNH YÊU THÍCH CỦA BẠN</p>
            <div class="title-row">
                <span class="title-line left"></span>
                <h1>Danh Sách Yêu Thích <i class="fa-solid fa-heart"></i></h1>
                <span class="title-line right"></span>
            </div>
            <p class="like-subtitle">Những chiếc bánh bạn đã lưu lại để đặt vào dịp thật đặc biệt.</p>
        </header>

        <div class="product-grid" id="likeGrid">
            <div class="loading-spinner" style="grid-column: 1 / -1;">
                <div class="spinner"></div>
                <p>Đang tải danh sách yêu thích...</p>
            </div>
        </div>

    </div>
</main>

<!-- FOOTER -->

@endsection

@section('scripts')
    <script src="{{ asset('js/like.js') }}"></script>
@endsection
