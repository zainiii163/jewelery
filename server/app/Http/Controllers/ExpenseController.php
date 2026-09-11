<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $shop = $request->user();
        $query = DB::table('expenses')->where('shop_id', $shop->id);

        if ($from = $request->input('from')) {
            $query->where('expense_date', '>=', $from);
        }
        if ($to = $request->input('to')) {
            $query->where('expense_date', '<=', $to);
        }

        $expenses = $query->orderByDesc('expense_date')->orderByDesc('id')->get()
            ->map(fn ($e) => [
                'id' => $e->id,
                'date' => $e->expense_date,
                'category' => $e->category,
                'description' => $e->description,
                'amount' => $e->amount,
                'payment_method' => $e->payment_method,
                'notes' => $e->notes,
                'created_at' => $e->created_at,
                'updated_at' => $e->updated_at,
            ]);

        return response()->json(['data' => $expenses]);
    }

    public function store(Request $request)
    {
        $shop = $request->user();
        $validated = $request->validate([
            'date' => 'nullable|date',
            'category' => 'required|string|max:100',
            'description' => 'required|string|max:500',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
        ]);

        $id = DB::table('expenses')->insertGetId([
            'shop_id' => $shop->id,
            'ext_id' => (DB::table('expenses')->where('shop_id', $shop->id)->max('ext_id') ?? 0) + 1,
            'expense_date' => $validated['date'] ?? now()->toDateString(),
            'category' => $validated['category'],
            'description' => $validated['description'],
            'amount' => $validated['amount'],
            'payment_method' => $validated['payment_method'] ?? 'Cash',
            'notes' => $validated['notes'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['ok' => true, 'id' => $id]);
    }

    public function update(Request $request, int $id)
    {
        $shop = $request->user();
        $expense = DB::table('expenses')->where('shop_id', $shop->id)->where('id', $id)->first();
        if (!$expense) return response()->json(['message' => 'Not found'], 404);

        $validated = $request->validate([
            'date' => 'nullable|date',
            'category' => 'required|string|max:100',
            'description' => 'required|string|max:500',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
        ]);

        DB::table('expenses')->where('id', $id)->update([
            'expense_date' => $validated['date'] ?? $expense->expense_date,
            'category' => $validated['category'],
            'description' => $validated['description'],
            'amount' => $validated['amount'],
            'payment_method' => $validated['payment_method'] ?? $expense->payment_method,
            'notes' => $validated['notes'] ?? $expense->notes,
            'updated_at' => now(),
        ]);

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, int $id)
    {
        $shop = $request->user();
        $deleted = DB::table('expenses')->where('shop_id', $shop->id)->where('id', $id)->delete();
        if (!$deleted) return response()->json(['message' => 'Not found'], 404);
        return response()->json(['ok' => true]);
    }
}
