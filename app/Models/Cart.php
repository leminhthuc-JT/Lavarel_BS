<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Cart extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'GioHangs';
    protected $primaryKey = '_id';
    protected $fillable = [
        'MaKH',
        'SanPhams',
        'CapNhatLuc'
    ];
}
