<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CabinColor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CabinColorController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            CabinColor::where('is_active', true)->orderBy('sort_order')->get()
        );
    }

    public function adminIndex(): JsonResponse
    {
        return response()->json(CabinColor::orderBy('sort_order')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name_pl'              => 'required|string|max:200',
            'name_en'              => 'required|string|max:200',
            'hex_color'            => 'nullable|string|max:7',
            'visible_for_cabin'    => 'boolean',
            'visible_for_door'     => 'boolean',
            'price_addition_cabin' => 'nullable|numeric|min:0',
            'price_addition_door'  => 'nullable|numeric|min:0',
            'sort_order'           => 'integer|min:0',
            'is_active'            => 'boolean',
        ]);

        return response()->json(CabinColor::create($data), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $color = CabinColor::findOrFail($id);

        $data = $request->validate([
            'name_pl'              => 'sometimes|string|max:200',
            'name_en'              => 'sometimes|string|max:200',
            'hex_color'            => 'sometimes|nullable|string|max:7',
            'visible_for_cabin'    => 'sometimes|boolean',
            'visible_for_door'     => 'sometimes|boolean',
            'price_addition_cabin' => 'sometimes|nullable|numeric|min:0',
            'price_addition_door'  => 'sometimes|nullable|numeric|min:0',
            'sort_order'           => 'sometimes|integer|min:0',
            'is_active'            => 'sometimes|boolean',
        ]);

        $color->update($data);

        return response()->json($color);
    }

    public function destroy(int $id): JsonResponse
    {
        CabinColor::findOrFail($id)->delete();

        return response()->json(['message' => 'Deleted.']);
    }
}
