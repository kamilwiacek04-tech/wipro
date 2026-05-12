<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Setting::all()->pluck('value', 'key'));
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'max_stops'             => 'sometimes|integer|min:2|max:50',
            'door_ei30_price'       => 'sometimes|numeric|min:0',
            'door_ei60_price'       => 'sometimes|numeric|min:0',
            'profit_margin_percent' => 'sometimes|numeric|min:0|max:100',
            'company_name'          => 'sometimes|nullable|string|max:255',
            'company_address'       => 'sometimes|nullable|string|max:500',
            'company_nip'           => 'sometimes|nullable|string|max:20',
            'company_regon'         => 'sometimes|nullable|string|max:20',
            'company_krs'           => 'sometimes|nullable|string|max:20',
        ]);

        foreach ($data as $key => $value) {
            Setting::set($key, $value !== null ? (string) $value : '');
        }

        return response()->json(Setting::all()->pluck('value', 'key'));
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate([
            'logo' => 'required|file|image|max:4096',
        ]);

        $old = Setting::get('company_logo_path');
        if ($old && Storage::exists($old)) {
            Storage::delete($old);
        }

        $path = $request->file('logo')->store('company', 'public');
        Setting::set('company_logo_path', 'public/' . $path);

        return response()->json([
            'company_logo_path' => 'public/' . $path,
            'logo_url' => Storage::url($path),
        ]);
    }
}
