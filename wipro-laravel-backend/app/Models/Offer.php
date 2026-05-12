<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Offer extends Model
{
    protected $fillable = [
        'quote_request_id',
        'created_by_admin_id',
        'offer_number',
        'version',
        'status',
        'valid_until',
        'total_price_net',
        'total_price_gross',
        'vat_rate',
        'notes',
        'client_name',
        'client_email',
        'pdf_path',
        'docx_path',
        'sent_at',
        'client_response',
        'client_responded_at',
        'cancelled_at',
    ];

    protected $casts = [
        'valid_until' => 'date',
        'sent_at' => 'datetime',
        'client_responded_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'total_price_net' => 'decimal:2',
        'total_price_gross' => 'decimal:2',
        'vat_rate' => 'decimal:2',
        'version' => 'integer',
    ];

    public static function generateOfferNumber(QuoteRequest $quoteRequest): string
    {
        $version = $quoteRequest->offers()->count() + 1;
        return sprintf('%s/OF/%d', $quoteRequest->request_number, $version);
    }

    public static function generateStandaloneOfferNumber(): string
    {
        $year = date('Y');
        $count = self::whereNull('quote_request_id')->whereYear('created_at', $year)->count() + 1;
        return sprintf('OF/%s/%03d', $year, $count);
    }

    public function quoteRequest(): BelongsTo
    {
        return $this->belongsTo(QuoteRequest::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_admin_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OfferItem::class)->orderBy('sort_order');
    }
}
