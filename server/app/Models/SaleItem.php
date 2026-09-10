<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItem extends Model
{
    protected $fillable = [
        'sale_id', 'ext_id', 'product_id', 'product_name', 'gross_weight', 'net_weight',
        'purity', 'karat', 'gold_rate', 'metal_value', 'making_charges', 'stone_charges',
        'discount', 'line_total', 'quantity',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }
}