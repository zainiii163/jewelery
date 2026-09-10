<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExchangeItem extends Model
{
    protected $fillable = [
        'exchange_id', 'ext_id', 'direction', 'metal_type', 'product_id', 'product_name',
        'gross_weight', 'net_weight', 'purity', 'karat', 'rate', 'metal_value',
        'making_charges', 'stone_charges', 'line_total',
    ];

    public function exchange(): BelongsTo
    {
        return $this->belongsTo(Exchange::class);
    }
}