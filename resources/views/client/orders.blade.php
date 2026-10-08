@extends('layouts.app')

@section('title', 'Lịch Sử Đơn Hàng | The Little Prince Sweet Bakery')

@section('styles')
    <link rel="stylesheet" href="{{ asset('css/orders.css') }}">
@endsection

@section('content')
<main class="orders-page">
    <div class="container">
        <header class="orders-header">
            <p class="eyebrow">QUẢN LÝ ĐƠN HÀNG</p>
            <h1>Lịch Sử Đặt Bánh</h1>
        </header>

        <div class="orders-list" id="ordersContainer">
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Đang tải danh sách đơn hàng...</p>
            </div>
        </div>
    </div>
</main>

<!-- ORDER DETAIL MODAL -->
<div class="modal-overlay" id="orderModal" style="display:none;">
    <div class="modal-content">
        <div class="modal-header">
            <h3 id="modalTitle">Chi Tiết Đơn Hàng #</h3>
            <button class="modal-close" onclick="closeOrderModal()">✕</button>
        </div>
        <div class="modal-body" id="modalBody"></div>
    </div>
</div>
@endsection

@section('scripts')
    <script src="{{ asset('js/orders.js') }}"></script>
@endsection
