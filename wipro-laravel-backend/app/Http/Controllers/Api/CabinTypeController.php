<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CabinType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CabinTypeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            CabinType::where('is_active', true)->orderBy('sort_order')->get()
        );
    }

    public function adminIndex(): JsonResponse
    {
        return response()->json(CabinType::orderBy('sort_order')->get());
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $type = CabinType::findOrFail($id);

        $data = $request->validate([
            'name_pl'    => 'sometimes|string|max:200',
            'name_en'    => 'sometimes|string|max:200',
            'price'      => 'sometimes|numeric|min:0',
            'sort_order' => 'sometimes|integer|min:0',
            'is_active'  => 'sometimes|boolean',
        ]);

        $type->update($data);

        return response()->json($type);
    }

    public function uploadImage(Request $request, int $id, string $side): JsonResponse
    {
        if (!in_array($side, ['right', 'left'])) {
            return response()->json(['message' => 'Invalid side.'], 422);
        }

        $request->validate(['image' => 'required|image|max:5120']);

        $type = CabinType::findOrFail($id);
        $field = $side === 'right' ? 'image_right_url' : 'image_left_url';

        if ($type->$field && preg_match('#/storage/(.+)$#', $type->$field, $m)) {
            Storage::disk('public')->delete($m[1]);
        }

        $path = $request->file('image')->store("cabin-types/{$type->key}", 'public');
        $type->update([$field => Storage::disk('public')->url($path)]);

        return response()->json($type);
    }
}
