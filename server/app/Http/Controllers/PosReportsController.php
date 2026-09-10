<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Exchange;
use App\Models\Expense;
use App\Models\GoldRate;
use App\Models\LedgerEntry;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Repair;
use App\Models\Sale;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Response;

/**
 * Reports over desktop-POS business data synced to the cloud
 * (sales, purchases, expenses, repairs, exchanges, ledger, rates, inventory).
 * Every endpoint supports ?format=json|csv|pdf and ?from=&to= date ranges.
 */
class PosReportsController extends Controller
{
    public function summary(Request $request)
    {
        [$from, $to] = $this->range($request);
        $shopId = $request->user()->id;

        $sales = Sale::where('shop_id', $shopId)->whereBetween('sale_date', [$from, $to]);
        $salesTotal = (float) $sales->sum('total');
        $salesCount = (int) $sales->count();

        return response()->json([
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'sales_total' => $salesTotal,
            'sales_count' => $salesCount,
            'avg_sale' => $salesCount ? round($salesTotal / $salesCount, 2) : 0,
            'purchases_total' => (float) Purchase::where('shop_id', $shopId)->whereBetween('purchase_date', [$from, $to])->sum('total_cost'),
            'expenses_total' => (float) Expense::where('shop_id', $shopId)->whereBetween('expense_date', [$from, $to])->sum('amount'),
            'payments_received' => (float) Payment::where('shop_id', $shopId)->whereBetween('payment_date', [$from, $to])->where('type', 'Received')->sum('amount'),
            'repairs_pending' => (int) Repair::where('shop_id', $shopId)->whereNotIn('status', ['Completed', 'Cancelled'])->count(),
            'repairs_charges' => (float) Repair::where('shop_id', $shopId)->whereBetween('received_date', [$from, $to])->sum('final_charges'),
            'exchanges_net' => (float) Exchange::where('shop_id', $shopId)->whereBetween('exchange_date', [$from, $to])->sum('net_amount'),
            'receivables' => (float) Customer::where('shop_id', $shopId)->get()->sum(fn ($c) => $c->balance),
            'gold_weight' => round((float) Product::where('shop_id', $shopId)->where('metal_type', 'gold')->where('status', 'In Stock')->sum('net_weight'), 3),
            'silver_weight' => round((float) Product::where('shop_id', $shopId)->where('metal_type', 'silver')->where('status', 'In Stock')->sum('net_weight'), 3),
            'inventory_value' => round((float) Product::where('shop_id', $shopId)->where('status', 'In Stock')->sum(DB::raw('sale_price * stock_qty')), 2),
            'low_stock_count' => (int) Product::where('shop_id', $shopId)->where('stock_qty', '<=', (int) ($request->query('threshold', 5)))->count(),
        ]);
    }

    public function sales(Request $request)
    {
        [$from, $to] = $this->range($request);
        $shopId = $request->user()->id;
        $period = $request->query('period', 'day');
        if (! in_array($period, ['day', 'week', 'month', 'year'])) {
            $period = 'day';
        }

        $rows = Sale::where('shop_id', $shopId)->whereBetween('sale_date', [$from, $to])
            ->selectRaw('sale_date, COUNT(*) as count, COALESCE(SUM(total),0) as revenue')
            ->groupBy('sale_date')->orderBy('sale_date')->get();

        $series = $this->bucketize($rows, $from, $to, $period);

        return response()->json([
            'period' => $period,
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'series' => $series,
            'total_revenue' => round(array_sum(array_column($series, 'revenue')), 2),
            'total_orders' => (int) array_sum(array_column($series, 'orders')),
        ]);
    }

    public function purchases(Request $request)
    {
        return $this->table($request, Purchase::class, 'Purchases Report', [
            ['key' => 'purchase_id', 'label' => 'ID'],
            ['key' => 'date', 'label' => 'Date', 'cl' => 'purchase_date'],
            ['key' => 'supplier_name', 'label' => 'Supplier'],
            ['key' => 'product_name', 'label' => 'Product'],
            ['key' => 'net_weight', 'label' => 'Net Wt (g)'],
            ['key' => 'karat', 'label' => 'Karat'],
            ['key' => 'rate', 'label' => 'Rate'],
            ['key' => 'total_cost', 'label' => 'Cost', 'fmt' => 'money'],
            ['key' => 'paid', 'label' => 'Paid', 'fmt' => 'money'],
            ['key' => 'remaining', 'label' => 'Remaining', 'fmt' => 'money'],
        ]);
    }

