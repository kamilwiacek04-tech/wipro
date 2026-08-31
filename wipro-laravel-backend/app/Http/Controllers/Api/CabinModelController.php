<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CabinModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CabinModelController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            CabinModel::where('is_active', true)->orderBy('sort_order')->get()
        );
    }

    public function adminIndex(): JsonResponse
    {
        return response()->json(CabinModel::orderBy('sort_order')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name_pl'        => 'required|string|max:200',
            'name_en'        => 'required|string|max:200',
            'sort_order'     => 'integer|min:0',
            'is_active'      => 'boolean',
            'price_addition' => 'nullable|numeric|min:0',
            'is_default'     => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            $this->validateImageFile($request);
            $path = $request->file('image')->store('cabin-images', 'public');
            $data['image_url'] = Storage::disk('public')->url($path);
        }

        $data['details'] = $this->parseDetails($request->input('details'));

        unset($data['image']);

        $model = new CabinModel($data);
        $this->guardDefaultRequiresActive($model);

        $model = DB::transaction(function () use ($model) {
            $model->save();
            if ($model->is_default) {
                CabinModel::where('id', '!=', $model->id)->update(['is_default' => false]);
            }
            return $model;
        });

        return response()->json($model, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $model = CabinModel::findOrFail($id);

        $data = $request->validate([
            'name_pl'        => 'sometimes|string|max:200',
            'name_en'        => 'sometimes|string|max:200',
            'sort_order'     => 'sometimes|integer|min:0',
            'is_active'      => 'sometimes|boolean',
            'price_addition' => 'sometimes|nullable|numeric|min:0',
            'is_default'     => 'sometimes|boolean',
        ]);

        if ($request->has('details')) {
            $data['details'] = $this->parseDetails($request->input('details'));
        }

        $model->fill($data);
        $this->guardDefaultRequiresActive($model);

        DB::transaction(function () use ($model) {
            $model->save();
            if ($model->is_default) {
                CabinModel::where('id', '!=', $model->id)->update(['is_default' => false]);
            }
        });

        return response()->json($model);
    }

    private function guardDefaultRequiresActive(CabinModel $model): void
    {
        if ($model->is_default && !$model->is_active) {
            abort(response()->json([
                'message' => 'validation.default_must_be_active',
                'errors'  => ['is_default' => ['validation.default_must_be_active']],
            ], 422));
        }
    }

    public function uploadImage(Request $request, int $id): JsonResponse
    {
        $model = CabinModel::findOrFail($id);
        $this->validateImageFile($request);

        $this->deleteOldImage($model->image_url);

        $path = $request->file('image')->store('cabin-images', 'public');
        $model->update(['image_url' => Storage::disk('public')->url($path)]);

        return response()->json($model);
    }

    public function destroy(int $id): JsonResponse
    {
        $model = CabinModel::findOrFail($id);
        $this->deleteOldImage($model->image_url);
        $model->delete();

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

    private function parseDetails(mixed $details): ?array
    {
        if ($details === null || $details === '') return null;
        if (is_array($details)) return $details;
        if (is_string($details)) {
            $decoded = json_decode($details, true);
            return is_array($decoded) ? $decoded : null;
        }
        return null;
    }

    private function deleteOldImage(?string $imageUrl): void
    {
        if (!$imageUrl) return;
        if (preg_match('#/storage/(.+)$#', $imageUrl, $m)) {
            Storage::disk('public')->delete($m[1]);
        }
    }
}
