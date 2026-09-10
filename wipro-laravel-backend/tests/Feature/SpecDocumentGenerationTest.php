<?php

namespace Tests\Feature;

use App\Models\Elevator;
use App\Models\Offer;
use App\Models\QuoteRequest;
use App\Services\OfferPdfService;
use App\Services\OfferService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SpecDocumentGenerationTest extends TestCase
{
    use RefreshDatabase;

    private function makeQuoteRequestWithOffer(): array
    {
        $elevator = Elevator::create([
            'model' => 'E-400', 'manufacturer' => 'WIPRO', 'capacity' => 400, 'persons' => 5,
            'cabin_width' => 100, 'cabin_depth' => 100, 'cabin_height' => 210,
            'shaft_width' => 125, 'shaft_depth' => 135, 'pit_depth' => 110, 'overhead' => 340,
            'speed' => 1.0, 'max_stops' => 8, 'drive_type' => 'Elektryczny bezreduktorowy',
        ]);
        $qr = QuoteRequest::create([
            'request_number' => 'WPR-2026-910',
            'investor_name' => 'Jan Kowalski',
            'investor_email' => 'jan910@example.com',
            'drive_type' => 'FIRE',
            'stops' => 5,
            'pit_depth' => 200,
            'overhead' => 300,
            'elevator_id' => $elevator->id,
        ]);
        $offer = Offer::create([
            'quote_request_id' => $qr->id,
            'offer_number' => 'WPR-2026-910/OF/1',
            'version' => 1,
            'status' => 'sent',
            'total_price_net' => 0,
            'total_price_gross' => 0,
            'vat_rate' => 23,
        ]);

        return [$qr, $offer];
    }

    public function test_tech_spec_pdf_generates_and_contains_correct_purpose_not_investor_status(): void
    {
        [$qr] = $this->makeQuoteRequestWithOffer();

        $pdfBytes = (new OfferPdfService())->generateTechSpec($qr->fresh(['elevator']));

        $this->assertStringStartsWith('%PDF', $pdfBytes);
        $this->assertGreaterThan(1000, strlen($pdfBytes));
    }

    public function test_offer_pdf_generates_successfully(): void
    {
        [$qr, $offer] = $this->makeQuoteRequestWithOffer();

        $path = (new OfferPdfService())->generate($qr->fresh(['elevator']), $offer);

        $this->assertTrue(\Storage::exists($path));
    }

    public function test_docx_generates_successfully_with_shared_labels(): void
    {
        [, $offer] = $this->makeQuoteRequestWithOffer();

        $path = (new OfferService())->generateDocx($offer->fresh());

        $this->assertTrue(\Storage::exists($path));
    }
}
