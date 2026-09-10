<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\OnlineOrder;
use App\Models\OnlineOrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Dashboard & analytics endpoints for the admin panel (and the desktop app).
 * All figures are scoped to the authenticated shop and exclude Cancelled /
 * Returned orders unless stated otherwise.
 */
class ReportsController extends Controller
{
    private const EXCLUDED = ['Cancelled', 'Returned'];

    /** GET /api/shop/reports/summary — KPI cards. */
    public function summary(Request $request)
    {
        $shopId = $request->user()->id;

        $revenueBase = OnlineOrder::where('shop_id', $shopId)
            ->whereNotIn('status', self::EXCLUDED);

        $todayBase = (clone $revenueBase)
            ->whereDate('order_date', Carbon::today());

        $totalRevenue = (clone $revenueBase)->sum('grand_total');
        $todayRevenue = (clone $todayBase)->sum('grand_total');

        $totalOrders = (clone $revenueBase)->count();
        $todayOrders = (clone $todayBase)->count();

        $pendingOrders = OnlineOrder::where('shop_id', $shopId)
            ->whereIn('status', ['Pending', 'Confirmed', 'Processing'])->count();
        $newAppointments = Appointment::where('shop_id', $shopId)
            ->whereIn('status', ['Pending', 'Requested'])->count();
        $newRequests = \App\Models\CustomRequest::where('shop_id', $shopId)
            ->whereIn('status', ['Pending', 'New'])->count();

        $last30Revenue = (clone $revenueBase)
            ->whereDate('order_date', '>=', Carbon::today()->subDays(29))
            ->sum('grand_total');

        $productCount = Product::where('shop_id', $shopId)->count();
        $publishedCount = Product::where('shop_id', $shopId)->where('published', true)->count();
        $lowStock = Product::where('shop_id', $shopId)
            ->where('stock_qty', '<=', 5)->count();

        // Revenue this week vs last week
        $weekRevenue = (clone $revenueBase)->whereBetween('order_date', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()])->sum('grand_total');
        $lastWeekRevenue = (clone $revenueBase)->whereBetween('order_date', [Carbon::now()->subWeek()->startOfWeek(), Carbon::now()->subWeek()->endOfWeek()])->sum('grand_total');
        $weekChange = $lastWeekRevenue > 0 ? round((($weekRevenue - $lastWeekRevenue) / $lastWeekRevenue) * 100, 1) : null;

        return response()->json([
            'total_revenue' => round((float) $totalRevenue, 2),
            'today_revenue' => round((float) $todayRevenue, 2),
            'last_30_revenue' => round((float) $last30Revenue, 2),
            'week_revenue' => round((float) $weekRevenue, 2),
            'week_change_pct' => $weekChange,
            'total_orders' => $totalOrders,
            'today_orders' => $todayOrders,
            'pending_orders' => $pendingOrders,
            'new_appointments' => $newAppointments,
            'new_custom_requests' => $newRequests,
            'product_count' => $productCount,
            'published_count' => $publishedCount,
            'low_stock_count' => $lowStock,
        ]);
    }

    /** GET /api/shop/reports/sales?days=30 — daily revenue/order series. */
    public function sales(Request $request)
    {
        $shopId = $request->user()->id;
        $days = min((int) $request->query('days', 30), 365);

        $start = Carbon::today()->subDays($days - 1);
        $base = OnlineOrder::where('shop_id', $shopId)
            ->whereNotIn('status', self::EXCLUDED)
            ->whereDate('order_date', '>=', $start);

        $rows = (clone $base)
            ->select(DB::raw("date(order_date) as day"),
                DB::raw('count(*) as orders'),
                DB::raw('sum(grand_total) as revenue'))
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->keyBy('day');

        $series = [];
        for ($d = clone $start; $d->lte(Carbon::today()); $d->addDay()) {
            $key = $d->toDateString();
            $row = $rows->get($key);
            $series[] = [
                'date' => $key,
                'orders' => (int) ($row->orders ?? 0),
                'revenue' => round((float) ($row->revenue ?? 0), 2),
            ];
        }

        $revenue = array_sum(array_column($series, 'revenue'));
        $orders = array_sum(array_column($series, 'orders'));

        return response()->json(['series' => $series, 'total_revenue' => $revenue, 'total_orders' => $orders]);
    }

    /** GET /api/shop/reports/top-products?limit=10 — best sellers by qty. */
    public function topProducts(Request $request)
    {
        $shopId = $request->user()->id;
        $limit = min((int) $request->query('limit', 10), 50);

        $rows = OnlineOrderItem::join('online_orders', 'online_orders.id', '=', 'online_order_items.order_id')
            ->where('online_orders.shop_id', $shopId)
            ->whereNotIn('online_orders.status', self::EXCLUDED)
            ->select(
                'online_order_items.sku',
                'online_order_items.product_name',
                DB::raw('sum(online_order_items.qty) as qty'),
                DB::raw('sum(online_order_items.line_total) as revenue')
            )
            ->groupBy('online_order_items.sku', 'online_order_items.product_name')
            ->orderByDesc('qty')
            ->limit($limit)
            ->get()
            ->map(fn ($r) => [
                'sku' => $r->sku,
                'product_name' => $r->product_name,
                'qty' => (int) $r->qty,
                'revenue' => round((float) $r->revenue, 2),
            ]);

        return response()->json(['items' => $rows]);
    }

    /** GET /api/shop/reports/status-breakdown — order counts per status. */
    public function statusBreakdown(Request $request)
    {
        $rows = OnlineOrder::where('shop_id', $request->user()->id)
            ->select('status', DB::raw('count(*) as count'), DB::raw('sum(grand_total) as revenue'))
            ->groupBy('status')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($r) => [
                'status' => $r->status,
                'count' => (int) $r->count,
                'revenue' => round((float) $r->revenue, 2),
            ]);

        return response()->json(['items' => $rows]);
    }

    /** GET /api/shop/reports/payment-methods — counts + revenue per method. */
    public function paymentMethods(Request $request)
    {
        $rows = OnlineOrder::where('shop_id', $request->user()->id)
            ->whereNotIn('status', self::EXCLUDED)
            ->select('payment_method', DB::raw('count(*) as count'), DB::raw('sum(grand_total) as revenue'))
            ->groupBy('payment_method')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($r) => [
                'method' => $r->payment_method,
                'count' => (int) $r->count,
                'revenue' => round((float) $r->revenue, 2),
            ]);

        return response()->json(['items' => $rows]);
    }

    /** GET /api/shop/reports/low-stock?threshold=5 — products at/below threshold. */
    public function lowStock(Request $request)
    {
        $threshold = max((int) $request->query('threshold', 5), 1);

        $rows = Product::with(['category', 'media'])
            ->where('shop_id', $request->user()->id)
            ->where('stock_qty', '<=', $threshold)
            ->orderBy('stock_qty')
            ->get();

        return response()->json(['items' => $rows]);
    }
}