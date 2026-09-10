<?php

namespace Tests\Unit;

use App\Models\Elevator;
use App\Models\QuoteRequest;
use App\Services\OfferService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OfferServiceSpecLabelsTest extends TestCase
{
    use RefreshDatabase;

    public function test_purpose_label_comes_from_real_lift_purpose(): void
    {
        $elevator = Elevator::create([
            'model' => 'E-400', 'manufacturer' => 'WIPRO', 'capacity' => 400, 'persons' => 5,
            'cabin_width' => 100, 'cabin_depth' => 100, 'cabin_height' => 210,
            'speed' => 1.0, 'max_stops' => 8,
            'drive_type' => 'Elektryczny bezreduktorowy',
        ]);
        $qr = QuoteRequest::create([
            'request_number' => 'WPR-2026-901',
            'investor_name' => 'Jan Kowalski',
            'investor_email' => 'jan@example.com',
            'drive_type' => 'FIRE',
            'elevator_id' => $elevator->id,
        ]);

        $labels = (new OfferService())->resolveSpecLabels($qr->fresh(['elevator']));

        $this->assertSame('Pożarowy', $labels['purposeLabel']);
        $this->assertSame('Elektryczny bezreduktorowy', $labels['driveTypeLabel']);
    }

    public function test_all_four_purpose_values_map_correctly(): void
    {
        $service = new OfferService();
        $cases = [
            'PASSENGER'         => 'Osobowy',
            'FREIGHT_PASSENGER' => 'Pasażersko-towarowy',
            'HOSPITAL'          => 'Szpitalny',
            'FIRE'              => 'Pożarowy',
        ];

        foreach ($cases as $raw => $expected) {
            $qr = QuoteRequest::create([
                'request_number' => 'WPR-2026-' . $raw,
                'investor_name' => 'Jan Kowalski',
                'investor_email' => strtolower($raw) . '@example.com',
                'drive_type' => $raw,
            ]);

            $this->assertSame($expected, $service->resolveSpecLabels($qr->fresh(['elevator']))['purposeLabel']);
        }
    }

    public function test_missing_purpose_and_elevator_resolve_to_null(): void
    {
        $qr = QuoteRequest::create([
            'request_number' => 'WPR-2026-902',
            'investor_name' => 'Jan Kowalski',
            'investor_email' => 'jan2@example.com',
        ]);

        $labels = (new OfferService())->resolveSpecLabels($qr->fresh(['elevator']));

        $this->assertNull($labels['purposeLabel']);
        $this->assertNull($labels['driveTypeLabel']);
    }
}
