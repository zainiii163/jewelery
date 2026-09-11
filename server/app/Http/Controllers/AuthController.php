<?php

namespace App\Http\Controllers;

use App\Models\Shop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
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
            'shop_code' => ['required', 'string', 'max:50'],
            'password' => ['required', 'string', 'max:255'],
        ]);

        $shopCode = strtoupper(trim($validated['shop_code']));
        $shop = Shop::where('shop_code', $shopCode)->first();

        if (! $shop || ! Hash::check($validated['password'], $shop->password)) {
            Log::warning('Failed login attempt', [
                'shop_code' => $shopCode,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            throw ValidationException::withMessages([
                'shop_code' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Delete old tokens (max 3 active sessions)
        $keepTokens = $shop->tokens()->orderByDesc('created_at')->take(3)->pluck('id')->toArray();
        $shop->tokens()->whereNotIn('id', $keepTokens)->delete();

        $token = $shop->createToken('desktop', ['*']);

        Log::info('Successful login', [
            'shop_code' => $shopCode,
            'ip' => $request->ip(),
        ]);

        return response()->json([
            'token' => $token->plainTextToken,
            'shop' => [
                'shop_code' => $shop->shop_code,
                'name' => $shop->name,
            ],
        ]);
    }
}
