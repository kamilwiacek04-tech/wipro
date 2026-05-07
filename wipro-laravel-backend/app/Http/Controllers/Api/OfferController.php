<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Services\OfferService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class OfferController extends Controller
{
    public function downloadPdf(Request $request, int $id): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $offer = Offer::with(['quoteRequest.elevator', 'items'])
            ->whereHas('quoteRequest', function ($query) use ($request) {
                $query->where('user_id', $request->user()->id);
            })
            ->findOrFail($id);

        abort_if($offer->status === 'draft', 403, __('messages.offer.not_accessible'));

        $path = (new OfferService())->generatePdf($offer);

        $filename = 'oferta-' . str_replace('/', '_', $offer->offer_number) . '.pdf';

        return response()->download(Storage::path($path), $filename, [
            'Content-Type' => 'application/pdf',
        ]);
    }
}
