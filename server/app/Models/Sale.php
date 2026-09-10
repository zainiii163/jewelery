<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    protected $fillable = [
        'shop_id', 'ext_id', 'invoice_id', 'customer_id', 'customer_name', 'sale_date',
        'subtotal', 'total_discount', 'tax', 'total', 'paid', 'remaining', 'payment_method', 'notes',
    ];

    protected $casts = [
        'sale_date' => 'date',
    ];

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }
}