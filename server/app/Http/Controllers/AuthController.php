<?php

namespace App\Http\Controllers;

use App\Models\Shop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/auth/login
     * Body: { shop_code, password }
     * Returns a Sanctum bearer token for the shop.
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'shop_code' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $shop = Shop::where('shop_code', strtoupper($validated['shop_code']))->first();

        if (! $shop || ! Hash::check($validated['password'], $shop->password)) {
            throw ValidationException::withMessages([
                'shop_code' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $shop->createToken('desktop');

        return response()->json([
            'token' => $token->plainTextToken,
            'shop' => [
                'shop_code' => $shop->shop_code,
                'name' => $shop->name,
            ],
        ]);
    }
}