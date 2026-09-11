<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RepairController extends Controller
{
    public function index(Request $request)
    {
        $shop = $request->user();
        $repairs = DB::table('repairs')
            ->where('shop_id', $shop->id)
            ->orderByDesc('id')
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'customer_name' => $r->customer_name,
                'product_name' => $r->product_name,
                'problem' => $r->problem,
                'status' => $r->status,
                'received_date' => $r->received_date,
                'expected_date' => $r->expected_date,
                'estimated_charges' => $r->estimated_charges,
                'final_charges' => $r->final_charges,
                'employee' => $r->employee,
                'notes' => $r->notes,
                'created_at' => $r->created_at,
            ]);

        return response()->json(['repairs' => $repairs]);
    }

    public function store(Request $request)
    {
        $shop = $request->user();
        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'product_name' => 'required|string|max:255',
            'problem' => 'required|string|max:1000',
            'status' => 'nullable|string|max:50',
            'estimated_charges' => 'nullable|numeric|min:0',
            'final_charges' => 'nullable|numeric|min:0',
            'employee' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'expected_date' => 'nullable|date',
        ]);

        $id = DB::table('repairs')->insertGetId([
            'shop_id' => $shop->id,
            'ext_id' => (DB::table('repairs')->where('shop_id', $shop->id)->max('ext_id') ?? 0) + 1,
            'customer_name' => $validated['customer_name'],
            'product_name' => $validated['product_name'],
            'problem' => $validated['problem'],
            'status' => $validated['status'] ?? 'Received',
            'received_date' => now()->toDateString(),
            'expected_date' => $validated['expected_date'] ?? null,
            'estimated_charges' => $validated['estimated_charges'] ?? 0,
            'final_charges' => $validated['final_charges'] ?? 0,
            'employee' => $validated['employee'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['ok' => true, 'id' => $id]);
    }

    public function update(Request $request, int $id)
    {
        $shop = $request->user();
        $repair = DB::table('repairs')->where('shop_id', $shop->id)->where('id', $id)->first();
        if (!$repair) return response()->json(['message' => 'Not found'], 404);

        $validated = $request->validate([
            'customer_name' => 'sometimes|string|max:255',
            'product_name' => 'sometimes|string|max:255',
            'problem' => 'sometimes|string|max:1000',
            'status' => 'nullable|string|max:50',
            'estimated_charges' => 'nullable|numeric|min:0',
            'final_charges' => 'nullable|numeric|min:0',
            'employee' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'expected_date' => 'nullable|date',
        ]);

        $updates = ['updated_at' => now()];
        foreach (['customer_name', 'product_name', 'problem', 'status', 'estimated_charges', 'final_charges', 'employee', 'notes', 'expected_date'] as $field) {
            if (array_key_exists($field, $validated)) {
                $updates[$field] = $validated[$field];
            }
        }

        DB::table('repairs')->where('id', $id)->update($updates);
        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, int $id)
    {
        $shop = $request->user();
        $deleted = DB::table('repairs')->where('shop_id', $shop->id)->where('id', $id)->delete();
        if (!$deleted) return response()->json(['message' => 'Not found'], 404);
        return response()->json(['ok' => true]);
    }
}
