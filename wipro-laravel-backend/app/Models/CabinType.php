<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CabinType extends Model
{
    protected $fillable = [
        'key', 'name_pl', 'name_en',
        'image_right_url', 'image_left_url',
        'price', 'sort_order', 'is_active',
    ];

    protected $casts = [
        'is_active'  => 'boolean',
        'price'      => 'decimal:2',
        'sort_order' => 'integer',
    ];
}
