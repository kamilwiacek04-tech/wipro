<?php

namespace App\Services;

use App\Mail\QuoteMailWithAttachments;
use App\Models\Offer;
use App\Models\QuoteRequest;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

class QuoteMailService
{
    public function send(QuoteRequest $quoteRequest, Offer $offer): void
    {
        if (!config('mail.enabled', true)) {
            return;
        }

        $quoteRequest->loadMissing(['elevator']);
        $offer->loadMissing(['items']);

        $pdfService       = new OfferPdfService();
        $aestheticService = new AestheticPdfService();

        $offerPdfPath        = $pdfService->generate($quoteRequest, $offer);
        $aestheticPdfContent = $aestheticService->generate($quoteRequest);
        $techSpecPdfContent  = $pdfService->generateTechSpec($quoteRequest);

        $extraLinks = $this->collectElevatorFileLinks($quoteRequest);

        try {
            Mail::to($quoteRequest->investor_email)
                ->send(new QuoteMailWithAttachments(
                    quoteRequest:        $quoteRequest,
                    offer:               $offer,
                    offerPdfPath:        $offerPdfPath,
                    aestheticPdfContent: $aestheticPdfContent,
                    techSpecPdfContent:  $techSpecPdfContent,
                    extraLinks:          $extraLinks,
                    locale:              app()->getLocale(),
                ));
        } catch (\Throwable $e) {
            Log::warning('QuoteMailService: failed to send mail for offer ' . $offer->offer_number . ': ' . $e->getMessage());
        }
    }

    /**
     * Rysunki i opisy windy są duże (DWG/DOCX) i potrafiły przekraczać limit
     * rozmiaru skrzynki, gdy szły jako załączniki — zamiast tego wysyłamy linki
     * do publicznego (bez logowania) endpointu pobierania.
     */
    private function collectElevatorFileLinks(QuoteRequest $quoteRequest): array
    {
        $elevator = $quoteRequest->elevator;
        if (!$elevator) return [];

        $isThroughway = $quoteRequest->door_type === 'THROUGHT';
        $variant      = $isThroughway ? 'throughway' : 'standard';
        $variantLabel = $isThroughway ? 'przelotowy' : 'standardowy';

        $extMap = [
            'pdf' => "Rysunek techniczny {$variantLabel} (PDF)",
            'dwg' => "Rysunek techniczny {$variantLabel} (DWG)",
            'doc' => "Opis podstawowy {$variantLabel} (DOCX)",
        ];

        $links = [];
        foreach ($extMap as $ext => $label) {
            $path = $elevator->{"drawing_{$variant}_{$ext}"} ?? null;
            if ($path && Storage::exists($path)) {
                $links[] = [
                    'label' => $label,
                    'url'   => URL::to("/api/elevators/{$elevator->id}/drawings/{$variant}/{$ext}"),
                ];
            }
        }

        return $links;
    }
}
