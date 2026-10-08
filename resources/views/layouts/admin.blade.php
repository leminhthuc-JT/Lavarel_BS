<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Quản trị | The Little Prince')</title>
    <link rel="stylesheet" href="{{ asset('admin/css/admin.css') }}">
    @yield('styles')
</head>
<body>
    @yield('content')
    @yield('scripts')
</body>
</html>
