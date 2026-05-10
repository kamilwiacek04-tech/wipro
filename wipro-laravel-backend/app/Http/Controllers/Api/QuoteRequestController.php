<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\QuoteSubmittedMail;
use App\Models\Elevator;
use App\Models\QuoteRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
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
            'investment_city' => 'nullable|string|max:100',
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

        // Maintain user record for admin address book
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

        try {
            Mail::to($user->email)->send(new QuoteSubmittedMail($user, $quoteRequest, app()->getLocale()));
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
}
