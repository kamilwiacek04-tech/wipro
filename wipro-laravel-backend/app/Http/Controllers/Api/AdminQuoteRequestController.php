<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\OfferSentMail;
use App\Models\Offer;
use App\Models\OfferItem;
use App\Models\QuoteRequest;
use App\Services\OfferService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdminQuoteRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = QuoteRequest::with(['user', 'elevator'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('investor_name', 'like', "%{$search}%")
                    ->orWhere('investor_email', 'like', "%{$search}%")
                    ->orWhere('request_number', 'like', "%{$search}%")
                    ->orWhere('investor_company', 'like', "%{$search}%");
            });
        }

        $requests = $query->paginate(20);

        return response()->json($requests);
    }

    public function show(int $id): JsonResponse
    {
        $quoteRequest = QuoteRequest::with(['user', 'elevator.elements', 'offers.items'])
            ->findOrFail($id);

        return response()->json($quoteRequest);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $quoteRequest = QuoteRequest::findOrFail($id);

        $data = $request->validate([
            'status' => 'sometimes|string|in:new,in_progress,offer_sent,accepted,rejected',
            'investor_name' => 'sometimes|string|max:255',
            'investor_email' => 'sometimes|email|max:255',
            'investor_phone' => 'sometimes|nullable|string|max:50',
            'investor_company' => 'sometimes|nullable|string|max:255',
            'investor_nip' => 'sometimes|nullable|string|max:20',
            'investor_address' => 'sometimes|nullable|string|max:255',
            'investor_city' => 'sometimes|nullable|string|max:100',
            'investment_name' => 'sometimes|nullable|string|max:255',
            'investment_address' => 'sometimes|nullable|string|max:255',
            'floors' => 'sometimes|nullable|integer',
            'stops' => 'sometimes|nullable|integer',
            'lift_capacity' => 'sometimes|nullable|integer',
            'shaft_width' => 'sometimes|nullable|integer',
            'shaft_depth' => 'sometimes|nullable|integer',
            'cabin_width' => 'sometimes|nullable|integer',
            'cabin_depth' => 'sometimes|nullable|integer',
            'cabin_height' => 'sometimes|nullable|integer',
            'pit_depth' => 'sometimes|nullable|integer',
            'overhead' => 'sometimes|nullable|integer',
            'drive_type' => 'sometimes|nullable|string|max:100',
            'door_type' => 'sometimes|nullable|string|max:100',
            'door_width' => 'sometimes|nullable|integer',
            'door_height' => 'sometimes|nullable|integer',
            'handrail' => 'sometimes|nullable|string|max:255',
            'ceiling' => 'sometimes|nullable|string|max:255',
            'lighting' => 'sometimes|nullable|string|max:255',
            'floor_material' => 'sometimes|nullable|string|max:255',
            'control_panel' => 'sometimes|nullable|string|max:255',
            'additional_notes' => 'sometimes|nullable|string',
            'elevator_id' => 'sometimes|nullable|integer|exists:elevators,id',
        ]);

        $quoteRequest->update($data);

        return response()->json($quoteRequest->fresh(['user', 'elevator.elements', 'offers.items']));
    }

    public function generateOffer(int $id): JsonResponse
    {
        $quoteRequest = QuoteRequest::with(['elevator.elements'])->findOrFail($id);

        abort_if(
            $quoteRequest->offers()->where('status', 'accepted')->exists(),
            422,
            __('messages.offer.no_new_accepted')
        );

        $vatRate = 23.00;
        $totalNet = 0.0;

        // Delete existing draft offers FIRST, then compute version from remaining offers
        $quoteRequest->offers()->where('status', 'draft')->delete();
        $version = $quoteRequest->offers()->count() + 1;
        $offerNumber = sprintf('%s/OF/%d', $quoteRequest->request_number, $version);

        $offer = Offer::create([
            'quote_request_id' => $quoteRequest->id,
            'offer_number' => $offerNumber,
            'version' => $version,
            'status' => 'draft',
            'total_price_net' => 0,
            'total_price_gross' => 0,
            'vat_rate' => $vatRate,
            'valid_until' => now()->addDays(30)->toDateString(),
        ]);

        $sortOrder = 1;

        if ($quoteRequest->elevator) {
            $elevator = $quoteRequest->elevator;
            $basePrice = (float) $elevator->base_price;

            OfferItem::create([
                'offer_id' => $offer->id,
                'description' => "Dźwig osobowy {$elevator->manufacturer} {$elevator->model} (udźwig {$elevator->capacity} kg, {$elevator->persons} os.)",
                'quantity' => 1,
                'unit' => 'szt.',
                'unit_price_net' => $basePrice,
                'total_price_net' => $basePrice,
                'sort_order' => $sortOrder++,
            ]);
            $totalNet += $basePrice;

            foreach ($elevator->elements as $element) {
                $elemPrice = (float) $element->price;
                OfferItem::create([
                    'offer_id' => $offer->id,
                    'description' => $element->name,
                    'quantity' => 1,
                    'unit' => 'szt.',
                    'unit_price_net' => $elemPrice,
                    'total_price_net' => $elemPrice,
                    'sort_order' => $sortOrder++,
                ]);
                $totalNet += $elemPrice;
            }
        } else {
            OfferItem::create([
                'offer_id' => $offer->id,
                'description' => 'Dźwig osobowy - wycena indywidualna',
                'quantity' => 1,
                'unit' => 'szt.',
                'unit_price_net' => 0,
                'total_price_net' => 0,
                'sort_order' => $sortOrder,
            ]);
        }

        $totalGross = round($totalNet * (1 + $vatRate / 100), 2);
        $offer->update([
            'total_price_net' => $totalNet,
            'total_price_gross' => $totalGross,
        ]);

        $quoteRequest->update(['status' => 'in_progress']);

        return response()->json($offer->load('items'));
    }

    public function updateOffer(Request $request, int $offerId): JsonResponse
    {
        $offer = Offer::with('items')->findOrFail($offerId);

        $data = $request->validate([
            'status' => 'sometimes|string|in:draft,sent,accepted,rejected',
            'notes' => 'sometimes|nullable|string',
            'valid_until' => 'sometimes|nullable|date',
            'vat_rate' => 'sometimes|numeric|min:0|max:100',
            'items' => 'sometimes|array',
            'items.*.id' => 'sometimes|nullable|integer|exists:offer_items,id',
            'items.*.description' => 'required_with:items|string|max:500',
            'items.*.quantity' => 'required_with:items|numeric|min:0',
            'items.*.unit' => 'sometimes|string|max:20',
            'items.*.unit_price_net' => 'required_with:items|numeric|min:0',
            'items.*.sort_order' => 'sometimes|integer',
        ]);

        if (isset($data['items'])) {
            // Delete existing items and recreate
            $offer->items()->delete();
            $totalNet = 0;
            foreach ($data['items'] as $idx => $itemData) {
                $totalItem = round((float)$itemData['unit_price_net'] * (float)$itemData['quantity'], 2);
                OfferItem::create([
                    'offer_id' => $offer->id,
                    'description' => $itemData['description'],
                    'quantity' => $itemData['quantity'],
                    'unit' => $itemData['unit'] ?? 'szt.',
                    'unit_price_net' => $itemData['unit_price_net'],
                    'total_price_net' => $totalItem,
                    'sort_order' => $itemData['sort_order'] ?? ($idx + 1),
                ]);
                $totalNet += $totalItem;
            }
            $vatRate = $data['vat_rate'] ?? (float) $offer->vat_rate;
            $totalGross = round($totalNet * (1 + $vatRate / 100), 2);
            $offer->update([
                'total_price_net' => $totalNet,
                'total_price_gross' => $totalGross,
            ]);
        }

        $offer->update(array_filter([
            'status' => $data['status'] ?? null,
            'notes' => $data['notes'] ?? null,
            'valid_until' => $data['valid_until'] ?? null,
            'vat_rate' => $data['vat_rate'] ?? null,
        ], fn($v) => $v !== null));

        if (isset($data['status']) && $data['status'] === 'sent') {
            abort_if(
                $offer->quoteRequest()->first()->offers()->where('status', 'accepted')->exists(),
                422,
                __('messages.offer.no_send_accepted')
            );
            $token = Str::random(64);
            $offer->update([
                'sent_at'        => now(),
                'response_token' => $token,
            ]);
            $offer->quoteRequest()->update(['status' => 'offer_sent']);

            $quoteRequest = $offer->quoteRequest()->with('user')->first();
            if ($quoteRequest?->user) {
                $backendUrl = config('app.url');
                $frontendUrl = config('app.client_url', 'http://localhost:3000');

                $acceptUrl = $backendUrl . '/api/offers/respond/' . $token . '?action=accept';
                $rejectUrl = $backendUrl . '/api/offers/respond/' . $token . '?action=reject';
                $portalUrl = $frontendUrl . '/konto/zapytanie/' . $quoteRequest->id;

                Mail::to($quoteRequest->user->email)
                    ->send(new OfferSentMail($quoteRequest->user, $offer->load('items'), $acceptUrl, $rejectUrl, $portalUrl, app()->getLocale()));
            }
        }

        return response()->json($offer->fresh('items'));
    }

    public function downloadPdf(int $offerId): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $offer = Offer::with(['quoteRequest.elevator', 'items'])->findOrFail($offerId);

        $path = (new OfferService())->generatePdf($offer);

        $filename = 'oferta-' . str_replace('/', '_', $offer->offer_number) . '.pdf';

        return response()->download(Storage::path($path), $filename, [
            'Content-Type' => 'application/pdf',
        ]);
    }

    public function downloadDocx(int $offerId): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $offer = Offer::with(['quoteRequest.elevator', 'items'])->findOrFail($offerId);

        $path = (new OfferService())->generateDocx($offer);

        $filename = 'oferta-' . str_replace('/', '_', $offer->offer_number) . '.docx';

        return response()->download(storage_path('app/' . $path), $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]);
    }

    public function cancelOffer(int $offerId): JsonResponse
    {
        $offer = Offer::with(['quoteRequest'])->findOrFail($offerId);

        abort_if($offer->status !== 'sent', 422, __('messages.offer.only_sent_cancel'));

        $offer->update([
            'status'       => 'cancelled',
            'cancelled_at' => now(),
        ]);

        $offer->quoteRequest()->update(['status' => 'in_progress']);

        return response()->json($offer->fresh('items'));
    }
}
