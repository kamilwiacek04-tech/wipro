<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Models\OfferItem;
use App\Models\QuoteRequest;
use App\Services\OfferService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class AdminQuoteRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = QuoteRequest::with(['user', 'elevator', 'assignedAdmin'])
            ->orderByDesc('created_at');

        // Superadmin can filter by admin_id; regular admin sees only their own
        if ($user->isSuperAdmin()) {
            if ($request->filled('admin_id')) {
                $query->where('assigned_admin_id', $request->admin_id);
            }
        } else {
            $query->where('assigned_admin_id', $user->id);
        }

        if ($request->filled('status')) {
            $statuses = array_values(array_filter(explode(',', $request->status)));
            $query->whereIn('status', $statuses);
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

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'investor_name'  => 'required|string|max:255',
            'investor_email' => 'nullable|email|max:255',
        ]);

        $quoteRequest = QuoteRequest::create([
            'request_number'    => QuoteRequest::generateRequestNumber(),
            'status'            => 'new',
            'investor_name'     => $data['investor_name'],
            'investor_email'    => $data['investor_email'] ?? '',
            'assigned_admin_id' => $request->user()->id,
        ]);

        return response()->json($quoteRequest->fresh(['user', 'elevator.elements', 'offers.items', 'assignedAdmin']), 201);
    }

    public function show(int $id): JsonResponse
    {
        $quoteRequest = QuoteRequest::with(['user', 'elevator.elements', 'offers.items', 'assignedAdmin'])
            ->findOrFail($id);

        return response()->json($quoteRequest);
    }

    public function assign(Request $request, int $id): JsonResponse
    {
        $quoteRequest = QuoteRequest::findOrFail($id);

        $data = $request->validate([
            'assigned_admin_id' => 'nullable|integer|exists:users,id',
        ]);

        $quoteRequest->update(['assigned_admin_id' => $data['assigned_admin_id']]);

        return response()->json($quoteRequest->fresh(['user', 'elevator.elements', 'offers.items', 'assignedAdmin']));
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

    public function generateOffer(Request $request, int $id): JsonResponse
    {
        $quoteRequest = QuoteRequest::with(['elevator.elements'])->findOrFail($id);

        abort_if(
            $quoteRequest->offers()->where('status', 'accepted')->exists(),
            422,
            __('messages.offer.no_new_accepted')
        );

        $quoteRequest->offers()->where('status', 'draft')->delete();
        $version     = $quoteRequest->offers()->count() + 1;
        $offerNumber = sprintf('%s/OF/%d', $quoteRequest->request_number, $version);

        $offer = Offer::create([
            'quote_request_id'    => $quoteRequest->id,
            'created_by_admin_id' => $request->user()->id,
            'offer_number'        => $offerNumber,
            'version'             => $version,
            'status'              => 'draft',
            'total_price_net'     => 0,
            'total_price_gross'   => 0,
            'vat_rate'            => 23.00,
            'valid_until'         => now()->addDays(30)->toDateString(),
        ]);

        $offerService = new \App\Services\OfferService();
        $totalNet     = $offerService->buildPricedItems($quoteRequest, $offer);
        $totalGross   = round($totalNet * 1.23, 2);

        $offer->update([
            'total_price_net'   => $totalNet,
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
            $offer->update(['sent_at' => now()]);
            $offer->quoteRequest()->update(['status' => 'offer_sent']);

            $quoteRequest = $offer->quoteRequest()->first();
            if ($quoteRequest) {
                (new \App\Services\QuoteMailService())->send($quoteRequest, $offer->load('items'));
            }
        }

        return response()->json($offer->fresh('items'));
    }

    public function downloadPdf(int $offerId): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $offer = Offer::with(['quoteRequest.elevator.elements', 'items'])->findOrFail($offerId);
        $quoteRequest = $offer->quoteRequest;

        // Reuse stored PDF if it exists; otherwise generate fresh with the same service used for email
        if ($offer->pdf_path && Storage::exists($offer->pdf_path)) {
            $path = $offer->pdf_path;
        } else {
            $path = (new \App\Services\OfferPdfService())->generate($quoteRequest, $offer);
        }

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
