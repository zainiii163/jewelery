<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OnlineOrderItem extends Model
{
    protected $fillable = [
        'order_id', 'product_id', 'sku', 'product_name', 'qty',
        'unit_price', 'line_total',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(OnlineOrder::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}