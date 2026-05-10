<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuoteRequest extends Model
{
    protected $fillable = [
        'user_id',
        'request_number',
        'status',
        'investor_name',
        'investor_email',
        'investor_phone',
        'investor_company',
        'investor_nip',
        'investor_address',
        'investor_city',
        'investment_name',
        'investment_address',
        'investment_city',
        'floors',
        'stops',
        'lift_capacity',
        'shaft_width',
        'shaft_depth',
        'cabin_width',
        'cabin_depth',
        'cabin_height',
        'pit_depth',
        'overhead',
        'drive_type',
        'door_type',
        'door_width',
        'door_height',
        'handrail',
        'ceiling',
        'lighting',
        'floor_material',
        'control_panel',
        'additional_notes',
        'raw_data',
        'elevator_id',
    ];

    protected $casts = [
        'raw_data' => 'array',
        'floors' => 'integer',
        'stops' => 'integer',
        'lift_capacity' => 'integer',
        'shaft_width' => 'integer',
        'shaft_depth' => 'integer',
        'cabin_width' => 'integer',
        'cabin_depth' => 'integer',
        'cabin_height' => 'integer',
        'pit_depth' => 'integer',
        'overhead' => 'integer',
        'door_width' => 'integer',
        'door_height' => 'integer',
    ];

    public static function generateRequestNumber(): string
    {
        $year = date('Y');
        $count = self::whereYear('created_at', $year)->count() + 1;
        return sprintf('WPR-%s-%03d', $year, $count);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function elevator(): BelongsTo
    {
        return $this->belongsTo(Elevator::class);
    }

    public function offers(): HasMany
    {
        return $this->hasMany(Offer::class);
    }
}
