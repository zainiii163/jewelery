<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\CustomRequest;
use App\Models\OnlineOrder;
use App\Models\OnlineOrderItem;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductMedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Authenticated endpoints used by the shop management app to publish
 * catalogue data and pull website activity (orders, appointments, requests).
 */
class ShopSyncController extends Controller
{
    /** GET /api/shop/products — full catalogue (incl. unpublished) for admin. */
    public function listProducts(Request $request)
    {
        $query = Product::with(['category', 'media'])
            ->where('shop_id', $request->user()->id)
            ->orderByDesc('id');

        if ($request->filled('q')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->query('q').'%')
                    ->orWhere('sku', 'like', '%'.$request->query('q').'%');
            });
        }
        if ($request->filled('metal')) {
            $query->where('metal_type', $request->query('metal'));
        }
        if ($request->filled('published')) {
            $query->where('published', filter_var($request->query('published'), FILTER_VALIDATE_BOOL));
        }

        return $query->paginate((int) $request->query('per_page', 50));
    }

    /** GET /api/shop/products/{sku} — single product with media (admin edit). */
    public function showProduct(Request $request, string $sku)
    {
        $product = Product::with(['category', 'media'])
            ->where('shop_id', $request->user()->id)
            ->where('sku', $sku)
            ->firstOrFail();

        return response()->json($product);
    }

    /** POST /api/shop/products — upsert a product from the desktop app. */
    public function upsertProduct(Request $request)
    {
        $validated = $request->validate([
            'sku' => ['required', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['nullable', 'integer', 'exists:product_categories,id'],
            'category' => ['nullable', 'string', 'max:255'],
            'metal_type' => ['sometimes', 'in:gold,silver,other'],
            'purity' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'karat' => ['nullable', 'integer', 'min:0', 'max:24'],
            'gross_weight' => ['nullable', 'numeric', 'min:0', 'max:99999'],
            'net_weight' => ['nullable', 'numeric', 'min:0', 'max:99999'],
            'stone_weight' => ['nullable', 'numeric', 'min:0', 'max:99999'],
            'making_charges' => ['nullable', 'numeric', 'min:0', 'max:9999999'],
            'stone_charges' => ['nullable', 'numeric', 'min:0', 'max:9999999'],
            'sale_price' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'purchase_cost' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'status' => ['sometimes', 'string', 'in:In Stock,Sold,Reserved,Returned,Exchanged,Repair,Lost'],
            'published' => ['sometimes', 'boolean'],
            'featured' => ['sometimes', 'boolean'],
            'new_arrival' => ['sometimes', 'boolean'],
            'best_seller' => ['sometimes', 'boolean'],
            'stock_qty' => ['sometimes', 'integer', 'min:0', 'max:99999'],
            'description' => ['nullable', 'string', 'max:5000'],
            'seo_title' => ['nullable', 'string', 'max:255'],
            'seo_description' => ['nullable', 'string', 'max:500'],
        ]);

        $shop = $request->user();

        $categoryId = $validated['category_id'] ?? null;
        if ($request->filled('category')) {
            $category = ProductCategory::firstOrCreate(
                ['shop_id' => $shop->id, 'slug' => strtolower(str_replace(' ', '-', $validated['category']))],
                ['name' => $validated['category']],
            );
            $categoryId = $category->id;
        }

        $product = Product::updateOrCreate(
            ['shop_id' => $shop->id, 'sku' => $validated['sku']],
            [
                'name' => $validated['name'],
                'category_id' => $categoryId,
                'metal_type' => $request->input('metal_type', 'gold'),
                'purity' => $request->input('purity'),
                'karat' => $request->input('karat'),
                'gross_weight' => $request->input('gross_weight', 0),
                'net_weight' => $request->input('net_weight', 0),
                'stone_weight' => $request->input('stone_weight', 0),
                'making_charges' => $request->input('making_charges', 0),
                'stone_charges' => $request->input('stone_charges', 0),
                'sale_price' => $request->input('sale_price', 0),
                'purchase_cost' => $request->input('purchase_cost', 0),
                'status' => $request->input('status', 'In Stock'),
                'published' => (bool) $request->input('published', false),
                'featured' => (bool) $request->input('featured', false),
                'new_arrival' => (bool) $request->input('new_arrival', false),
                'best_seller' => (bool) $request->input('best_seller', false),
                'stock_qty' => (int) $request->input('stock_qty', 1),
                'description' => $request->input('description'),
                'seo_title' => $request->input('seo_title'),
                'seo_description' => $request->input('seo_description'),
                'published_at' => $request->input('published') ? now() : null,
            ],
        );

        return response()->json(['ok' => true, 'product_id' => $product->id]);
    }

    /** POST /api/shop/products/{sku}/media — attach a photo/video. */
    public function addMedia(Request $request, string $sku)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:jpeg,jpg,png,gif,webp,mp4,webm,mov', 'max:25600'],
            'kind' => ['sometimes', 'in:image,video'],
        ]);

        $shop = $request->user();
        $product = Product::where('shop_id', $shop->id)->where('sku', $sku)->firstOrFail();

        $ext = strtolower($request->file('file')->getClientOriginalExtension());
        $name = \Illuminate\Support\Str::random(40) . '.' . ($ext ?: 'bin');
        $path = $request->file('file')->storeAs(
            "products/{$sku}",
            $name,
            'public',
        );

        $media = ProductMedia::create([
            'product_id' => $product->id,
            'path' => $path,
            'kind' => $request->input('kind', in_array($ext, ['mp4', 'webm', 'mov', 'mkv']) ? 'video' : 'image'),
            'sort' => (int) ProductMedia::where('product_id', $product->id)->max('sort') + 1,
        ]);

        return response()->json([
            'ok' => true,
            'media_id' => $media->id,
            'url' => Storage::disk('public')->url($path),
        ], 201);
    }

    /** GET /api/shop/orders?status=Pending&since=... — website orders for the app. */
    public function orders(Request $request)
    {
        $query = OnlineOrder::where('shop_id', $request->user()->id)
            ->with('items')
            ->orderByDesc('id');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('since')) {
            $query->where('updated_at', '>', $request->query('since'));
        }

        return $query->limit(500)->get();
    }

    /** PATCH /api/shop/orders/{id} — update status/payment by the app. */
    public function updateOrder(Request $request, int $id)
    {
        $validated = $request->validate([
            'status' => ['sometimes', 'string', 'in:Pending,Confirmed,In Progress,Ready,Completed,Cancelled,Returned,Shipped,Delivered'],
            'payment_status' => ['sometimes', 'string', 'in:paid,pending,failed'],
        ]);

        $order = OnlineOrder::where('shop_id', $request->user()->id)->findOrFail($id);

        if (isset($validated['status'])) {
            $order->status = $validated['status'];
        }
        if (isset($validated['payment_status'])) {
            $order->payment_status = $validated['payment_status'];
        }
        $order->save();

        return response()->json(['ok' => true, 'order' => $order]);
    }

    /** GET /api/shop/appointments */
    public function appointments(Request $request)
    {
        return Appointment::where('shop_id', $request->user()->id)
            ->orderByDesc('id')
            ->limit(500)
            ->get();
    }

    /** PATCH /api/shop/appointments/{id} */
    public function updateAppointment(Request $request, int $id)
    {
        $validated = $request->validate([
            'status' => ['sometimes', 'string', 'in:Pending,Confirmed,Completed,Cancelled'],
            'notes' => ['sometimes', 'string', 'max:1000'],
        ]);

        $record = Appointment::where('shop_id', $request->user()->id)->findOrFail($id);
        $record->fill($validated)->save();

        return response()->json(['ok' => true, 'appointment' => $record]);
    }

    /** GET /api/shop/custom-requests */
    public function customRequests(Request $request)
    {
        return CustomRequest::where('shop_id', $request->user()->id)
            ->orderByDesc('id')
            ->limit(500)
            ->get();
    }

    /** PATCH /api/shop/custom-requests/{id} */
    public function updateCustomRequest(Request $request, int $id)
    {
        $validated = $request->validate([
            'status' => ['sometimes', 'string', 'in:New,Reviewed,In Progress,Completed,Cancelled'],
        ]);

        $record = CustomRequest::where('shop_id', $request->user()->id)->findOrFail($id);
        $record->fill($validated)->save();

        return response()->json(['ok' => true, 'custom_request' => $record]);
    }
}