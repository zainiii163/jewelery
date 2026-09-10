<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'shop_id', 'sku', 'name', 'category_id', 'metal_type', 'purity', 'karat',
        'gross_weight', 'net_weight', 'stone_weight', 'rate',
        'making_charges', 'stone_charges', 'sale_price', 'purchase_cost',
        'status', 'published', 'featured', 'new_arrival', 'best_seller',
        'stock_qty', 'description', 'seo_title', 'seo_description', 'published_at',
    ];

    protected $casts = [
        'purity' => 'float',
        'gross_weight' => 'float',
        'net_weight' => 'float',
        'stone_weight' => 'float',
        'rate' => 'float',
        'making_charges' => 'float',
        'stone_charges' => 'float',
        'sale_price' => 'float',
        'purchase_cost' => 'float',
        'stock_qty' => 'integer',
        'published' => 'boolean',
        'featured' => 'boolean',
        'new_arrival' => 'boolean',
        'best_seller' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function media(): HasMany
    {
        return $this->hasMany(ProductMedia::class)->orderBy('sort');
    }

    public function scopePublished($query)
    {
        return $query->where('published', true)->where('status', 'In Stock');
    }
}