<?php

namespace App\Http\Controllers;

use App\Models\ProductCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $shop = $request->user();

        try {
            $hasParentId = Schema::hasColumn('product_categories', 'parent_id');

            $q = ProductCategory::where('shop_id', $shop->id)->withCount('products')->orderBy('name');

            if ($hasParentId) {
                $q->whereNull('parent_id')
                  ->with(['children' => fn ($q) => $q->orderBy('name')]);
            }

            $categories = $q->get();

            $all = ProductCategory::where('shop_id', $shop->id)
                ->withCount('products')
                ->orderBy('name')
                ->get();

            return response()->json(['categories' => $categories, 'all' => $all]);
        } catch (\Exception $e) {
            $categories = ProductCategory::where('shop_id', $shop->id)
                ->orderBy('name')
                ->get();
            return response()->json(['categories' => $categories, 'all' => $categories, 'warning' => 'Limited query']);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $shop = $request->user();
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|integer',
        ]);

        $slug = strtolower(str_replace(' ', '-', $validated['name']));
        $existing = ProductCategory::where('shop_id', $shop->id)->where('slug', $slug)->first();
        if ($existing) {
            return response()->json(['message' => 'Category already exists'], 422);
        }

        $data = [
            'shop_id' => $shop->id,
            'name' => $validated['name'],
            'slug' => $slug,
        ];
        if (Schema::hasColumn('product_categories', 'parent_id')) {
            $data['parent_id'] = $validated['parent_id'] ?? null;
        }

        $category = ProductCategory::create($data);

        return response()->json(['ok' => true, 'category' => $category]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $shop = $request->user();
        $category = ProductCategory::where('shop_id', $shop->id)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'parent_id' => 'nullable|integer',
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

    public function destroy(Request $request, int $id): JsonResponse
    {
        $shop = $request->user();
        $category = ProductCategory::where('shop_id', $shop->id)->findOrFail($id);

        if ($category->products()->count() > 0) {
            return response()->json(['message' => 'Cannot delete category with products'], 422);
        }
        if (Schema::hasColumn('product_categories', 'parent_id')) {
            if ($category->children()->count() > 0) {
                return response()->json(['message' => 'Cannot delete category with subcategories'], 422);
            }
        }

        $category->delete();
        return response()->json(['ok' => true]);
    }
}
