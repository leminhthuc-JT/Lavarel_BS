@extends('layouts.admin')

@section('title', 'Gợi ý bổ sung bánh | The Little Prince')

@section('styles')
    <link rel="stylesheet" href="{{ asset('admin/css/product-recommendations.css') }}">
@endsection

@section('scripts')
    <script type="module" src="{{ asset('admin/js/product-recommendations/product-recommendations.js') }}"></script>
@endsection
