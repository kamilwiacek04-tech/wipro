<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ElevatorElement extends Model
{
    protected $fillable = [
        'elevator_id',
        'category',
        'name',
        'description',
        'price',
        'unit',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'price' => 'decimal:2',
    ];

    public function elevator(): BelongsTo
    {
        return $this->belongsTo(Elevator::class);
    }
}
