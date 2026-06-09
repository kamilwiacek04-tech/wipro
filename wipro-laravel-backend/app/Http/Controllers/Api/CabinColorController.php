<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CabinColor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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

    public function uploadImage(Request $request, int $id): JsonResponse
    {
        $color = CabinColor::findOrFail($id);
        $this->validateImageFile($request);

        $this->deleteOldImage($color->image_url);

        $path = $request->file('image')->store('cabin-color-images', 'public');
        $color->update(['image_url' => Storage::disk('public')->url($path)]);

        return response()->json($color);
    }

    public function destroy(int $id): JsonResponse
    {
        $color = CabinColor::findOrFail($id);
        $this->deleteOldImage($color->image_url);
        $color->delete();

        return response()->json(['message' => 'Deleted.']);
    }

    private function validateImageFile(Request $request): void
    {
        if (!$request->hasFile('image')) {
            abort(response()->json(['message' => 'validation.required', 'errors' => ['image' => ['validation.required']]], 422));
        }
        $file = $request->file('image');
        if (!$file->isValid()) {
            abort(response()->json(['message' => 'validation.image', 'errors' => ['image' => ['validation.image']]], 422));
        }
        if ($file->getSize() > 20 * 1024 * 1024) {
            abort(response()->json(['message' => 'validation.max.file', 'errors' => ['image' => ['validation.max.file']]], 422));
        }
        $mime = $file->getMimeType();
        if (!$mime || !str_starts_with($mime, 'image/')) {
            abort(response()->json(['message' => 'validation.image', 'errors' => ['image' => ['validation.image']]], 422));
        }
    }

    private function deleteOldImage(?string $imageUrl): void
    {
        if (!$imageUrl) return;
        if (preg_match('#/storage/(.+)$#', $imageUrl, $m)) {
            Storage::disk('public')->delete($m[1]);
        }
    }
}
