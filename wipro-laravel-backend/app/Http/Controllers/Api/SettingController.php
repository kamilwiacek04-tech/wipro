<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = Setting::all()->pluck('value', 'key');

        return response()->json($settings);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'max_stops' => 'sometimes|integer|min:2|max:50',
        ]);

        foreach ($data as $key => $value) {
            Setting::set($key, (string) $value);
        }

        return response()->json(Setting::all()->pluck('value', 'key'));
    }
}
