<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CabinColor extends Model
{
    protected $fillable = [
        'name_pl', 'name_en', 'hex_color',
        'visible_for_cabin', 'visible_for_door',
        'price_addition_cabin', 'price_addition_door',
        'sort_order', 'is_active',
    ];

    protected $casts = [
        'is_active'            => 'boolean',
        'visible_for_cabin'    => 'boolean',
        'visible_for_door'     => 'boolean',
        'price_addition_cabin' => 'decimal:2',
        'price_addition_door'  => 'decimal:2',
        'sort_order'           => 'integer',
    ];
}
