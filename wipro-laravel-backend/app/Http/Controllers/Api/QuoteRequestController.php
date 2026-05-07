<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\NewAccountMail;
use App\Mail\QuoteSubmittedMail;
use App\Models\Elevator;
use App\Models\QuoteRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class QuoteRequestController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'investor_name' => 'required|string|max:255',
            'investor_email' => 'required|email|max:255',
            'investor_phone' => 'nullable|string|max:50',
            'investor_company' => 'nullable|string|max:255',
            'investor_nip' => 'nullable|string|max:20',
            'investor_address' => 'nullable|string|max:255',
            'investor_city' => 'nullable|string|max:100',
            'investment_name' => 'nullable|string|max:255',
            'investment_address' => 'nullable|string|max:255',
            'floors' => 'nullable|integer',
            'stops' => 'nullable|integer',
            'lift_capacity' => 'nullable|integer',
            'shaft_width' => 'nullable|integer',
            'shaft_depth' => 'nullable|integer',
            'cabin_width' => 'nullable|integer',
            'cabin_depth' => 'nullable|integer',
            'cabin_height' => 'nullable|integer',
            'pit_depth' => 'nullable|integer',
            'overhead' => 'nullable|integer',
            'drive_type' => 'nullable|string|max:100',
            'door_type' => 'nullable|string|max:100',
            'door_width' => 'nullable|integer',
            'door_height' => 'nullable|integer',
            'handrail' => 'nullable|string|max:255',
            'ceiling' => 'nullable|string|max:255',
            'lighting' => 'nullable|string|max:255',
            'floor_material' => 'nullable|string|max:255',
            'control_panel' => 'nullable|string|max:255',
            'additional_notes' => 'nullable|string',
            'elevator_id' => 'nullable|integer|exists:elevators,id',
        ]);

        // Find or create user by email
        $user = User::firstOrCreate(
            ['email' => $data['investor_email']],
            [
                'name' => $data['investor_name'],
                'password' => Hash::make(Str::random(16)),
                'phone' => $data['investor_phone'] ?? null,
                'company' => $data['investor_company'] ?? null,
                'nip' => $data['investor_nip'] ?? null,
                'address' => $data['investor_address'] ?? null,
                'city' => $data['investor_city'] ?? null,
                'role' => 'client',
            ]
        );

        $isNewUser = $user->wasRecentlyCreated;
        $frontendUrl = rtrim(config('app.client_url', 'http://localhost:3000'), '/');

        if ($isNewUser) {
            // New user — generate password-setup token
            $token = Password::createToken($user);
            $setupUrl = $frontendUrl . '/konto/ustaw-haslo?token=' . urlencode($token) . '&email=' . urlencode($user->email);
        }

        // Use provided elevator_id or try to match based on capacity
        $elevatorId = $data['elevator_id'] ?? null;
        if (!$elevatorId && !empty($data['lift_capacity'])) {
            $elevator = Elevator::where('is_active', true)
                ->where('capacity', '>=', $data['lift_capacity'])
                ->when(!empty($data['drive_type']), function ($query) use ($data) {
                    return $query->where('drive_type', 'like', '%' . $data['drive_type'] . '%');
                })
                ->orderBy('capacity')
                ->first();
            $elevatorId = $elevator?->id;
        }

        $quoteRequest = QuoteRequest::create(array_merge($data, [
            'user_id' => $user->id,
            'request_number' => QuoteRequest::generateRequestNumber(),
            'raw_data' => $request->all(),
            'elevator_id' => $elevatorId,
        ]));

        // Send appropriate email
        try {
            if ($isNewUser) {
                Mail::to($user->email)->send(new NewAccountMail($user, $setupUrl, app()->getLocale()));
            } else {
                $myQuotesUrl = $frontendUrl . '/konto/moje-zapytania';
                Mail::to($user->email)->send(new QuoteSubmittedMail($user, $quoteRequest, $myQuotesUrl, app()->getLocale()));
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to send email: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Zapytanie zostało przyjęte. Skontaktujemy się z Tobą wkrótce.',
            'request_number' => $quoteRequest->request_number,
            'data' => [
                'id' => $quoteRequest->id,
                'request_number' => $quoteRequest->request_number,
                'status' => $quoteRequest->status,
                'created_at' => $quoteRequest->created_at,
            ],
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $quoteRequest = QuoteRequest::where('user_id', $request->user()->id)
            ->where('status', 'new')
            ->findOrFail($id);

        $data = $request->validate([
            'investor_name' => 'sometimes|string|max:255',
            'investor_email' => 'sometimes|email|max:255',
            'investor_phone' => 'sometimes|nullable|string|max:50',
            'investor_company' => 'sometimes|nullable|string|max:255',
            'investor_address' => 'sometimes|nullable|string|max:255',
            'investor_city' => 'sometimes|nullable|string|max:100',
            'investment_name' => 'sometimes|nullable|string|max:255',
            'stops' => 'sometimes|nullable|integer',
            'pit_depth' => 'sometimes|nullable|integer',
            'overhead' => 'sometimes|nullable|integer',
            'drive_type' => 'sometimes|nullable|string|max:100',
            'door_type' => 'sometimes|nullable|string|max:100',
            'additional_notes' => 'sometimes|nullable|string',
        ]);

        $quoteRequest->update($data);

        return response()->json($quoteRequest->fresh(['elevator', 'offers']));
    }

    public function index(Request $request): JsonResponse
    {
        $requests = QuoteRequest::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($requests);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $quoteRequest = QuoteRequest::where('user_id', $request->user()->id)
            ->with(['elevator', 'offers'])
            ->findOrFail($id);

        return response()->json($quoteRequest);
    }
}
