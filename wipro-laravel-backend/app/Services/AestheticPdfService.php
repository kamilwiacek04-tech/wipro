<?php

namespace App\Services;

use App\Models\CabinAccessory;
use App\Models\CabinModel;
use App\Models\QuoteRequest;
use Barryvdh\DomPDF\Facade\Pdf;

class AestheticPdfService
{
    /**
     * Generates the aesthetic description PDF.
     * Returns raw PDF string — not saved to disk.
     */
    public function generate(QuoteRequest $quoteRequest): string
    {
        $offerService = new OfferService();
        $parsedNotes  = $offerService->parseConfiguratorNotes($quoteRequest->additional_notes);

        // Collect all accessory IDs from parsed notes
        $accessoryIdFields = ['panelId', 'signalId', 'ceilingId', 'mirrorId', 'handrailId', 'flooringId'];
        $singleIds = [];
        foreach ($accessoryIdFields as $field) {
            if (!empty($parsedNotes[$field])) {
                $singleIds[] = (int) $parsedNotes[$field];
            }
        }
        $allIds = array_unique($singleIds);

        $accessories = CabinAccessory::whereIn('id', $allIds)->get()
            ->map(fn($a) => [
                'id'       => $a->id,
                'name_pl'  => $a->name_pl,
                'category' => $a->category,
                'image_url'=> $a->image_url,
            ])
            ->sortBy(fn($a) => array_search($a['id'], $allIds))
            ->values()
            ->all();

        // Cabin model
        $cabinModel       = null;
        $cabinImageBase64 = null;
        $cabinModelId     = (int) ($parsedNotes['cabinModelId'] ?? 0);
        if ($cabinModelId > 0) {
            $cabinModel = CabinModel::find($cabinModelId);
            if ($cabinModel?->image_url) {
                $cabinImageBase64 = $this->urlToBase64($cabinModel->image_url);
            }
        }

        // Fetch accessory images as base64
        $accessoryImages = [];
        foreach ($accessories as $acc) {
            $accessoryImages[$acc['id']] = $acc['image_url']
                ? $this->urlToBase64($acc['image_url'])
                : null;
        }

        return Pdf::loadView('offers.aesthetic-pdf', [
            'qr'               => $quoteRequest,
            'cabinModel'       => $cabinModel,
            'cabinImageBase64' => $cabinImageBase64,
            'accessories'      => $accessories,
            'accessoryImages'  => $accessoryImages,
        ])->setPaper('a4')->output();
    }

    private function urlToBase64(?string $url): ?string
    {
        if (!$url) return null;
        try {
            $content = @file_get_contents($url);
            if (!$content) return null;
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime  = finfo_buffer($finfo, $content);
            finfo_close($finfo);
            return 'data:' . $mime . ';base64,' . base64_encode($content);
        } catch (\Throwable) {
            return null;
        }
    }
}
