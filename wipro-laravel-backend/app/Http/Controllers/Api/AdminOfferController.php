<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Models\OfferItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminOfferController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Offer::with(['quoteRequest', 'createdBy', 'items'])
            ->orderByDesc('created_at');

        if ($user->isSuperAdmin()) {
            if ($request->filled('admin_id')) {
                $query->where('created_by_admin_id', $request->admin_id);
            }
        } else {
            $query->where('created_by_admin_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $offers = $query->paginate(20);

        return response()->json($offers);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'client_name'   => 'required|string|max:255',
            'client_email'  => 'nullable|email|max:255',
            'notes'         => 'nullable|string',
            'valid_until'   => 'nullable|date',
            'vat_rate'      => 'nullable|numeric|min:0|max:100',
            'items'         => 'required|array|min:1',
            'items.*.description'    => 'required|string|max:500',
            'items.*.quantity'       => 'required|numeric|min:0',
            'items.*.unit'           => 'sometimes|string|max:20',
            'items.*.unit_price_net' => 'required|numeric|min:0',
        ]);

        $vatRate = $data['vat_rate'] ?? 23.00;
        $offerNumber = Offer::generateStandaloneOfferNumber();

        $offer = Offer::create([
            'quote_request_id'   => null,
            'created_by_admin_id'=> $user->id,
            'offer_number'       => $offerNumber,
            'version'            => 1,
            'status'             => 'draft',
            'client_name'        => $data['client_name'],
            'client_email'       => $data['client_email'] ?? null,
            'notes'              => $data['notes'] ?? null,
            'valid_until'        => $data['valid_until'] ?? now()->addDays(30)->toDateString(),
            'vat_rate'           => $vatRate,
            'total_price_net'    => 0,
            'total_price_gross'  => 0,
        ]);

        $totalNet = 0;
        foreach ($data['items'] as $idx => $itemData) {
            $itemTotal = round((float) $itemData['unit_price_net'] * (float) $itemData['quantity'], 2);
            OfferItem::create([
                'offer_id'       => $offer->id,
                'description'    => $itemData['description'],
                'quantity'       => $itemData['quantity'],
                'unit'           => $itemData['unit'] ?? 'szt.',
                'unit_price_net' => $itemData['unit_price_net'],
                'total_price_net'=> $itemTotal,
                'sort_order'     => $idx + 1,
            ]);
            $totalNet += $itemTotal;
        }

        $totalGross = round($totalNet * (1 + $vatRate / 100), 2);
        $offer->update([
            'total_price_net'  => $totalNet,
            'total_price_gross'=> $totalGross,
        ]);

        return response()->json($offer->load(['items', 'createdBy']), 201);
    }
}
