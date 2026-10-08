<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Product extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'SanPhams';
    protected $primaryKey = '_id';
    protected $fillable = [
        'MaSP',
        'TenSP',
        'MaDanhMuc',
        'TenDanhMuc',
        'Gia',
        'KichThuoc',
        'HinhAnh',
        'MoTa',
        'NoiBat',
        'SoLuong',
        'TrangThai',
        'DanhGia'
    ];
}
