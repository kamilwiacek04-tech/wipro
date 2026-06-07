<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CabinModel extends Model
{
    protected $fillable = [
        'name_pl', 'name_en', 'image_url', 'details', 'sort_order', 'is_active', 'price_addition',
    ];

    protected $casts = [
        'details'        => 'array',
        'is_active'      => 'boolean',
        'price_addition' => 'decimal:2',
    ];
}
