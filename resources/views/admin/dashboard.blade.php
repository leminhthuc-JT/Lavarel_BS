@extends('layouts.admin')

@section('title', 'Tổng quan | The Little Prince')

@section('styles')
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
@endsection

@section('scripts')
    <script type="module" src="{{ asset('admin/js/dashboard/dashboard.js') }}"></script>
@endsection
