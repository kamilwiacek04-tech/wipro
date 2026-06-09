<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiftType extends Model
{
    protected $fillable = ['key', 'name_pl', 'name_en', 'sort_order', 'is_active', 'base_price', 'price_per_stop'];

    protected $casts = [
        'is_active'      => 'boolean',
        'sort_order'     => 'integer',
        'base_price'     => 'decimal:2',
        'price_per_stop' => 'decimal:2',
    ];
}
