<?php

namespace App\Services;

use App\Models\CabinAccessory;
use App\Models\CabinColor;
use App\Models\CabinModel;
use App\Models\Offer;
use App\Models\QuoteRequest;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class OfferPdfService
{
    /**
     * Generates the full 2-page offer PDF, saves it to storage, updates offer.pdf_path.
     * Returns the storage path.
     */
    public function generate(QuoteRequest $quoteRequest, Offer $offer): string
    {
        $quoteRequest->loadMissing(['elevator']);
        $offer->loadMissing(['items']);

        $offerService = new OfferService();
        $parsedNotes  = $offerService->parseConfiguratorNotes($quoteRequest->additional_notes);

        $settings = Setting::all()->pluck('value', 'key')->toArray();

        $logoBase64  = $this->storageImageToBase64($settings['company_logo_path'] ?? null);
        $pasekBase64 = $this->publicImageToBase64('images/PL-Pasek_FE-RGB-poziom.png');

        $cabinModel       = null;
        $cabinImageBase64 = null;
        $cabinModelId     = (int) ($parsedNotes['cabinModelId'] ?? 0);
        if ($cabinModelId > 0) {
            $cabinModel = CabinModel::find($cabinModelId);
            if ($cabinModel?->image_url) {
                $cabinImageBase64 = $this->urlImageToBase64($cabinModel->image_url);
            }
        }
        $cabinModelName = $cabinModel?->name_pl;

        $accIds      = array_values(array_filter([(int)($parsedNotes['signalId'] ?? 0), (int)($parsedNotes['mirrorId'] ?? 0)]));
        $accLookup   = !empty($accIds) ? CabinAccessory::whereIn('id', $accIds)->pluck('name_pl', 'id') : collect();
        $signalName  = ($id = (int)($parsedNotes['signalId'] ?? 0)) ? ($accLookup[$id] ?? null) : null;
        $mirrorName  = ($id = (int)($parsedNotes['mirrorId'] ?? 0)) ? ($accLookup[$id] ?? null) : null;

        $colorIds       = array_values(array_filter(array_unique([(int)($parsedNotes['cabinColorId'] ?? 0), (int)($parsedNotes['doorColorId'] ?? 0), (int)($parsedNotes['cabinDoorColorId'] ?? 0)])));
        $colorLookup    = !empty($colorIds) ? CabinColor::whereIn('id', $colorIds)->pluck('name_pl', 'id') : collect();
        $cabinColorName = ($id = (int)($parsedNotes['cabinColorId'] ?? 0)) ? ($colorLookup[$id] ?? null) : null;
        $doorColorName  = ($id = (int)($parsedNotes['doorColorId']  ?? 0)) ? ($colorLookup[$id] ?? null) : null;
        $sameAsDoor     = $parsedNotes['cabinDoorSameAsLanding'] ?? true;
        $cabinDoorColorName = (!$sameAsDoor && ($id = (int)($parsedNotes['cabinDoorColorId'] ?? 0)))
            ? ($colorLookup[$id] ?? null)
            : ($doorColorName ? $doorColorName . ' (jak przystankowe)' : null);

        $extraIdsList = array_values(array_filter((array)($parsedNotes['extraIds'] ?? [])));
        $extraNames   = !empty($extraIdsList) ? CabinAccessory::whereIn('id', $extraIdsList)->pluck('name_pl')->toArray() : [];

        $pdf = Pdf::loadView('offers.offer-pdf', compact(
            'offer', 'settings', 'logoBase64', 'pasekBase64', 'cabinImageBase64', 'parsedNotes',
            'cabinModelName', 'signalName', 'mirrorName',
            'cabinColorName', 'doorColorName', 'cabinDoorColorName', 'extraNames'
        ) + ['qr' => $quoteRequest])->setPaper('a4');

        $filename = str_replace('/', '_', $offer->offer_number) . '.pdf';
        $path     = 'offers/' . $filename;

        if (!is_dir(storage_path('app/offers'))) {
            mkdir(storage_path('app/offers'), 0755, true);
        }

        Storage::put($path, $pdf->output());
        $offer->update(['pdf_path' => $path]);

        return $path;
    }

    /**
     * Generates a standalone 1-page tech-spec PDF (for separate attachment).
     * Returns raw PDF string — not saved to disk.
     */
    public function generateTechSpec(QuoteRequest $quoteRequest): string
    {
        $quoteRequest->loadMissing(['elevator']);

        $offerService = new OfferService();
        $parsedNotes  = $offerService->parseConfiguratorNotes($quoteRequest->additional_notes);

        return Pdf::loadView('offers.tech-spec-pdf', [
            'qr'          => $quoteRequest,
            'parsedNotes' => $parsedNotes,
        ])->setPaper('a4')->output();
    }

    private function storageImageToBase64(?string $storagePath): ?string
    {
        if (!$storagePath || !Storage::exists($storagePath)) return null;
        $content = Storage::get($storagePath);
        $ext     = strtolower(pathinfo($storagePath, PATHINFO_EXTENSION));
        $mime    = match($ext) { 'jpg', 'jpeg' => 'image/jpeg', 'gif' => 'image/gif', default => 'image/png' };
        return 'data:' . $mime . ';base64,' . base64_encode($content);
    }

    private function publicImageToBase64(string $relativePath): ?string
    {
        $abs = public_path($relativePath);
        if (!file_exists($abs)) return null;
        $ext  = strtolower(pathinfo($abs, PATHINFO_EXTENSION));
        $mime = match($ext) { 'jpg', 'jpeg' => 'image/jpeg', 'gif' => 'image/gif', default => 'image/png' };
        return 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($abs));
    }

    private function urlImageToBase64(?string $url): ?string
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
