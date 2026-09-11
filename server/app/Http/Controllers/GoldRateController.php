<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GoldRateController extends Controller
{
    public function index(Request $request)
    {
        $shop = $request->user();
        $rates = DB::table('gold_rates')
            ->where('shop_id', $shop->id)
            ->orderByDesc('rate_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'shop_code' => $request->input('shop_code', 'MAIN'),
                'rate24k' => $r->rate24k,
                'rate22k' => $r->rate22k,
                'rate21k' => $r->rate21k,
                'rate20k' => $r->rate20k,
                'rate18k' => $r->rate18k,
                'silver_rate' => $r->silver_rate,
                'created_at' => $r->created_at,
            ]);

        return response()->json(['rates' => $rates]);
    }

    public function store(Request $request)
    {
        $shop = $request->user();
        $validated = $request->validate([
            'rate24k' => 'required|numeric|min:0',
            'rate22k' => 'nullable|numeric|min:0',
            'rate21k' => 'nullable|numeric|min:0',
            'rate20k' => 'nullable|numeric|min:0',
            'rate18k' => 'nullable|numeric|min:0',
            'silver_rate' => 'nullable|numeric|min:0',
        ]);

        DB::table('gold_rates')->insert([
            'shop_id' => $shop->id,
            'ext_id' => (DB::table('gold_rates')->where('shop_id', $shop->id)->max('ext_id') ?? 0) + 1,
            'rate_date' => now()->toDateString(),
            'rate24k' => $validated['rate24k'],
            'rate22k' => $validated['rate22k'] ?? 0,
            'rate21k' => $validated['rate21k'] ?? 0,
            'rate20k' => $validated['rate20k'] ?? 0,
            'rate18k' => $validated['rate18k'] ?? 0,
            'silver_rate' => $validated['silver_rate'] ?? 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['ok' => true]);
    }
}
