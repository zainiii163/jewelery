<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\SaleRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SaleRecordController extends Controller
{
    public function index(Request $request)
    {
        $shop = $request->user();
        $query = SaleRecord::where('shop_id', $shop->id)->with('product');

        if ($from = $request->input('from')) {
            $query->where('sale_date', '>=', $from);
        }
        if ($to = $request->input('to')) {
            $query->where('sale_date', '<=', $to);
        }
        if ($search = $request->input('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                  ->orWhere('invoice_no', 'like', "%{$search}%");
            });
        }

        $records = $query->orderByDesc('sale_date')->orderByDesc('id')->paginate(50);

        return response()->json($records);
    }

    public function store(Request $request)
    {
        $shop = $request->user();
        $validated = $request->validate([
            'product_id' => 'nullable|integer|exists:products,id',
            'customer_name' => 'nullable|string|max:255',
            'customer_phone' => 'nullable|string|max:30',
            'sale_date' => 'required|date',
            'sale_price' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'amount_paid' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:2000',
        ]);

        $finalPrice = $validated['sale_price'] - ($validated['discount'] ?? 0);
        $amountPaid = $validated['amount_paid'] ?? $finalPrice;
        $remaining = $finalPrice - $amountPaid;
        $invoiceNo = 'INV-' . now()->format('ymd') . '-' . strtoupper(Str::random(6));

        $photos = [];
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $file) {
                $path = $file->store('sale_photos/' . $shop->id, 'public');
                $photos[] = $path;
            }
        }

        $record = SaleRecord::create([
            'shop_id' => $shop->id,
            'product_id' => $validated['product_id'] ?? null,
            'invoice_no' => $invoiceNo,
            'customer_name' => $validated['customer_name'] ?? null,
            'customer_phone' => $validated['customer_phone'] ?? null,
            'sale_date' => $validated['sale_date'],
            'sale_price' => $validated['sale_price'],
            'discount' => $validated['discount'] ?? 0,
            'final_price' => $finalPrice,
            'amount_paid' => $amountPaid,
            'amount_remaining' => $remaining,
            'payment_method' => $validated['payment_method'] ?? 'Cash',
            'notes' => $validated['notes'] ?? null,
            'photos' => $photos,
        ]);

        if ($validated['product_id']) {
            $product = Product::find($validated['product_id']);
            if ($product && $product->stock_qty > 0) {
                $product->decrement('stock_qty');
            }
        }

        return response()->json(['ok' => true, 'record' => $record], 201);
    }

    public function show(Request $request, int $id)
    {
        $shop = $request->user();
        $record = SaleRecord::where('shop_id', $shop->id)->with('product')->findOrFail($id);
        return response()->json($record);
    }

    public function destroy(Request $request, int $id)
    {
        $shop = $request->user();
        $deleted = SaleRecord::where('shop_id', $shop->id)->where('id', $id)->delete();
        if (!$deleted) return response()->json(['message' => 'Not found'], 404);
        return response()->json(['ok' => true]);
    }
}
