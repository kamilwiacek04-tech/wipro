<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Elevator extends Model
{
    protected $fillable = [
        'model',
        'manufacturer',
        'capacity',
        'persons',
        'cabin_width',
        'cabin_depth',
        'cabin_height',
        'shaft_width',
        'shaft_depth',
        'pit_depth',
        'overhead',
        'speed',
        'drive_type',
        'max_stops',
        'base_price',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'capacity' => 'integer',
        'persons' => 'integer',
        'cabin_width' => 'integer',
        'cabin_depth' => 'integer',
        'cabin_height' => 'integer',
        'shaft_width' => 'integer',
        'shaft_depth' => 'integer',
        'pit_depth' => 'integer',
        'overhead' => 'integer',
        'speed' => 'decimal:1',
        'base_price' => 'decimal:2',
    ];

    public function elements(): HasMany
    {
        return $this->hasMany(ElevatorElement::class);
    }

    public function quoteRequests(): HasMany
    {
        return $this->hasMany(QuoteRequest::class);
    }
}
