<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Exchange extends Model
{
    protected $fillable = [
        'shop_id', 'ext_id', 'exchange_id', 'customer_id', 'customer_name', 'exchange_date',
        'old_total_value', 'new_total_value', 'making_charges', 'stone_charges', 'discount',
        'net_amount', 'cash_received', 'amount_due', 'payment_method', 'notes',
    ];

    protected $casts = [
        'exchange_date' => 'date',
    ];

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ExchangeItem::class);
    }
}