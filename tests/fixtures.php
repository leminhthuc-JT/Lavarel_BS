<?php
require __DIR__ . '/bootstrap.php';
$db = Illuminate\Support\Facades\DB::connection('mongodb')->getMongoDB();
if (($argv[1] ?? '') === 'clean') {
    foreach (['NhanViens', 'KhachHangs', 'DanhMucs', 'SanPhams', 'KhuyenMais', 'DonHangs', 'GioHangs', 'Gios', 'YeuThichs'] as $name) {
        $db->selectCollection($name)->deleteMany([]);
    }
    echo "Isolated test documents removed\n"; exit;
}
$db->command(['ping' => 1])->toArray();
$password = password_hash('Test123!', PASSWORD_DEFAULT);
$db->selectCollection('NhanViens')->insertOne([
    'MaNV' => 'TESTADMIN', 'HoTen' => 'Test Admin', 'ChucVu' => 'Quản lý', 'TrangThai' => 'Đang làm việc',
    'TaiKhoan' => ['Email' => 'admin@test.invalid', 'MatKhau' => $password, 'Quyen' => ['MaQ' => 'MN']],
]);
for ($i = 1; $i <= 22; $i++) {
    $db->selectCollection('KhachHangs')->insertOne([
        'MaKH' => 'TEST' . $i, 'HoTen' => 'Test Customer ' . $i, 'Email' => "user$i@test.invalid", 'TrangThai' => 'Hoạt động',
        'TaiKhoan' => ['Email' => "user$i@test.invalid", 'MatKhau' => $password, 'Quyen' => ['MaQ' => 'KH']],
        'NgayDangKy' => new MongoDB\BSON\UTCDateTime($i * 1000),
    ]);
}
$db->selectCollection('KhachHangs')->insertOne(['MaKH' => 'GOOGLEONLY', 'Email' => 'google@test.invalid', 'TrangThai' => 'Hoạt động', 'TaiKhoan' => ['Email' => 'google@test.invalid', 'MatKhau' => null]]);
$db->selectCollection('DanhMucs')->insertOne(['MaDM' => 'TESTDM', 'TenDM' => 'Test Category']);
$db->selectCollection('SanPhams')->insertOne([
    'MaSP' => 'TESTSP', 'TenSP' => 'Test Cake', 'MaDM' => 'TESTDM', 'TrangThai' => 'Đang bán',
    'DanhGia' => [['_id' => 'review-old', 'MaKH' => 'TEST1', 'BinhLuan' => 'Old review', 'SoSao' => 5]],
]);
echo "Isolated fixtures ready\n";
