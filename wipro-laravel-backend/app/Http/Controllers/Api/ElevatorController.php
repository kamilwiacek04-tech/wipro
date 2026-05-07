<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Elevator;
use App\Models\ElevatorElement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ElevatorController extends Controller
{
    public function index(): JsonResponse
    {
        $elevators = Elevator::withCount('elements')->orderBy('manufacturer')->orderBy('model')->get();
        return response()->json($elevators);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'model' => 'required|string|max:255',
            'manufacturer' => 'required|string|max:255',
            'capacity' => 'required|integer|min:1',
            'persons' => 'required|integer|min:1',
            'cabin_width' => 'required|integer|min:1',
            'cabin_depth' => 'required|integer|min:1',
            'cabin_height' => 'required|integer|min:1',
            'shaft_width' => 'required|integer|min:1',
            'shaft_depth' => 'required|integer|min:1',
            'pit_depth' => 'required|integer|min:1',
            'overhead' => 'required|integer|min:1',
            'speed' => 'required|numeric|min:0.1',
            'drive_type' => 'required|string|max:100',
            'max_stops' => 'required|integer|min:2',
            'base_price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $elevator = Elevator::create($data);

        return response()->json($elevator, 201);
    }

    public function show(int $id): JsonResponse
    {
        $elevator = Elevator::with('elements')->findOrFail($id);
        return response()->json($elevator);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $elevator = Elevator::findOrFail($id);

        $data = $request->validate([
            'model' => 'sometimes|string|max:255',
            'manufacturer' => 'sometimes|string|max:255',
            'capacity' => 'sometimes|integer|min:1',
            'persons' => 'sometimes|integer|min:1',
            'cabin_width' => 'sometimes|integer|min:1',
            'cabin_depth' => 'sometimes|integer|min:1',
            'cabin_height' => 'sometimes|integer|min:1',
            'shaft_width' => 'sometimes|integer|min:1',
            'shaft_depth' => 'sometimes|integer|min:1',
            'pit_depth' => 'sometimes|integer|min:1',
            'overhead' => 'sometimes|integer|min:1',
            'speed' => 'sometimes|numeric|min:0.1',
            'drive_type' => 'sometimes|string|max:100',
            'max_stops' => 'sometimes|integer|min:2',
            'base_price' => 'sometimes|numeric|min:0',
            'description' => 'sometimes|nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);

        $elevator->update($data);

        return response()->json($elevator->fresh());
    }

    public function destroy(int $id): JsonResponse
    {
        $elevator = Elevator::findOrFail($id);
        $elevator->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // Elements
    public function elements(int $id): JsonResponse
    {
        $elevator = Elevator::findOrFail($id);
        return response()->json($elevator->elements()->orderBy('category')->orderBy('name')->get());
    }

    public function storeElement(Request $request, int $id): JsonResponse
    {
        $elevator = Elevator::findOrFail($id);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
        ]);

        $element = $elevator->elements()->create($data);

        return response()->json($element, 201);
    }

    public function updateElement(Request $request, int $elementId): JsonResponse
    {
        $element = ElevatorElement::findOrFail($elementId);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'category' => 'sometimes|string|max:100',
            'price' => 'sometimes|numeric|min:0',
        ]);

        $element->update($data);

        return response()->json($element->fresh());
    }

    public function destroyElement(int $elementId): JsonResponse
    {
        $element = ElevatorElement::findOrFail($elementId);
        $element->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
