<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Repair extends Model
{
    protected $fillable = [
        'shop_id', 'ext_id', 'repair_id', 'customer_id', 'customer_name', 'product_id',
        'product_name', 'problem', 'received_date', 'expected_date', 'estimated_charges',
        'final_charges', 'employee', 'notes', 'status',
    ];

    protected $casts = [
        'received_date' => 'date',
        'expected_date' => 'date',
    ];

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }
}