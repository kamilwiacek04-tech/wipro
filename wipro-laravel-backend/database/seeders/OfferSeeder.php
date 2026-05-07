<?php

namespace Database\Seeders;

use App\Models\Offer;
use App\Models\OfferItem;
use App\Models\QuoteRequest;
use Illuminate\Database\Seeder;

class OfferSeeder extends Seeder
{
    public function run(): void
    {
        $requestsWithOffers = QuoteRequest::whereIn('status', ['offer_sent', 'accepted'])
            ->with('elevator')
            ->get();

        $offerCounter = 1;

        foreach ($requestsWithOffers as $request) {
            $offerNumber = $request->request_number . '/OF/' . $offerCounter;
            $basePrice = $request->elevator?->base_price ?? 85000.00;

            $elements = [
                ['description' => 'Dźwig osobowy ' . ($request->elevator?->manufacturer ?? 'WIPRO') . ' ' . ($request->elevator?->model ?? 'MRL-630'), 'qty' => 1, 'unit' => 'kpl', 'price' => $basePrice],
                ['description' => 'Poręcze kabinowe ' . ($request->handrail ?? 'chromowane'), 'qty' => 1, 'unit' => 'kpl', 'price' => 950.00],
                ['description' => 'Podsufitka ' . ($request->ceiling ?? 'satynowa'), 'qty' => 1, 'unit' => 'szt', 'price' => 750.00],
                ['description' => 'Oświetlenie ' . ($request->lighting ?? 'LED panelowe'), 'qty' => 1, 'unit' => 'kpl', 'price' => 550.00],
                ['description' => 'Podłoga ' . ($request->floor_material ?? 'PVC'), 'qty' => 1, 'unit' => 'szt', 'price' => 800.00],
                ['description' => 'Drzwi przystankowe ' . ($request->door_type ?? 'stalowe satynowe'), 'qty' => $request->stops ?? 4, 'unit' => 'szt', 'price' => 1500.00],
                ['description' => 'Panel sterowania ' . ($request->control_panel ?? 'standardowy'), 'qty' => 1, 'unit' => 'szt', 'price' => 600.00],
                ['description' => 'Montaż i uruchomienie', 'qty' => 1, 'unit' => 'kpl', 'price' => 12000.00],
            ];

            $totalNet = array_sum(array_map(fn ($e) => $e['qty'] * $e['price'], $elements));
            $totalGross = $totalNet * 1.23;

            $offer = Offer::create([
                'quote_request_id' => $request->id,
                'offer_number' => $offerNumber,
                'version' => 1,
                'status' => $request->status === 'accepted' ? 'accepted' : 'sent',
                'valid_until' => now()->addDays(30),
                'total_price_net' => $totalNet,
                'total_price_gross' => $totalGross,
                'vat_rate' => 23.00,
                'notes' => 'Oferta zawiera montaż, uruchomienie oraz szkolenie obsługi. Gwarancja 24 miesiące.',
                'sent_at' => $request->status === 'accepted' ? now()->subDays(rand(5, 30)) : now()->subDays(rand(1, 10)),
            ]);

            $sortOrder = 1;
            foreach ($elements as $element) {
                OfferItem::create([
                    'offer_id' => $offer->id,
                    'description' => $element['description'],
                    'quantity' => $element['qty'],
                    'unit' => $element['unit'],
                    'unit_price_net' => $element['price'],
                    'total_price_net' => $element['qty'] * $element['price'],
                    'sort_order' => $sortOrder++,
                ]);
            }
        }
    }
}
