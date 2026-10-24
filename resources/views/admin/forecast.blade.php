@extends('layouts.admin')

@section('title', 'AI Dự báo doanh thu | The Little Prince')

@section('styles')
    <link rel="stylesheet" href="{{ asset('admin/css/forecast.css') }}">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
@endsection

@section('scripts')
    <script type="module" src="{{ asset('admin/js/forecast/forecast.js') }}"></script>
@endsection
