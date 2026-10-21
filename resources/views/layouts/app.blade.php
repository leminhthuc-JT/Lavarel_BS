<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'The Little Prince / Sweet Bakery - Tiệm Bánh Ngọt Thủ Công')</title>

    <!-- Google Fonts & Style -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">

    <link rel="stylesheet" href="{{ asset('css/style.css') }}">
    <link rel="stylesheet" href="{{ asset('css/account-menu.css') }}">
    @yield('styles')
</head>
<body>
<script src="{{ asset('js/account-menu.js') }}"></script>

@include('components.header')

@yield('content')

@include('components.footer')

<script src="{{ asset('js/common.js') }}"></script>
@yield('scripts')
</body>
</html>
