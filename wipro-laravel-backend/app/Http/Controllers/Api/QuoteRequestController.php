<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Elevator;
use App\Models\Offer;
use App\Models\QuoteRequest;
use App\Models\User;
use App\Services\OfferService;
use App\Services\QuoteMailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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

        // Auto-generate offer v1 and send with 5 attachments
        try {
            $version     = 1;
            $offerNumber = sprintf('%s/OF/%d', $quoteRequest->request_number, $version);

            $offer = Offer::create([
                'quote_request_id'    => $quoteRequest->id,
                'created_by_admin_id' => null,
                'offer_number'        => $offerNumber,
                'version'             => $version,
                'status'              => 'sent',
                'sent_at'             => now(),
                'total_price_net'     => 0,
                'total_price_gross'   => 0,
                'vat_rate'            => 23.00,
                'valid_until'         => now()->addDays(30)->toDateString(),
            ]);

            $offerService = new OfferService();
            $totalNet     = $offerService->buildPricedItems($quoteRequest, $offer);
            $totalGross   = round($totalNet * 1.23, 2);
            $offer->update(['total_price_net' => $totalNet, 'total_price_gross' => $totalGross]);

            $quoteRequest->update(['status' => 'offer_sent']);

            (new QuoteMailService())->send($quoteRequest, $offer->load('items'));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to generate/send auto-offer: ' . $e->getMessage());
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
