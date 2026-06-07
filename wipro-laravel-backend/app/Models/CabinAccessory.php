<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CabinAccessory extends Model
{
    protected $fillable = [
        'category', 'name_pl', 'name_en', 'image_url', 'sort_order', 'is_active', 'price_addition',
    ];

    protected $casts = [
        'is_active'      => 'boolean',
        'price_addition' => 'decimal:2',
    ];
}
