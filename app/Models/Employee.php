<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Employee extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'NhanViens';
    protected $primaryKey = '_id';
    protected $fillable = [
        'MaNV',
        'HoTen',
        'Email',
        'SoDienThoai',
        'MatKhau',
        'ChucVu',
        'TrangThai'
    ];
    protected $hidden = ['MatKhau'];
}