    public function expenses(Request $request)
    {
        return $this->table($request, Expense::class, 'Expenses Report', [
            ['key' => 'expense_id', 'label' => 'ID'],
            ['key' => 'date', 'label' => 'Date', 'cl' => 'expense_date'],
            ['key' => 'category', 'label' => 'Category'],
            ['key' => 'description', 'label' => 'Description'],
            ['key' => 'payment_method', 'label' => 'Method'],
            ['key' => 'amount', 'label' => 'Amount', 'fmt' => 'money'],
        ]);
    }

    public function repairs(Request $request)
    {
        return $this->table($request, Repair::class, 'Repairs Report', [
            ['key' => 'repair_id', 'label' => 'ID'],
            ['key' => 'received_date', 'label' => 'Received'],
            ['key' => 'customer_name', 'label' => 'Customer'],
            ['key' => 'product_name', 'label' => 'Product'],
            ['key' => 'problem', 'label' => 'Problem'],
            ['key' => 'estimated_charges', 'label' => 'Estimated', 'fmt' => 'money'],
            ['key' => 'final_charges', 'label' => 'Final', 'fmt' => 'money'],
            ['key' => 'status', 'label' => 'Status'],
        ]);
    }

    public function exchanges(Request $request)
    {
        return $this->table($request, Exchange::class, 'Exchanges Report', [
            ['key' => 'exchange_id', 'label' => 'ID'],
            ['key' => 'date', 'label' => 'Date', 'cl' => 'exchange_date'],
            ['key' => 'customer_name', 'label' => 'Customer'],
            ['key' => 'old_total_value', 'label' => 'Old Value', 'fmt' => 'money'],
            ['key' => 'new_total_value', 'label' => 'New Value', 'fmt' => 'money'],
            ['key' => 'net_amount', 'label' => 'Net', 'fmt' => 'money'],
            ['key' => 'cash_received', 'label' => 'Cash Rec.', 'fmt' => 'money'],
            ['key' => 'amount_due', 'label' => 'Due', 'fmt' => 'money'],
        ]);
    }

    public function customers(Request $request)
    {
        $shopId = $request->user()->id;
        $customers = Customer::where('shop_id', $shopId)->orderBy('name')->get();

        $rows = $customers->map(fn ($c) => [
            $c->customer_id ?? $c->ext_id,
            $c->name,
            $c->mobile ?? '',
            $c->city ?? '',
            number_format((float) $c->total_amount, 2),
            number_format((float) $c->paid_amount, 2),
            number_format($c->balance, 2),
        ])->values()->all();

        $receivables = round((float) $customers->sum(fn ($c) => $c->balance), 2);

        return $this->respond($request, 'Customer Balances', [
            'Customer ID', 'Name', 'Mobile', 'City', 'Total Sales', 'Paid', 'Balance',
        ], $rows, ['Receivables' => number_format($receivables, 2)]);
    }

    public function ledger(Request $request)
    {
        $builder = LedgerEntry::where('shop_id', $request->user()->id);
        if ($request->query('customer_id')) {
            $builder->where('customer_id', $request->query('customer_id'));
        }
        [$from, $to] = $this->range($request);
        $builder->whereBetween('entry_date', [$from, $to]);

        $rows = $builder->orderByDesc('entry_date')->limit(2000)->get()->map(fn ($l) => [
            $l->entry_date?->toDateString() ?? '',
            $l->customer_name ?? '',
            $l->description ?? '',
            number_format((float) $l->debit, 2),
            number_format((float) $l->credit, 2),
            number_format((float) $l->balance, 2),
        ])->values()->all();

        $totals = [
            'Total Debit' => number_format((float) LedgerEntry::where('shop_id', $request->user()->id)
                ->whereBetween('entry_date', [$from, $to])
                ->when($request->query('customer_id'), fn ($q) => $q->where('customer_id', $request->query('customer_id')))
                ->sum('debit'), 2),
            'Total Credit' => number_format((float) LedgerEntry::where('shop_id', $request->user()->id)
                ->whereBetween('entry_date', [$from, $to])
                ->when($request->query('customer_id'), fn ($q) => $q->where('customer_id', $request->query('customer_id')))
                ->sum('credit'), 2),
        ];

        return $this->respond($request, 'Customer Ledger', [
            'Date', 'Customer', 'Description', 'Debit', 'Credit', 'Balance',
        ], $rows, $totals);
    }

