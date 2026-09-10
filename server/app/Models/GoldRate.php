<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GoldRate extends Model
{
    protected $fillable = [
        'shop_id', 'ext_id', 'rate_date', 'rate24k', 'rate22k', 'rate21k', 'rate20k', 'rate18k', 'silver_rate',
    ];

    protected $casts = [
        'rate_date' => 'date',
    ];

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }
}