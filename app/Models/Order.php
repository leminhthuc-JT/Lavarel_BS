<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Order extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'DonHangs';
    protected $primaryKey = '_id';
    protected $fillable = [
        'MaDH',
        'MaKH',
        'TenKhachHang',
        'SoDienThoai',
        'Email',
        'DiaChi',
        'PhuongThucThanhToan',
        'GhiChu',
        'SanPhams',
        'TongTien',
        'GiamGia',
        'ThanhTien',
        'TrangThai',
        'NgayDat'
    ];
}