    public function inventory(Request $request)
    {
        $shopId = $request->user()->id;
        $products = Product::with('category')->where('shop_id', $shopId)->orderBy('name')->get();

        $rows = $products->map(fn ($p) => [
            $p->sku ?? $p->id,
            $p->name,
            ucfirst($p->metal_type),
            $p->karat ? $p->karat.'K' : '',
            number_format((float) $p->net_weight, 3),
            $p->status,
            number_format((float) $p->sale_price, 2),
            number_format((float) $p->purchase_cost, 2),
            (int) $p->stock_qty,
            number_format((float) $p->sale_price * max(0, (int) $p->stock_qty), 2),
        ])->values()->all();

        $value = round((float) $products->where('status', 'In Stock')->sum(fn ($p) => $p->sale_price * max(0, (int) $p->stock_qty)), 2);

        return $this->respond($request, 'Inventory / Stock Report', [
            'SKU', 'Product', 'Metal', 'Karat', 'Net Wt', 'Status', 'Price', 'Cost', 'Qty', 'Value',
        ], $rows, ['Stock Value' => number_format($value, 2)]);
    }

    public function goldRates(Request $request)
    {
        [$from, $to] = $this->range($request);
        $rows = GoldRate::where('shop_id', $request->user()->id)
            ->whereBetween('rate_date', [$from, $to])
            ->orderByDesc('rate_date')->get()->map(fn ($r) => [
                $r->rate_date?->toDateString() ?? '',
                number_format((float) $r->rate24k, 2),
                number_format((float) $r->rate22k, 2),
                number_format((float) $r->rate21k, 2),
                number_format((float) $r->rate20k, 2),
                number_format((float) $r->rate18k, 2),
                number_format((float) $r->silver_rate, 2),
            ])->values()->all();

        return $this->respond($request, 'Gold & Silver Rates', [
            'Date', '24K', '22K', '21K', '20K', '18K', 'Silver',
        ], $rows);
    }

    public function profitLoss(Request $request)
    {
        [$from, $to] = $this->range($request);
        $shopId = $request->user()->id;

        $revenue = (float) Sale::where('shop_id', $shopId)->whereBetween('sale_date', [$from, $to])->sum('total');
        $repairCharges = (float) Repair::where('shop_id', $shopId)->whereBetween('received_date', [$from, $to])->sum('final_charges');
        $exchangeNet = (float) Exchange::where('shop_id', $shopId)->whereBetween('exchange_date', [$from, $to])->sum('net_amount');
        $purchases = (float) Purchase::where('shop_id', $shopId)->whereBetween('purchase_date', [$from, $to])->sum('total_cost');
        $expenses = (float) Expense::where('shop_id', $shopId)->whereBetween('expense_date', [$from, $to])->sum('amount');

        $income = $revenue + $repairCharges + $exchangeNet;
        $expenditure = $purchases + $expenses;
        $net = $income - $expenditure;

        $rows = [
            ['POS Sales Revenue', number_format($revenue, 2)],
            ['Repair Charges', number_format($repairCharges, 2)],
            ['Exchange Income (net)', number_format($exchangeNet, 2)],
            ['Total Income', number_format($income, 2)],
            ['Purchases (this period)', number_format($purchases, 2)],
            ['Expenses', number_format($expenses, 2)],
            ['Total Expenditure', number_format($expenditure, 2)],
            ['NET PROFIT / LOSS', number_format($net, 2)],
        ];

        return $this->respond($request, 'Profit & Loss Statement', ['Item', 'Amount (Rs.)'], $rows, ['Net Profit / Loss' => number_format($net, 2)], true);
    }

    private function table(Request $request, string $model, string $title, array $cols)
    {
        $shopId = $request->user()->id;
        [ $from, $to ] = $this->range($request);
        /** @var \Illuminate\Database\Eloquent\Builder $builder */
        $builder = $model::where('shop_id', $shopId);

        $dateCol = null;
        foreach ($cols as $c) {
            if (isset($c['cl'])) {
                $dateCol = $c['cl'];
                break;
            }
        }
        if ($dateCol) {
            $builder->whereBetween($dateCol, [$from, $to]);
        }
        if ($model === Repair::class && $request->query('status')) {
            $builder->where('status', $request->query('status'));
        }

        $entities = $builder->orderByDesc($dateCol ?? 'id')->limit(2000)->get();

        $totals = [];
        $rows = $entities->map(function ($e) use ($cols) {
            $out = [];
            foreach ($cols as $c) {
                $v = $e->{$c['key']};
                if ($c['fmt'] ?? '' === 'money') {
                    $out[] = number_format((float) $v, 2);
                } elseif ($c['key'] === 'date' || str_ends_with($c['key'], '_date')) {
                    $out[] = $v && method_exists($v, 'toDateString') ? $v->toDateString() : (string) $v;
                } else {
                    $out[] = is_null($v) ? '' : (string) $v;
                }
            }

            return $out;
        });

        if (empty($cols)) {
            $totals['Rows'] = (string) count($rows);
        }

        return $this->respond($request, $title, array_column($cols, 'label'), $rows->values()->all(), $totals);
    }

