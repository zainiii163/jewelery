<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryMove extends Model
{
    protected $fillable = [
        'shop_id', 'ext_id', 'product_id', 'product_name', 'move_date', 'type',
        'metal_type', 'weight', 'quantity', 'notes',
    ];

    protected $casts = [
        'move_date' => 'date',
    ];

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }
}