<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class StaffController extends Controller
{
    public function index(Request $request)
    {
        $shop = $request->user();
        $users = DB::table('staff_users')
            ->where('shop_id', $shop->id)
            ->orderBy('id')
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'username' => $u->username,
                'full_name' => $u->full_name,
                'role' => $u->role,
                'active' => $u->active,
                'created_at' => $u->created_at,
            ]);

        return response()->json(['users' => $users]);
    }

    public function store(Request $request)
    {
        $shop = $request->user();
        $validated = $request->validate([
            'username' => 'required|string|max:100|unique:staff_users,username',
            'full_name' => 'required|string|max:255',
            'role' => 'nullable|string|max:50',
            'active' => 'nullable|boolean',
            'password' => 'nullable|string|min:4',
            'pin' => 'nullable|string|size:4',
        ]);

        $id = DB::table('staff_users')->insertGetId([
            'shop_id' => $shop->id,
            'username' => $validated['username'],
            'full_name' => $validated['full_name'],
            'role' => $validated['role'] ?? 'Salesman',
            'active' => $validated['active'] ?? true,
            'password' => isset($validated['password']) ? Hash::make($validated['password']) : null,
            'pin' => $validated['pin'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['ok' => true, 'id' => $id]);
    }

    public function update(Request $request, int $id)
    {
        $shop = $request->user();
        $user = DB::table('staff_users')->where('shop_id', $shop->id)->where('id', $id)->first();
        if (!$user) return response()->json(['message' => 'Not found'], 404);

        $validated = $request->validate([
            'username' => 'sometimes|string|max:100',
            'full_name' => 'sometimes|string|max:255',
            'role' => 'nullable|string|max:50',
            'active' => 'nullable|boolean',
            'password' => 'nullable|string|min:4',
            'pin' => 'nullable|string|size:4',
        ]);

        $updates = ['updated_at' => now()];
        foreach (['username', 'full_name', 'role', 'active'] as $field) {
            if (array_key_exists($field, $validated)) {
                $updates[$field] = $validated[$field];
            }
        }
        if (isset($validated['password']) && $validated['password'] !== '') {
            $updates['password'] = Hash::make($validated['password']);
        }
        if (array_key_exists('pin', $validated)) {
            $updates['pin'] = $validated['pin'];
        }

        DB::table('staff_users')->where('id', $id)->update($updates);
        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, int $id)
    {
        $shop = $request->user();
        $deleted = DB::table('staff_users')->where('shop_id', $shop->id)->where('id', $id)->delete();
        if (!$deleted) return response()->json(['message' => 'Not found'], 404);
        return response()->json(['ok' => true]);
    }
}
