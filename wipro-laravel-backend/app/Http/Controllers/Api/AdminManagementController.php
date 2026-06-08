<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QuoteRequest;
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

    public function adminQuoteRequests(Request $request, int $id): JsonResponse
    {
        User::whereIn('role', ['admin', 'superadmin'])->findOrFail($id);
        $targetAdminId = (int) $request->input('target_admin_id', $request->user()->id);

        $requests = QuoteRequest::where(function ($q) use ($id) {
                $q->whereHas('sharedAdmins', fn($sq) => $sq->where('users.id', $id));
            })
            ->with(['sharedAdmins' => fn($q) => $q->where('users.id', $targetAdminId)])
            ->orderByDesc('created_at')
            ->get(['id', 'request_number', 'status', 'investor_name', 'created_at']);

        $requests->each(function ($qr) {
            $qr->is_shared_with_me = $qr->sharedAdmins->isNotEmpty();
            unset($qr->sharedAdmins);
        });

        return response()->json($requests);
    }

    public function shareQuoteRequests(Request $request, int $id): JsonResponse
    {
        $admin = User::where('role', 'admin')->findOrFail($id);

        $data = $request->validate([
            'quote_request_ids'   => 'required|array',
            'quote_request_ids.*' => 'integer|exists:quote_requests,id',
        ]);

        $admin->sharedQuoteRequests()->sync($data['quote_request_ids']);

        return response()->json(['message' => 'Zaktualizowano dostęp.']);
    }
}
