<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Favorite extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'YeuThichs';
    protected $primaryKey = '_id';
    protected $fillable = [
        'MaKH',
        'SanPhams'
    ];
}
