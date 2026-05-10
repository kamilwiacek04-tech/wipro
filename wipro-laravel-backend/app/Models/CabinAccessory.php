<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CabinAccessory extends Model
{
    protected $fillable = [
        'category', 'name_pl', 'name_en', 'image_url', 'sort_order', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
