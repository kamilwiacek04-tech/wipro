<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LiftType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LiftTypeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            LiftType::where('is_active', true)->orderBy('sort_order')->get()
        );
    }

    public function adminIndex(): JsonResponse
    {
        return response()->json(LiftType::orderBy('sort_order')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'key'       => 'required|string|max:50|unique:lift_types,key',
            'name_pl'   => 'required|string|max:100',
            'name_en'   => 'required|string|max:100',
            'sort_order'     => 'integer|min:0',
            'is_active'      => 'boolean',
            'base_price'     => 'nullable|numeric|min:0',
            'price_per_stop' => 'nullable|numeric|min:0',
        ]);

        $type = LiftType::create($data);

        return response()->json($type, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $type = LiftType::findOrFail($id);

        $data = $request->validate([
            'key'       => "sometimes|string|max:50|unique:lift_types,key,{$id}",
            'name_pl'   => 'sometimes|string|max:100',
            'name_en'   => 'sometimes|string|max:100',
            'sort_order'     => 'sometimes|integer|min:0',
            'is_active'      => 'sometimes|boolean',
            'base_price'     => 'sometimes|nullable|numeric|min:0',
            'price_per_stop' => 'sometimes|nullable|numeric|min:0',
        ]);

        $type->update($data);

        return response()->json($type);
    }

    public function destroy(int $id): JsonResponse
    {
        LiftType::findOrFail($id)->delete();

        return response()->json(['message' => 'Deleted.']);
    }
}
