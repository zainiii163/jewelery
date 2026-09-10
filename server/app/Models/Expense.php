<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    protected $fillable = [
        'shop_id', 'ext_id', 'expense_id', 'expense_date', 'category', 'description',
        'amount', 'payment_method', 'notes',
    ];

    protected $casts = [
        'expense_date' => 'date',
    ];

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }
}