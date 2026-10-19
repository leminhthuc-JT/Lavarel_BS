@extends('layouts.admin')
@section('title', 'Bình luận khách hàng | The Little Prince')
@section('styles')
<meta name="csrf-token" content="{{ csrf_token() }}">
<link rel="stylesheet" href="{{ asset('admin/css/reviews.css') }}">
@endsection
@section('scripts')
<script type="module" src="{{ asset('admin/js/reviews/reviews.js') }}"></script>
@endsection
