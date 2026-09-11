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
        try {
            $validated = $request->validate([
                'shop_code' => ['required', 'string', 'max:50'],
                'password' => ['required', 'string', 'max:255'],
            ]);

            $shopCode = strtoupper(trim($validated['shop_code']));
            $shop = Shop::where('shop_code', $shopCode)->first();

            Log::info('Login attempt', [
                'shop_code' => $shopCode,
                'shop_found' => $shop !== null,
                'has_password' => $shop ? (bool) $shop->password : false,
                'password_length' => $shop ? strlen($shop->password) : 0,
            ]);

            if (! $shop || ! Hash::check($validated['password'], $shop->password)) {
                Log::warning('Failed login attempt', [
                    'shop_code' => $shopCode,
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);

                $hash = $shop ? $shop->password : null;
                return response()->json([
                    'error' => 'Credentials incorrect',
                    'shop_found' => $shop !== null,
                    'stored_hash' => $hash ? substr($hash, 0, 7) . '...' : null,
                    'check_result' => $shop ? Hash::check($validated['password'], $shop->password) : false,
                    'input_password' => $validated['password'],
                ], 401);
            }

            // Delete old tokens (max 3 active sessions)
            $oldTokens = $shop->tokens()->orderByDesc('created_at')->skip(2)->get();
            foreach ($oldTokens as $token) {
                $token->delete();
            }

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
        } catch (\Exception $e) {
            Log::error('Login exception', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return response()->json([
                'error' => $e->getMessage(),
                'file' => basename($e->getFile()),
                'line' => $e->getLine(),
                'type' => get_class($e),
            ], 500);
        }
    }
}
