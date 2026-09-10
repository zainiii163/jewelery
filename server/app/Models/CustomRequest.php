<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomRequest extends Model
{
    protected $fillable = [
        'shop_id', 'name', 'phone', 'jewellery_type', 'metal', 'karat',
        'budget', 'description', 'image', 'status',
    ];

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }
}