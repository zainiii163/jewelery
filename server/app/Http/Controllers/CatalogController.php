<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Shop;
use Illuminate\Http\Request;

/**
 * Public catalog endpoints consumed by the customer-facing website.
 * Products are scoped per shop via the `shop_code` query parameter.
 */
class CatalogController extends Controller
{
    private function scope(Request $request)
    {
        $code = $request->query('shop_code', Shop::first()?->shop_code);

        return Shop::where('shop_code', strtoupper((string) $code))->firstOrFail();
    }

    /** GET /api/catalog/categories?shop_code=XXXX */
    public function categories(Request $request)
    {
        $shop = $this->scope($request);

        return ProductCategory::where('shop_id', $shop->id)
            ->withCount(['products' => fn ($q) => $q->published()])
            ->orderBy('name')
            ->get();
    }

    /** GET /api/catalog/products?shop_code=XXXX&category=slug&q=...&metal=gold&min=...&max=... */
    public function products(Request $request)
    {
        $shop = $this->scope($request);

        $query = Product::published()
            ->where('shop_id', $shop->id)
            ->with(['category', 'media']);

        if ($request->filled('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $request->query('category')));
        }
        if ($request->filled('metal')) {
            $query->where('metal_type', $request->query('metal'));
        }
        if ($request->filled('karat')) {
            $query->where('karat', (int) $request->query('karat'));
        }
        if ($request->filled('q')) {
            $q = strtolower($request->query('q'));
            $query->where(function ($w) use ($q) {
                $w->whereRaw('lower(name) like ?', ["%{$q}%"])
                    ->orWhereRaw('lower(sku) like ?', ["%{$q}%"]);
            });
        }
        if ($request->filled('min')) {
            $query->where('sale_price', '>=', (float) $request->query('min'));
        }
        if ($request->filled('max')) {
            $query->where('sale_price', '<=', (float) $request->query('max'));
        }
        if ($request->filled('featured')) {
            $query->where('featured', true);
        }
        if ($request->filled('new')) {
            $query->where('new_arrival', true);
        }

        $rows = $query->orderBy('featured', 'desc')
            ->orderBy('new_arrival', 'desc')
            ->latest()
            ->paginate($request->integer('per_page', 24))
            ->withQueryString();

        $rows->getCollection()->transform(fn ($p) => $this->decorate($p));

        return $rows;
    }

    /** GET /api/catalog/products/{sku} */
    public function show(Request $request, string $sku)
    {
        $shop = $this->scope($request);

        $product = Product::with(['category', 'media'])
            ->where('shop_id', $shop->id)
            ->where('sku', $sku)
            ->firstOrFail();

        abort_unless($product->published, 404);

        return $this->decorate($product);
    }

    private function decorate($product)
    {
        foreach ($product->media as $m) {
            $m->url = $this->mediaUrl($m);
        }

        return $product;
    }

    private function mediaUrl($m)
    {
        return \Illuminate\Support\Facades\Storage::disk('public')->url($m->path);
    }
}