<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\CustomRequest;
use App\Models\OnlineOrder;
use App\Models\OnlineOrderItem;
use App\Models\Product;
use App\Models\Shop;
use Illuminate\Http\Request;

/**
 * Public intake endpoints used by the website checkout/contact forms.
 */
class CheckoutController extends Controller
{
    private function resolveShop(Request $request): Shop
    {
        $code = $request->input('shop_code', Shop::first()?->shop_code);

        return Shop::where('shop_code', strtoupper((string) $code))->firstOrFail();
    }

    private function nextOrderNumber(): string
    {
        $last = OnlineOrder::latest('id')->value('order_number');

        $number = $last ? ((int) substr($last, 4)) + 1 : 1001;

        return 'ORD-' . $number;
    }

    /** POST /api/orders — create an order from the website. */
    public function createOrder(Request $request)
    {
        $validated = $request->validate([
            'shop_code' => ['sometimes', 'string'],
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:30'],
            'customer_email' => ['nullable', 'email'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string'],
            'payment_method' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.sku' => ['required', 'string'],
            'items.*.qty' => ['required', 'integer', 'min:1'],
        ]);

        $shop = $this->resolveShop($request);

        $rows = [];
        $totals = ['subtotal' => 0, 'shipping' => (float) ($request->input('shipping', 0)), 'discount' => (float) ($request->input('discount', 0))];

        foreach ($validated['items'] as $line) {
            $product = Product::where('shop_id', $shop->id)
                ->where('sku', $line['sku'])
                ->published()
                ->first();

            if (! $product) {
                return response()->json(['message' => "Product {$line['sku']} is not available."], 422);
            }

            $lineTotal = $product->sale_price * $line['qty'];
            $rows[] = OnlineOrderItem::make([
                'product_id' => $product->id,
                'sku' => $product->sku,
                'product_name' => $product->name,
                'qty' => $line['qty'],
                'unit_price' => $product->sale_price,
                'line_total' => $lineTotal,
            ]);
            $totals['subtotal'] += $lineTotal;
        }

        $grand = $totals['subtotal'] + $totals['shipping'] - $totals['discount'];

        $order = OnlineOrder::create([
            'shop_id' => $shop->id,
            'order_number' => $this->nextOrderNumber(),
            'customer_name' => $validated['customer_name'],
            'customer_phone' => $request->input('customer_phone'),
            'customer_email' => $request->input('customer_email'),
            'address' => $request->input('address'),
            'city' => $request->input('city'),
            'payment_method' => $request->input('payment_method', 'cod'),
            'payment_status' => $request->input('payment_method', 'cod') === 'cod' ? 'pending' : 'pending',
            'status' => 'Pending',
            'subtotal' => $totals['subtotal'],
            'shipping' => $totals['shipping'],
            'discount' => $totals['discount'],
            'grand_total' => $grand,
            'notes' => $request->input('notes'),
            'order_date' => now(),
        ]);

        $order->items()->saveMany($rows);

        return response()->json([
            'ok' => true,
            'order_number' => $order->order_number,
            'grand_total' => $grand,
        ], 201);
    }

    /** POST /api/appointments */
    public function createAppointment(Request $request)
    {
        $validated = $request->validate([
            'shop_code' => ['sometimes', 'string'],
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'date' => ['required', 'date'],
            'time' => ['nullable', 'string'],
            'purpose' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $shop = $this->resolveShop($request);

        $appointment = Appointment::create([
            'shop_id' => $shop->id,
            'name' => $validated['name'],
            'phone' => $request->input('phone'),
            'date' => $validated['date'],
            'time' => $request->input('time'),
            'purpose' => $request->input('purpose'),
            'notes' => $request->input('notes'),
            'status' => 'Pending',
        ]);

        return response()->json(['ok' => true, 'id' => $appointment->id], 201);
    }

    /** POST /api/custom-requests */
    public function createCustomRequest(Request $request)
    {
        $validated = $request->validate([
            'shop_code' => ['sometimes', 'string'],
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'jewellery_type' => ['nullable', 'string', 'max:255'],
            'metal' => ['nullable', 'in:gold,silver'],
            'karat' => ['nullable', 'integer', 'max:24'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'file', 'image', 'max:8192'],
        ]);

        $shop = $this->resolveShop($request);

        $image = null;
        if ($request->hasFile('image')) {
            $image = $request->file('image')->store('custom_requests', 'public');
        }

        $requestRecord = CustomRequest::create([
            'shop_id' => $shop->id,
            'name' => $validated['name'],
            'phone' => $request->input('phone'),
            'jewellery_type' => $request->input('jewellery_type'),
            'metal' => $request->input('metal'),
            'karat' => $request->input('karat'),
            'budget' => $request->input('budget'),
            'description' => $request->input('description'),
            'image' => $image,
            'status' => 'New',
        ]);

        return response()->json(['ok' => true, 'id' => $requestRecord->id], 201);
    }
}