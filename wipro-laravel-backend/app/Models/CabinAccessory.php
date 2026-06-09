<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CabinAccessory extends Model
{
    protected $fillable = [
        'category', 'name_pl', 'name_en', 'image_url', 'sort_order', 'is_active',
        'price_addition', 'multiply_by_access_count',
    ];

    protected $casts = [
        'is_active'                => 'boolean',
        'price_addition'           => 'decimal:2',
        'multiply_by_access_count' => 'boolean',
    ];
}
