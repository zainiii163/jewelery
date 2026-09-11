<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleRecord extends Model
{
    protected $fillable = [
        'shop_id', 'product_id', 'invoice_no', 'customer_name', 'customer_phone',
        'sale_date', 'sale_price', 'discount', 'final_price', 'amount_paid',
        'amount_remaining', 'payment_method', 'notes', 'photos',
    ];

    protected $casts = [
        'sale_price' => 'float',
        'discount' => 'float',
        'final_price' => 'float',
        'amount_paid' => 'float',
        'amount_remaining' => 'float',
        'photos' => 'array',
        'sale_date' => 'date',
    ];

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
