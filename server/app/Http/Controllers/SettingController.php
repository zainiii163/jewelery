<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SettingController extends Controller
{
    public function index(Request $request)
    {
        $shop = $request->user();
        $settings = $shop->settings ?? [];

        $defaults = [
            'shop_name' => $shop->name ?? '',
            'address' => '',
            'phone' => '',
            'whatsapp' => '',
            'currency_symbol' => 'Rs.',
            'tax_rate' => '0',
            'language' => 'en',
            'server_url' => '',
            'shop_code' => $shop->shop_code ?? 'MAIN',
            'api_token' => '',
        ];

        return response()->json(['settings' => array_merge($defaults, $settings)]);
    }

    public function store(Request $request)
    {
        $shop = $request->user();
        $validated = $request->validate([
            'shop_name' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:30',
            'whatsapp' => 'nullable|string|max:30',
            'currency_symbol' => 'nullable|string|max:10',
            'tax_rate' => 'nullable|string|max:10',
            'language' => 'nullable|string|max:5',
            'server_url' => 'nullable|string|max:500',
            'shop_code' => 'nullable|string|max:20',
            'api_token' => 'nullable|string|max:500',
        ]);

        $existing = $shop->settings ?? [];
        $merged = array_merge($existing, array_filter($validated, fn ($v) => $v !== null));

        $shop->settings = $merged;
        $shop->save();

        return response()->json(['ok' => true]);
    }
}
