<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LedgerEntry extends Model
{
    protected $fillable = [
        'shop_id', 'ext_id', 'customer_id', 'customer_name', 'entry_date', 'description',
        'debit', 'credit', 'balance', 'source', 'reference_id',
    ];

    protected $casts = [
        'entry_date' => 'date',
    ];

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }
}