    /**
     * Build the standard response shape, or stream CSV/PDF when requested.
     */
    private function respond(Request $request, string $title, array $headings, array $rows, array $totals = [], bool $plain = false): mixed
    {
        [$from, $to] = $this->range($request);
        $format = $request->query('format', 'json');

        if ($format === 'csv') {
            $filename = strtolower(str_replace([' ', '&', '/'], '-', $title)).'-'.$from->format('Ymd').'-'.$to->format('Ymd').'.csv';
            $allRows = array_merge([$headings], $rows, $totals ? [[], array_merge(array_fill(0, count($headings) - count($totals), ''), array_values($totals))] : []);

            return Response::streamDownload(function () use ($allRows) {
                $out = fopen('php://output', 'w');
                foreach ($allRows as $r) {
                    fputcsv($out, is_array($r) ? array_map(fn ($v) => trim((string) $v), array_values($r)) : []);
                }
                fclose($out);
            }, $filename, ['Content-Type' => 'text/csv']);
        }

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('reports.pos', [
                'title' => $title,
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'headings' => $headings,
                'rows' => $rows,
                'totals' => $totals,
                'shopName' => $request->user()->name,
            ]);

            return $pdf->download(mb_strtolower(str_replace([' ', '&', '/'], '-', $title)).'-'.$from->format('Ymd').'-'.$to->format('Ymd').'.pdf');
        }

        if ($plain) {
            return response()->json(['title' => $title, 'rows' => $rows, 'totals' => $totals]);
        }

        return response()->json([
            'title' => $title,
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'headings' => $headings,
            'rows' => $rows,
            'totals' => $totals,
        ]);
    }

    private function range(Request $request): array
    {
        $from = $request->date('from') ?? now()->startOfMonth();
        $to = $request->date('to') ?? now();
        if ($from->greaterThan($to)) {
            [$to, $from] = [$from, $to];
        }

        return [$from->startOfDay(), $to->endOfDay()];
    }

    /**
     * Group daily aggregates into day/week/month/year buckets.
     */
    private function bucketize($rows, Carbon $from, Carbon $to, string $period): array
    {
        $byDate = [];
        foreach ($rows as $r) {
            $byDate[$r->sale_date?->toDateString()] = [(int) $r->count, (float) $r->revenue];
        }

        $out = [];
        $cursor = $from->copy()->startOfDay();
        $end = $to->copy()->startOfDay();

        if ($period === 'day') {
            while ($cursor->lte($end)) {
                $d = $cursor->toDateString();
                $vals = $byDate[$d] ?? [0, 0.0];
                $out[] = ['label' => $d, 'orders' => $vals[0], 'revenue' => round($vals[1], 2)];
                $cursor->addDay();
            }

            return $out;
        }

        while ($cursor->lte($end)) {
            $toPeriod = match ($period) {
                'week' => $cursor->copy()->addWeek()->subDay(),
                'month' => $cursor->copy()->endOfMonth(),
                default => $cursor->copy()->endOfYear(),
            };
            if ($toPeriod->greaterThan($end)) {
                $toPeriod = $end;
            }
            $count = 0;
            $revenue = 0.0;
            for ($d = $cursor->copy(); $d->lte($toPeriod); $d->addDay()) {
                $vals = $byDate[$d->toDateString()] ?? null;
                if ($vals) {
                    $count += $vals[0];
                    $revenue += $vals[1];
                }
            }
            $label = match ($period) {
                'week' => $cursor->format('Y-m-d').' (W'.$cursor->isoWeek().')',
                'month' => $cursor->format('Y-m'),
                default => $cursor->format('Y'),
            };
            $out[] = ['label' => $label, 'orders' => $count, 'revenue' => round($revenue, 2)];
            $cursor = $toPeriod->copy()->addDay();
        }

        return $out;
    }
}