<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $shop = $request->user();
        $query = Customer::where('shop_id', $shop->id);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('mobile', 'like', "%{$search}%")
                  ->orWhere('cnic', 'like', "%{$search}%")
                  ->orWhere('customer_id', 'like', "%{$search}%");
            });
        }

        $total = $query->count();
        $perPage = min((int) $request->input('per_page', 50), 100);
        $customers = $query->orderByDesc('id')->paginate($perPage);

        return response()->json([
            'data' => $customers->items(),
            'total' => $total,
        ]);
    }

    public function store(Request $request)
    {
        $shop = $request->user();
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'father_name' => 'nullable|string|max:255',
            'cnic' => 'nullable|string|max:20',
            'mobile' => 'nullable|string|max:30',
            'whatsapp' => 'nullable|string|max:30',
            'email' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        $customer = Customer::create([
            'shop_id' => $shop->id,
            'ext_id' => Customer::where('shop_id', $shop->id)->max('ext_id') + 1,
            'name' => $validated['name'],
            'father_name' => $validated['father_name'] ?? null,
            'cnic' => $validated['cnic'] ?? null,
            'mobile' => $validated['mobile'] ?? null,
            'whatsapp' => $validated['whatsapp'] ?? null,
            'email' => $validated['email'] ?? null,
            'address' => $validated['address'] ?? null,
            'city' => $validated['city'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json(['ok' => true, 'customer' => $customer]);
    }

    public function show(Request $request, int $id)
    {
        $shop = $request->user();
        $customer = Customer::where('shop_id', $shop->id)->findOrFail($id);
        return response()->json($customer);
    }

    public function sales(Request $request, int $id)
    {
        $shop = $request->user();
        $customer = Customer::where('shop_id', $shop->id)->findOrFail($id);

        $sales = DB::table('sales')
            ->where('shop_id', $shop->id)
            ->where('customer_id', $customer->customer_id)
            ->orderByDesc('sale_date')
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'invoice_no' => $s->invoice_id,
                'date' => $s->sale_date,
                'items_summary' => '',
                'total' => $s->total,
                'paid' => $s->paid,
                'remaining' => $s->remaining,
                'status' => $s->remaining > 0 ? 'pending' : 'paid',
            ]);

        return response()->json($sales);
    }

    public function payments(Request $request, int $id)
    {
        $shop = $request->user();
        $customer = Customer::where('shop_id', $shop->id)->findOrFail($id);

        $payments = DB::table('payments')
            ->where('shop_id', $shop->id)
            ->where('customer_id', $customer->customer_id)
            ->orderByDesc('payment_date')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'date' => $p->payment_date,
                'amount' => $p->amount,
                'method' => $p->method,
                'reference' => $p->reference,
                'notes' => $p->notes,
            ]);

        return response()->json($payments);
    }

    public function ledger(Request $request, int $id)
    {
        $shop = $request->user();
        $customer = Customer::where('shop_id', $shop->id)->findOrFail($id);

        $entries = DB::table('ledger_entries')
            ->where('shop_id', $shop->id)
            ->where('customer_id', $customer->customer_id)
            ->orderBy('entry_date')
            ->get()
            ->map(fn ($e) => [
                'id' => $e->id,
                'date' => $e->entry_date,
                'type' => $e->debit > 0 ? 'sale' : 'payment',
                'description' => $e->description,
                'debit' => $e->debit,
                'credit' => $e->credit,
                'balance' => $e->balance,
            ]);

        return response()->json($entries);
    }
}
