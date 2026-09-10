<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'shop_id', 'ext_id', 'payment_id', 'customer_id', 'customer_name', 'payment_date',
        'amount', 'method', 'type', 'reference', 'notes',
    ];

    protected $casts = [
        'payment_date' => 'date',
    ];

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }
}