<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Purchase extends Model
{
    protected $fillable = [
        'shop_id', 'ext_id', 'purchase_id', 'supplier_id', 'supplier_name', 'product_id',
        'product_name', 'purchase_date', 'gross_weight', 'net_weight', 'purity', 'karat',
        'rate', 'making_charges', 'total_cost', 'paid', 'remaining', 'payment_method', 'notes',
    ];

    protected $casts = [
        'purchase_date' => 'date',
    ];

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }
}