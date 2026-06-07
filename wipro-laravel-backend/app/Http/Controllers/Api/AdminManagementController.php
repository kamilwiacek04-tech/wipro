<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminManagementController extends Controller
{
    public function index(): JsonResponse
    {
        $admins = User::whereIn('role', ['admin', 'superadmin'])
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'is_active', 'created_at']);

        return response()->json($admins);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
        ]);

        $admin = User::create([
            'name'      => $data['name'],
            'email'     => $data['email'],
            'password'  => Hash::make($data['password']),
            'role'      => 'admin',
            'is_active' => true,
        ]);

        return response()->json($admin, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $admin = User::whereIn('role', ['admin', 'superadmin'])->findOrFail($id);

        $data = $request->validate([
            'name'      => 'sometimes|string|max:255',
            'email'     => 'sometimes|email|unique:users,email,' . $id,
            'password'  => 'sometimes|string|min:8',
            'is_active' => 'sometimes|boolean',
        ]);

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $admin->update($data);

        return response()->json($admin);
    }

    public function destroy(int $id): JsonResponse
    {
        $admin = User::whereIn('role', ['admin', 'superadmin'])->findOrFail($id);

        // Prevent deleting yourself
        if ($admin->id === auth()->id()) {
            return response()->json(['message' => 'Nie możesz usunąć własnego konta.'], 422);
        }

        $admin->delete();

        return response()->json(['message' => 'Admin usunięty.']);
    }

    public function adminOffers(Request $request, int $id): JsonResponse
    {
        User::whereIn('role', ['admin', 'superadmin'])->findOrFail($id);
        $targetAdminId = $request->user()->id;

        $offers = Offer::where('created_by_admin_id', $id)
            ->with(['sharedAdmins' => fn($q) => $q->where('users.id', $targetAdminId)])
            ->orderByDesc('created_at')
            ->get(['id', 'offer_number', 'status', 'client_name', 'created_at']);

        $offers->each(function ($offer) {
            $offer->is_shared_with_me = $offer->sharedAdmins->isNotEmpty();
            unset($offer->sharedAdmins);
        });

        return response()->json($offers);
    }

    public function shareOffers(Request $request, int $id): JsonResponse
    {
        $admin = User::where('role', 'admin')->findOrFail($id);

        $data = $request->validate([
            'offer_ids'   => 'required|array',
            'offer_ids.*' => 'integer|exists:offers,id',
        ]);

        $admin->sharedOffers()->sync($data['offer_ids']);

        return response()->json(['message' => 'Zaktualizowano dostęp.']);
    }
}
