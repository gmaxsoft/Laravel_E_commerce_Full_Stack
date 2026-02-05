<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    /**
     * Wyświetla listę produktów (z filtrowaniem i sortowaniem).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Product::query()->where('is_active', true);

        // Filtrowanie po kategorii (filled = nie stosuj dla pustego parametru)
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        // Filtrowanie po rozmiarze
        if ($request->filled('size')) {
            $query->where('size', $request->size);
        }

        // Filtrowanie po marce
        if ($request->filled('brand')) {
            $query->where('brand', $request->brand);
        }

        // Wyszukiwanie po nazwie
        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->search.'%');
        }

        // Sortowanie (walidacja – tylko dozwolone kolumny i kierunki)
        $allowedSortColumns = ['created_at', 'price', 'name'];
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = strtolower($request->get('sort_order', 'desc'));
        if (! in_array($sortBy, $allowedSortColumns, true)) {
            $sortBy = 'created_at';
        }
        if (! in_array($sortOrder, ['asc', 'desc'], true)) {
            $sortOrder = 'desc';
        }
        $query->orderBy($sortBy, $sortOrder);

        $products = $query->paginate($request->get('per_page', 15));

        return ProductResource::collection($products);
    }

    /**
     * Zapisuje nowy produkt w bazie danych.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'sale_price' => 'nullable|numeric|min:0',
            'category' => 'nullable|string|max:255',
            'size' => 'nullable|string|max:50',
            'condition' => 'nullable|in:excellent,good,fair',
            'brand' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:100',
            'images' => 'nullable|array',
            'stock_quantity' => 'required|integer|min:0',
            'sku' => 'nullable|string|max:255|unique:products,sku',
        ]);

        $product = Product::create($validated);

        return response()->json([
            'message' => 'Product created successfully',
            'data' => new ProductResource($product),
        ], 201);
    }

    /**
     * Wyświetla szczegóły produktu.
     */
    public function show(string $id): ProductResource
    {
        $product = Product::where('is_active', true)->findOrFail($id);

        return new ProductResource($product);
    }

    /**
     * Aktualizuje produkt w bazie danych.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'sale_price' => 'nullable|numeric|min:0',
            'category' => 'nullable|string|max:255',
            'size' => 'nullable|string|max:50',
            'condition' => 'nullable|in:excellent,good,fair',
            'brand' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:100',
            'images' => 'nullable|array',
            'stock_quantity' => 'sometimes|integer|min:0',
            'sku' => 'nullable|string|max:255|unique:products,sku,'.$id,
            'is_active' => 'sometimes|boolean',
        ]);

        $product->update($validated);

        return response()->json([
            'message' => 'Product updated successfully',
            'data' => new ProductResource($product->fresh()),
        ]);
    }

    /**
     * Usuwa produkt z bazy danych.
     */
    public function destroy(string $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json([
            'message' => 'Product deleted successfully',
        ]);
    }
}
