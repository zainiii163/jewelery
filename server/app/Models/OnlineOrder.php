<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OnlineOrder extends Model
{
    protected $fillable = [
        'shop_id', 'order_number', 'customer_name', 'customer_phone',
        'customer_email', 'address', 'city', 'payment_method', 'payment_status',
        'status', 'subtotal', 'shipping', 'discount', 'grand_total',
        'notes', 'order_date',
    ];

    protected $casts = [
        'order_date' => 'datetime',
    ];

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OnlineOrderItem::class, 'order_id');
    }
}