<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CabinAccessory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CabinAccessoryController extends Controller
{
    public function index(): JsonResponse
    {
        $accessories = CabinAccessory::where('is_active', true)
            ->orderBy('category')
            ->orderBy('sort_order')
            ->get()
            ->groupBy('category');

        return response()->json($accessories);
    }

    public function adminIndex(): JsonResponse
    {
        return response()->json(
            CabinAccessory::orderBy('category')->orderBy('sort_order')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'category'   => 'required|string|in:PANEL,SIGNAL,CEILING,MIRROR,HANDRAIL,FLOORING,EXTRA',
            'name_pl'    => 'required|string|max:200',
            'name_en'    => 'required|string|max:200',
            'sort_order' => 'integer|min:0',
            'is_active'  => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            $this->validateImageFile($request);
            $path = $request->file('image')->store('accessory-images', 'public');
            $data['image_url'] = Storage::disk('public')->url($path);
        }

        unset($data['image']);

        return response()->json(CabinAccessory::create($data), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $accessory = CabinAccessory::findOrFail($id);

        $data = $request->validate([
            'category'   => 'sometimes|string|in:PANEL,SIGNAL,CEILING,MIRROR,HANDRAIL,FLOORING,EXTRA',
            'name_pl'    => 'sometimes|string|max:200',
            'name_en'    => 'sometimes|string|max:200',
            'sort_order' => 'sometimes|integer|min:0',
            'is_active'  => 'sometimes|boolean',
        ]);

        $accessory->update($data);

        return response()->json($accessory);
    }

    public function uploadImage(Request $request, int $id): JsonResponse
    {
        $accessory = CabinAccessory::findOrFail($id);

        $this->validateImageFile($request);

        $this->deleteOldImage($accessory->image_url);

        $path = $request->file('image')->store('accessory-images', 'public');
        $accessory->update(['image_url' => Storage::disk('public')->url($path)]);

        return response()->json($accessory);
    }

    public function destroy(int $id): JsonResponse
    {
        $accessory = CabinAccessory::findOrFail($id);
        $this->deleteOldImage($accessory->image_url);
        $accessory->delete();

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
