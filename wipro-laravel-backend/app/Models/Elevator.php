<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Elevator extends Model
{
    protected $fillable = [
        'model', 'manufacturer', 'capacity', 'persons',
        'cabin_width', 'cabin_depth', 'cabin_height',
        'shaft_width', 'shaft_depth', 'pit_depth', 'overhead',
        'speed', 'drive_type', 'max_stops', 'base_price',
        'description', 'is_active',
        // Technical fields
        'standards', 'machine_room', 'lifting_height',
        'door_width', 'door_height', 'door_fire_class',
        'shaft_construction', 'shaft_ventilation', 'shaft_temperature',
        'installation_type', 'cabin_finish', 'cabin_door_finish',
        'landing_door_finish', 'equipment',
        // Drawing file paths
        'drawing_standard_pdf', 'drawing_standard_dwg', 'drawing_standard_bim', 'drawing_standard_doc',
        'drawing_throughway_pdf', 'drawing_throughway_dwg', 'drawing_throughway_bim', 'drawing_throughway_doc',
        // Compensation coefficients
        'coeff_stops', 'stop_surcharge_rate', 'coeff_cabin_model', 'coeff_cabin_throughway',
        'coeff_cabin_doors', 'coeff_landing_doors', 'coeff_ei30', 'coeff_ei60',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'capacity' => 'integer',
        'persons' => 'integer',
        'speed' => 'decimal:1',
        'base_price' => 'decimal:2',
        'lifting_height' => 'decimal:2',
        'coeff_stops'            => 'decimal:4',
        'stop_surcharge_rate'    => 'decimal:2',
        'coeff_cabin_model'      => 'decimal:4',
        'coeff_cabin_throughway' => 'decimal:4',
        'coeff_cabin_doors'      => 'decimal:4',
        'coeff_landing_doors'    => 'decimal:4',
        'coeff_ei30'             => 'decimal:4',
        'coeff_ei60'             => 'decimal:4',
    ];

    protected function shaftWidth(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => is_null($value) ? null : (int) round($value / 10),
            set: fn ($value) => is_null($value) ? null : (int) round($value * 10),
        );
    }

    protected function shaftDepth(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => is_null($value) ? null : (int) round($value / 10),
            set: fn ($value) => is_null($value) ? null : (int) round($value * 10),
        );
    }

    protected function pitDepth(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => is_null($value) ? null : (int) round($value / 10),
            set: fn ($value) => is_null($value) ? null : (int) round($value * 10),
        );
    }

    protected function overhead(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => is_null($value) ? null : (int) round($value / 10),
            set: fn ($value) => is_null($value) ? null : (int) round($value * 10),
        );
    }

    protected function cabinWidth(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => is_null($value) ? null : (int) round($value / 10),
            set: fn ($value) => is_null($value) ? null : (int) round($value * 10),
        );
    }

    protected function cabinDepth(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => is_null($value) ? null : (int) round($value / 10),
            set: fn ($value) => is_null($value) ? null : (int) round($value * 10),
        );
    }

    protected function cabinHeight(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => is_null($value) ? null : (int) round($value / 10),
            set: fn ($value) => is_null($value) ? null : (int) round($value * 10),
        );
    }

    protected function doorWidth(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => is_null($value) ? null : (int) round($value / 10),
            set: fn ($value) => is_null($value) ? null : (int) round($value * 10),
        );
    }

    protected function doorHeight(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => is_null($value) ? null : (int) round($value / 10),
            set: fn ($value) => is_null($value) ? null : (int) round($value * 10),
        );
    }

    public function elements(): HasMany
    {
        return $this->hasMany(ElevatorElement::class);
    }

    public function quoteRequests(): HasMany
    {
        return $this->hasMany(QuoteRequest::class);
    }
}
