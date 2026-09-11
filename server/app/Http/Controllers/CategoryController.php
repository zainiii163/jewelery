<?php

namespace App\Http\Controllers;

use App\Models\ProductCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $shop = $request->user();
        $categories = ProductCategory::where('shop_id', $shop->id)
            ->whereNull('parent_id')
            ->with(['children' => function ($q) {
                $q->orderBy('name');
            }])
            ->withCount('products')
            ->orderBy('name')
            ->get();

        $all = ProductCategory::where('shop_id', $shop->id)
            ->withCount('products')
            ->orderBy('name')
            ->get();

        return response()->json(['categories' => $categories, 'all' => $all]);
    }

    public function store(Request $request)
    {
        $shop = $request->user();
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|integer|exists:product_categories,id',
        ]);

        $slug = strtolower(str_replace(' ', '-', $validated['name']));
        $existing = ProductCategory::where('shop_id', $shop->id)->where('slug', $slug)->first();
        if ($existing) {
            return response()->json(['message' => 'Category already exists'], 422);
        }

        $category = ProductCategory::create([
            'shop_id' => $shop->id,
            'parent_id' => $validated['parent_id'] ?? null,
            'name' => $validated['name'],
            'slug' => $slug,
        ]);

        return response()->json(['ok' => true, 'category' => $category]);
    }

    public function update(Request $request, int $id)
    {
        $shop = $request->user();
        $category = ProductCategory::where('shop_id', $shop->id)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'parent_id' => 'nullable|integer|exists:product_categories,id',
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = strtolower(str_replace(' ', '-', $validated['name']));
        }
        if (isset($validated['parent_id']) && $validated['parent_id'] == $id) {
            return response()->json(['message' => 'Cannot be parent of itself'], 422);
        }

        $category->update($validated);
        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, int $id)
    {
        $shop = $request->user();
        $category = ProductCategory::where('shop_id', $shop->id)->findOrFail($id);

        if ($category->products()->count() > 0) {
            return response()->json(['message' => 'Cannot delete category with products']), 422;
        }
        if ($category->children()->count() > 0) {
            return response()->json(['message' => 'Cannot delete category with subcategories']), 422;
        }

        $category->delete();
        return response()->json(['ok' => true]);
    }
}
