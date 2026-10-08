<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Category extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'DanhMucSanPhams';
    protected $primaryKey = '_id';
    protected $fillable = [
        'MaDanhMuc',
        'TenDanhMuc',
        'MoTa',
        'HinhAnh',
        'TrangThai'
    ];
}
