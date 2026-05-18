<?php

namespace App\Services;

use App\Mail\QuoteMailWithAttachments;
use App\Models\Offer;
use App\Models\QuoteRequest;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

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

        $extraAttachments = $this->collectElevatorFiles($quoteRequest);

        try {
            Mail::to($quoteRequest->investor_email)
                ->send(new QuoteMailWithAttachments(
                    quoteRequest:        $quoteRequest,
                    offer:               $offer,
                    offerPdfPath:        $offerPdfPath,
                    aestheticPdfContent: $aestheticPdfContent,
                    techSpecPdfContent:  $techSpecPdfContent,
                    extraAttachments:    $extraAttachments,
                    locale:              app()->getLocale(),
                ));
        } catch (\Throwable $e) {
            Log::warning('QuoteMailService: failed to send mail for offer ' . $offer->offer_number . ': ' . $e->getMessage());
        }
    }

    private function collectElevatorFiles(QuoteRequest $quoteRequest): array
    {
        $elevator = $quoteRequest->elevator;
        if (!$elevator) return [];

        $attachments = [];

        $drawingMap = [
            'drawing_standard_pdf'   => ['name' => 'rysunek-standardowy.pdf',         'mime' => 'application/pdf'],
            'drawing_throughway_pdf' => ['name' => 'rysunek-przelotowy.pdf',           'mime' => 'application/pdf'],
            'drawing_standard_dwg'   => ['name' => 'rysunek-standardowy.dwg',         'mime' => 'application/octet-stream'],
            'drawing_throughway_dwg' => ['name' => 'rysunek-przelotowy.dwg',           'mime' => 'application/octet-stream'],
            'drawing_standard_doc'   => ['name' => 'opis-podstawowy.docx',            'mime' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            'drawing_throughway_doc' => ['name' => 'opis-podstawowy-przelotowy.docx', 'mime' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        ];

        foreach ($drawingMap as $field => $meta) {
            $path = $elevator->$field ?? null;
            if ($path && Storage::exists($path)) {
                $attachments[] = array_merge(['path' => $path], $meta);
            }
        }

        return $attachments;
    }
}
