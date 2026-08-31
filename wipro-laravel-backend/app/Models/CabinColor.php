<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CabinColor extends Model
{
    protected $fillable = [
        'name_pl', 'name_en', 'image_url',
        'visible_for_cabin', 'visible_for_door',
        'price_addition_cabin', 'price_addition_door',
        'sort_order', 'is_active',
        'is_default_cabin', 'is_default_door',
    ];

    protected $casts = [
        'is_active'            => 'boolean',
        'visible_for_cabin'    => 'boolean',
        'visible_for_door'     => 'boolean',
        'price_addition_cabin' => 'decimal:2',
        'price_addition_door'  => 'decimal:2',
        'sort_order'           => 'integer',
        'is_default_cabin'     => 'boolean',
        'is_default_door'      => 'boolean',
    ];
}
