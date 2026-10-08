<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Promotion extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'KhuyenMais';
    protected $primaryKey = '_id';
    protected $fillable = [
        'MaKM',
        'TenKhuyenMai',
        'MoTa',
        'PhanTramGiam',
        'GiamToiDa',
        'DonToiThieu',
        'NgayBatDau',
        'NgayKetThuc',
        'TrangThai'
    ];
}
