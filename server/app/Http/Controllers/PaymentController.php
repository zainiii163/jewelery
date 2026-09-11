<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $shop = $request->user();
        $query = DB::table('payments')->where('shop_id', $shop->id);

        if ($from = $request->input('from')) {
            $query->where('payment_date', '>=', $from);
        }
        if ($to = $request->input('to')) {
            $query->where('payment_date', '<=', $to);
        }
        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        $payments = $query->orderByDesc('payment_date')->orderByDesc('id')->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'customer_name' => $p->customer_name,
                'amount' => $p->amount,
                'method' => $p->method,
                'type' => $p->type,
                'reference' => $p->reference,
                'notes' => $p->notes,
                'shop_code' => $request->input('shop_code', 'MAIN'),
                'created_at' => $p->created_at,
            ]);

        return response()->json($payments);
    }

    public function store(Request $request)
    {
        $shop = $request->user();
        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'method' => 'nullable|string|max:50',
            'type' => 'nullable|string|max:20',
            'reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $id = DB::table('payments')->insertGetId([
            'shop_id' => $shop->id,
            'ext_id' => (DB::table('payments')->where('shop_id', $shop->id)->max('ext_id') ?? 0) + 1,
            'customer_name' => $validated['customer_name'],
            'payment_date' => now()->toDateString(),
            'amount' => $validated['amount'],
            'method' => $validated['method'] ?? 'Cash',
            'type' => $validated['type'] ?? 'Received',
            'reference' => $validated['reference'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $payment = DB::table('payments')->find($id);

        return response()->json(['ok' => true, 'payment' => [
            'id' => $payment->id,
            'customer_name' => $payment->customer_name,
            'amount' => $payment->amount,
            'method' => $payment->method,
            'type' => $payment->type,
            'reference' => $payment->reference,
            'notes' => $payment->notes,
            'shop_code' => $request->input('shop_code', 'MAIN'),
            'created_at' => $payment->created_at,
        ]]);
    }
}
