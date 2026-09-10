<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Customer extends Model
{
    protected $fillable = [
        'shop_id', 'ext_id', 'customer_id', 'name', 'father_name', 'cnic', 'mobile',
        'whatsapp', 'address', 'city', 'email', 'notes', 'total_amount', 'paid_amount', 'registered_date',
    ];

    protected $casts = [
        'total_amount' => 'float',
        'paid_amount' => 'float',
        'registered_date' => 'date',
    ];

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function getBalanceAttribute(): float
    {
        return round($this->total_amount - $this->paid_amount, 2);
    }
}