<?php

namespace App\Http\Controllers;

use App\Models\OnlineOrder;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Response;

/**
 * CSV exports for Excel / accounting. Streamed so large datasets stay light.
 */
class ExportController extends Controller
{
    /** GET /api/shop/orders/export?from=YYYY-MM-DD&to=YYYY-MM-DD&status=Pending */
    public function orders(Request $request)
    {
        $query = OnlineOrder::with('items')
            ->where('shop_id', $request->user()->id)
            ->orderByDesc('order_date');

        if ($request->filled('from')) {
            $query->whereDate('order_date', '>=', Carbon::parse($request->query('from')));
        }
        if ($request->filled('to')) {
            $query->whereDate('order_date', '<=', Carbon::parse($request->query('to')));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $orders = $query->get();
        $file = 'orders-'.Carbon::today()->toDateString().'.csv';

        return Response::streamDownload(function () use ($orders) {
            $out = fopen('php://output', 'w');
            fputcsv($out, [
                'Order #', 'Date', 'Customer', 'Phone', 'Email', 'City', 'Payment Method',
                'Payment Status', 'Status', 'Subtotal', 'Shipping', 'Discount', 'Grand Total',
                'Items (SKU x qty = line total)', 'Notes',
            ]);

            foreach ($orders as $o) {
                $items = $o->items->map(fn ($i) => trim(sprintf('%s x%d = %.2f', $i->sku ?? $i->product_name, $i->qty, $i->line_total)))->implode(' | ');
                fputcsv($out, [
                    $o->order_number,
                    optional($o->order_date)->toDateTimeString(),
                    $o->customer_name,
                    $o->customer_phone,
                    $o->customer_email,
                    $o->city,
                    $o->payment_method,
                    $o->payment_status,
                    $o->status,
                    $o->subtotal,
                    $o->shipping,
                    $o->discount,
                    $o->grand_total,
                    $items,
                    $o->notes,
                ]);
            }
            fclose($out);
        }, $file, ['Content-Type' => 'text/csv']);
    }

    /** GET /api/shop/products/export?published=1 */
    public function products(Request $request)
    {
        $query = Product::with('category')
            ->where('shop_id', $request->user()->id)
            ->orderBy('sku');

        if ($request->filled('published')) {
            $query->where('published', filter_var($request->query('published'), FILTER_VALIDATE_BOOL));
        }

        $products = $query->get();
        $file = 'products-'.Carbon::today()->toDateString().'.csv';

        return Response::streamDownload(function () use ($products) {
            $out = fopen('php://output', 'w');
            fputcsv($out, [
                'SKU', 'Name', 'Category', 'Metal', 'Purity (x1000)', 'Karat', 'Gross Weight (g)',
                'Net Weight (g)', 'Stone Weight (g)', 'Making Charges', 'Stone Charges',
                'Sale Price', 'Purchase Cost', 'Stock', 'Status', 'Published', 'Featured', 'New Arrival', 'Best Seller',
            ]);

            foreach ($products as $p) {
                fputcsv($out, [
                    $p->sku,
                    $p->name,
                    $p->category?->name,
                    $p->metal_type,
                    $p->purity,
                    $p->karat,
                    $p->gross_weight,
                    $p->net_weight,
                    $p->stone_weight,
                    $p->making_charges,
                    $p->stone_charges,
                    $p->sale_price,
                    $p->purchase_cost,
                    $p->stock_qty,
                    $p->status,
                    $p->published ? 'Yes' : 'No',
                    $p->featured ? 'Yes' : 'No',
                    $p->new_arrival ? 'Yes' : 'No',
                    $p->best_seller ? 'Yes' : 'No',
                ]);
            }
            fclose($out);
        }, $file, ['Content-Type' => 'text/csv']);
    }
}