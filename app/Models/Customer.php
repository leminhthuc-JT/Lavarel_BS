<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Customer extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'KhachHangs';
    protected $primaryKey = '_id';
    protected $fillable = [
        'MaKH',
        'HoTen',
        'Email',
        'SoDienThoai',
        'MatKhau',
        'DiaChi',
        'GoogleId',
        'ResetToken',
        'ResetTokenExpires',
        'TrangThai'
    ];
    protected $hidden = ['MatKhau'];
}
