<?php

namespace App\Services;

use App\Models\Offer;
use App\Models\OfferItem;
use App\Models\QuoteRequest;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;

class OfferService
{
    public function generateOffer(QuoteRequest $quoteRequest): Offer
    {
        $offer = Offer::create([
            'quote_request_id' => $quoteRequest->id,
            'offer_number' => Offer::generateOfferNumber($quoteRequest),
            'version' => $quoteRequest->offers()->count() + 1,
            'status' => 'draft',
            'valid_until' => now()->addDays(30),
            'vat_rate' => 23.00,
            'total_price_net' => 0,
            'total_price_gross' => 0,
        ]);

        $items = [];
        $totalNet = 0;

        // Add base elevator price if matched
        if ($quoteRequest->elevator) {
            $elevator = $quoteRequest->elevator;
            $items[] = [
                'offer_id' => $offer->id,
                'description' => sprintf(
                    'Dźwig osobowy %s %s, nośność %d kg (%d osób), napęd: %s',
                    $elevator->manufacturer,
                    $elevator->model,
                    $elevator->capacity,
                    $elevator->persons,
                    $elevator->drive_type
                ),
                'quantity' => 1,
                'unit' => 'kpl',
                'unit_price_net' => $elevator->base_price,
                'total_price_net' => $elevator->base_price,
                'sort_order' => 1,
            ];
            $totalNet += $elevator->base_price;
        }

        // Add elements based on selections
        $sortOrder = 2;
        $elementFields = [
            'handrail' => 'porecze',
            'ceiling' => 'podsufitki',
            'lighting' => 'oswietlenie',
            'floor_material' => 'podlogi',
            'control_panel' => 'panel_sterowania',
        ];

        foreach ($elementFields as $field => $category) {
            if (!empty($quoteRequest->$field)) {
                // Try to find matching element
                $element = \App\Models\ElevatorElement::where('category', $category)
                    ->where('name', 'like', '%' . $quoteRequest->$field . '%')
                    ->where('is_active', true)
                    ->first();

                if ($element) {
                    $items[] = [
                        'offer_id' => $offer->id,
                        'description' => $element->name,
                        'quantity' => 1,
                        'unit' => $element->unit,
                        'unit_price_net' => $element->price,
                        'total_price_net' => $element->price,
                        'sort_order' => $sortOrder++,
                    ];
                    $totalNet += $element->price;
                }
            }
        }

        // Add door item
        if (!empty($quoteRequest->door_type)) {
            $doorElement = \App\Models\ElevatorElement::where('category', 'drzwi')
                ->where('name', 'like', '%' . $quoteRequest->door_type . '%')
                ->where('is_active', true)
                ->first();

            if ($doorElement) {
                $stops = $quoteRequest->stops ?? 2;
                $items[] = [
                    'offer_id' => $offer->id,
                    'description' => $doorElement->name . ' (x' . $stops . ' przystanki)',
                    'quantity' => $stops,
                    'unit' => 'szt',
                    'unit_price_net' => $doorElement->price,
                    'total_price_net' => $doorElement->price * $stops,
                    'sort_order' => $sortOrder++,
                ];
                $totalNet += $doorElement->price * $stops;
            }
        }

        // Insert items
        OfferItem::insert($items);

        // Calculate totals
        $totalGross = $totalNet * 1.23;

        $offer->update([
            'total_price_net' => $totalNet,
            'total_price_gross' => $totalGross,
        ]);

        return $offer->fresh();
    }

    public function generatePdf(Offer $offer): string
    {
        $offer->load(['quoteRequest.elevator', 'items']);

        $pdf = Pdf::loadView('offers.pdf', ['offer' => $offer])
            ->setPaper('a4');

        $filename = 'offers/' . $offer->offer_number . '.pdf';
        $filename = str_replace('/', '_', $filename);
        $path = 'offers/' . $filename;

        Storage::put($path, $pdf->output());

        $offer->update(['pdf_path' => $path]);

        return $path;
    }

    public function generateDocx(Offer $offer): string
    {
        $offer->load(['quoteRequest.elevator', 'items']);
        $qr = $offer->quoteRequest;

        $phpWord = new PhpWord();
        $phpWord->setDefaultFontName('Calibri');
        $phpWord->setDefaultFontSize(11);

        $sectionStyle = [
            'marginTop'    => 800,
            'marginBottom' => 800,
            'marginLeft'   => 1000,
            'marginRight'  => 1000,
        ];
        $section = $phpWord->addSection($sectionStyle);

        // ── Styles ──────────────────────────────────────────
        $h1Font    = ['bold' => true, 'size' => 22, 'color' => '1a1a2e'];
        $h2Font    = ['bold' => true, 'size' => 12, 'color' => '1a1a2e', 'allCaps' => true];
        $labelFont = ['size' => 10, 'color' => '888888'];
        $valueFont = ['bold' => true, 'size' => 11, 'color' => '1a1a2e'];
        $bodyFont  = ['size' => 11, 'color' => '333333'];
        $smallFont = ['size' => 9, 'color' => '999999'];
        $goldFont  = ['bold' => true, 'size' => 11, 'color' => 'ffb400'];
        $centerPara = ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER];
        $rightPara  = ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::END];

        // ── Header bar (simulated with table) ───────────────
        $headerTable = $section->addTable(['borderSize' => 0, 'borderColor' => 'ffffff', 'cellMargin' => 60]);
        $headerTable->addRow(800);
        $leftCell = $headerTable->addCell(5000, ['bgColor' => '1a1a2e']);
        $leftCell->addText('WIPRO', ['bold' => true, 'size' => 28, 'color' => 'ffb400'], $centerPara);
        $leftCell->addText('Wind & Dźwigi', ['size' => 9, 'color' => 'cccccc'], $centerPara);
        $rightCell = $headerTable->addCell(5000, ['bgColor' => 'ffb400']);
        $rightCell->addText('OFERTA HANDLOWA', ['bold' => true, 'size' => 13, 'color' => '1a1a2e', 'allCaps' => true], $centerPara);
        $rightCell->addText('Nr: ' . $offer->offer_number, ['bold' => true, 'size' => 10, 'color' => '1a1a2e'], $centerPara);

        $section->addTextBreak(1);

        // ── Document title ───────────────────────────────────
        $section->addText('Oferta na dostawę i montaż dźwigu osobowego', $h1Font, $centerPara);
        $section->addText(
            'Przygotowano na podstawie zapytania nr ' . $qr->request_number . ' · Data: ' . $offer->created_at->format('d.m.Y'),
            $smallFont,
            $centerPara
        );
        $section->addTextBreak(1);

        // ── Addressee + Investment (two columns) ─────────────
        $infoTable = $section->addTable([
            'borderSize' => 4,
            'borderColor' => 'efefef',
            'cellMargin'  => 120,
        ]);

        // Section headers row
        $infoTable->addRow();
        $infoTable->addCell(4800, ['bgColor' => 'f5f5f5'])->addText('ADRESAT OFERTY', $h2Font);
        $infoTable->addCell(4800, ['bgColor' => 'f5f5f5'])->addText('DANE INWESTYCJI', $h2Font);

        // Data rows
        $leftLines = [
            'Imię i nazwisko' => $qr->investor_name,
            'Firma / Inwestor' => $qr->investor_company,
            'NIP'             => $qr->investor_nip,
            'Email'           => $qr->investor_email,
            'Telefon'         => $qr->investor_phone,
            'Adres'           => implode(', ', array_filter([$qr->investor_address, $qr->investor_city])) ?: null,
        ];
        $purposeLabels = [
            'PASSENGER'         => 'Osobowy',
            'FREIGHT_PASSENGER' => 'Pasażersko-towarowy',
            'HOSPITAL'          => 'Szpitalny',
            'FIRE'              => 'Pożarowy',
        ];

        $rightLines = [
            'Nazwa inwestycji'   => $qr->investment_name,
            'Adres inwestycji'   => $qr->investment_address,
            'Liczba kondygnacji' => $qr->floors,
            'Liczba przystanków' => $qr->stops,
            'Typ dźwigu'         => $purposeLabels[$qr->drive_type] ?? $qr->drive_type,
        ];

        $maxRows = max(count(array_filter($leftLines)), count(array_filter($rightLines)));
        $leftFiltered  = array_filter($leftLines);
        $rightFiltered = array_filter($rightLines);
        $leftPairs  = array_map(null, array_keys($leftFiltered), array_values($leftFiltered));
        $rightPairs = array_map(null, array_keys($rightFiltered), array_values($rightFiltered));

        for ($i = 0; $i < $maxRows; $i++) {
            $infoTable->addRow();
            $lCell = $infoTable->addCell(4800);
            if (isset($leftPairs[$i])) {
                $lCell->addText(($leftPairs[$i][0] ?? '') . ':', $labelFont);
                $lCell->addText($leftPairs[$i][1] ?? '', $valueFont);
            }
            $rCell = $infoTable->addCell(4800);
            if (isset($rightPairs[$i])) {
                $rCell->addText(($rightPairs[$i][0] ?? '') . ':', $labelFont);
                $rCell->addText($rightPairs[$i][1] ?? '', $valueFont);
            }
        }

        $section->addTextBreak(1);

        // ── Technical specification ──────────────────────────
        $accessDiagramLabels = [
            'FRONT'      => 'Frontowe',
            'THROUGHT'   => 'Przelotowe',
            'CORNER'     => 'Kątowe',
            'TRIPARTITE' => 'Trójstronne',
        ];

        $specs = array_filter([
            'Udźwig'          => $qr->lift_capacity ? $qr->lift_capacity . ' kg' : null,
            'Przystanki'      => $qr->stops,
            'Szer. szybu'     => $qr->shaft_width  ? $qr->shaft_width  . ' mm' : null,
            'Głęb. szybu'     => $qr->shaft_depth  ? $qr->shaft_depth  . ' mm' : null,
            'Szer. kabiny'    => $qr->cabin_width  ? $qr->cabin_width  . ' mm' : null,
            'Głęb. kabiny'    => $qr->cabin_depth  ? $qr->cabin_depth  . ' mm' : null,
            'Wys. kabiny'     => $qr->cabin_height ? $qr->cabin_height . ' mm' : null,
            'Podszybie'       => $qr->pit_depth    ? $qr->pit_depth    . ' mm' : null,
            'Nadszybie'       => $qr->overhead     ? $qr->overhead     . ' mm' : null,
            'Schemat dojścia' => $accessDiagramLabels[$qr->door_type] ?? $qr->door_type,
            'Szer. drzwi'     => $qr->door_width   ? $qr->door_width   . ' mm' : null,
        ]);

        if (!empty($specs)) {
            $section->addText('SPECYFIKACJA TECHNICZNA', $h2Font);
            $specTable = $section->addTable([
                'borderSize' => 4,
                'borderColor' => 'dddddd',
                'cellMargin'  => 100,
            ]);
            $specPairs = array_chunk(array_keys($specs), 3, true);
            foreach (array_chunk($specs, 3, true) as $rowIdx => $row) {
                $specTable->addRow();
                foreach ($row as $label => $value) {
                    $cell = $specTable->addCell(3200, ['bgColor' => 'fafafa']);
                    $cell->addText($label, $labelFont);
                    $cell->addText((string)$value, $valueFont);
                }
                for ($p = count($row); $p < 3; $p++) {
                    $specTable->addCell(3200);
                }
            }
            $section->addTextBreak(1);
        }

        // ── Finishes ─────────────────────────────────────────
        $config           = $this->parseConfiguratorNotes($qr->additional_notes);
        $cabinColorId     = (int) ($config['cabinColorId'] ?? 0);
        $doorColorId      = (int) ($config['doorColorId'] ?? 0);
        $sameAsDoor       = $config['cabinDoorSameAsLanding'] ?? true;
        $cabinDoorColorId = (int) ($config['cabinDoorColorId'] ?? 0);

        $colorNames = [];
        $colorIdsToLookup = array_filter(array_unique([$cabinColorId, $doorColorId, $cabinDoorColorId]));
        if (!empty($colorIdsToLookup)) {
            \App\Models\CabinColor::whereIn('id', $colorIdsToLookup)->get()
                ->each(fn($c) => $colorNames[$c->id] = $c->name_pl);
        }

        $cabinColorName = $cabinColorId && isset($colorNames[$cabinColorId]) ? $colorNames[$cabinColorId] : null;
        $doorColorName  = $doorColorId  && isset($colorNames[$doorColorId])  ? $colorNames[$doorColorId]  : null;
        $cabinDoorName  = (!$sameAsDoor && $cabinDoorColorId && isset($colorNames[$cabinDoorColorId]))
            ? $colorNames[$cabinDoorColorId]
            : ($doorColorName ? $doorColorName . ' (jak przystankowe)' : null);

        $cabinModelName = null;
        $signalName     = null;
        $mirrorName     = null;
        $cabinModelIdF  = (int) ($config['cabinModelId'] ?? 0);
        $signalIdF      = (int) ($config['signalId']     ?? 0);
        $mirrorIdF      = (int) ($config['mirrorId']     ?? 0);

        if ($cabinModelIdF) {
            $cabinModelName = \App\Models\CabinModel::find($cabinModelIdF)?->name_pl;
        }
        $accessoryIds = array_filter([$signalIdF, $mirrorIdF]);
        if (!empty($accessoryIds)) {
            $accessories = \App\Models\CabinAccessory::whereIn('id', $accessoryIds)->pluck('name_pl', 'id');
            $signalName  = $signalIdF ? ($accessories[$signalIdF] ?? null) : null;
            $mirrorName  = $mirrorIdF ? ($accessories[$mirrorIdF] ?? null) : null;
        }

        $finishes = array_filter([
            'Model kabiny'        => $cabinModelName,
            'Poręcze'             => $qr->handrail,
            'Podsufitka'          => $qr->ceiling,
            'Oświetlenie'         => $qr->lighting,
            'Podłoga'             => $qr->floor_material,
            'Panel sterow.'       => $qr->control_panel,
            'Sygnalizacja'        => $signalName,
            'Lustro'              => $mirrorName,
            'Kolor kabiny'        => $cabinColorName,
            'Kolor drzwi przyst.' => $doorColorName,
            'Kolor drzwi kabin.'  => $cabinDoorName,
        ]);

        if (!empty($finishes)) {
            $section->addText('WYKOŃCZENIE I AKCESORIA', $h2Font);
            $finTable = $section->addTable(['borderSize' => 4, 'borderColor' => 'dddddd', 'cellMargin' => 100]);
            foreach (array_chunk($finishes, 3, true) as $row) {
                $finTable->addRow();
                foreach ($row as $label => $value) {
                    $cell = $finTable->addCell(3200, ['bgColor' => 'fafafa']);
                    $cell->addText($label, $labelFont);
                    $cell->addText((string)$value, $valueFont);
                }
                for ($p = count($row); $p < 3; $p++) {
                    $finTable->addCell(3200);
                }
            }
            $section->addTextBreak(1);
        }

        // ── Installation config ───────────────────────────────
        $installConfig = array_filter([
            'Wys. podnoszenia' => isset($config['liftingHeight']) && $config['liftingHeight'] ? $config['liftingHeight'] . ' m' : null,
            'Liczba wejść'     => isset($config['accessCount'])   && $config['accessCount']   ? (string)(int)$config['accessCount'] : null,
            'Drzwi EI30'       => isset($config['ei30DoorsCount']) && $config['ei30DoorsCount'] > 0 ? $config['ei30DoorsCount'] . ' szt.' : null,
            'Drzwi EI60'       => isset($config['ei60DoorsCount']) && $config['ei60DoorsCount'] > 0 ? $config['ei60DoorsCount'] . ' szt.' : null,
            'Mech. po lewej'   => isset($config['leftSideMechanic']) ? ($config['leftSideMechanic'] ? 'Tak' : 'Nie') : null,
        ]);

        if (!empty($installConfig)) {
            $section->addText('KONFIGURACJA INSTALACJI', $h2Font);
            $icTable = $section->addTable(['borderSize' => 4, 'borderColor' => 'dddddd', 'cellMargin' => 100]);
            foreach (array_chunk($installConfig, 3, true) as $row) {
                $icTable->addRow();
                foreach ($row as $label => $value) {
                    $cell = $icTable->addCell(3200, ['bgColor' => 'fafafa']);
                    $cell->addText($label, $labelFont);
                    $cell->addText((string)$value, $valueFont);
                }
                for ($p = count($row); $p < 3; $p++) {
                    $icTable->addCell(3200);
                }
            }
            $section->addTextBreak(1);
        }

        // ── Extras ───────────────────────────────────────────
        $extraIds = array_values(array_filter((array)($config['extraIds'] ?? [])));
        if (!empty($extraIds)) {
            $extraNames = \App\Models\CabinAccessory::whereIn('id', $extraIds)->pluck('name_pl')->toArray();
            if (!empty($extraNames)) {
                $section->addText('DODATKI', $h2Font);
                foreach ($extraNames as $name) {
                    $section->addListItem($name, 0, $bodyFont);
                }
                $section->addTextBreak(1);
            }
        }

        // ── Scope of supply ──────────────────────────────────
        if ($offer->items->count() > 0) {
            $section->addText('ZAKRES OFERTY', $h2Font);
            foreach ($offer->items as $item) {
                $section->addListItem($item->description, 0, $bodyFont, ['listType' => \PhpOffice\PhpWord\Style\ListItem::TYPE_NUMBER]);
            }
            $section->addTextBreak(1);
        }

        // ── Indicative price ─────────────────────────────────
        if ($offer->total_price_net > 0) {
            $section->addText('ORIENTACYJNA WYCENA', $h2Font);
            $priceTable = $section->addTable(['borderSize' => 6, 'borderColor' => '1a1a2e', 'cellMargin' => 120]);
            $priceTable->addRow(500);
            $priceTable->addCell(7200, ['bgColor' => '1a1a2e'])->addText(
                'Orientacyjna wartość netto',
                ['bold' => true, 'size' => 12, 'color' => 'ffffff']
            );
            $priceTable->addCell(2400, ['bgColor' => '1a1a2e'])->addText(
                number_format($offer->total_price_net, 2, ',', ' ') . ' PLN',
                ['bold' => true, 'size' => 13, 'color' => 'ffb400'],
                $rightPara
            );
            $section->addTextBreak(1);
            $section->addText(
                'Podana kwota ma charakter orientacyjny i nie stanowi wiążącej oferty handlowej. Ostateczna cena zostanie ustalona po szczegółowej analizie projektu.',
                ['size' => 9, 'color' => '888888', 'italic' => true]
            );
            $section->addTextBreak(1);
        }

        // ── Commercial terms ──────────────────────────────────
        $section->addText('WARUNKI HANDLOWE', $h2Font);
        $termsTable = $section->addTable(['borderSize' => 4, 'borderColor' => 'dddddd', 'cellMargin' => 120]);
        $termsTable->addRow();
        $t1 = $termsTable->addCell(3200, ['bgColor' => 'fffbeb']);
        $t1->addText('Termin płatności', $labelFont);
        $t1->addText('30 dni od wystawienia faktury', $valueFont);
        $t2 = $termsTable->addCell(3200, ['bgColor' => 'fffbeb']);
        $t2->addText('Gwarancja', $labelFont);
        $t2->addText('24 miesiące', $valueFont);
        $t3 = $termsTable->addCell(3200, ['bgColor' => 'fffbeb']);
        $t3->addText('Termin realizacji', $labelFont);
        $t3->addText('Do uzgodnienia indywidualnie', $valueFont);

        if ($offer->valid_until) {
            $section->addTextBreak(1);
            $section->addText(
                'Oferta ważna do: ' . $offer->valid_until->format('d.m.Y') . '. Po tym terminie prosimy o kontakt w celu potwierdzenia aktualności cen.',
                ['size' => 10, 'color' => '7c5700', 'italic' => true]
            );
        }

        // ── Notes ─────────────────────────────────────────────
        if ($offer->notes) {
            $section->addTextBreak(1);
            $section->addText('UWAGI', $h2Font);
            $section->addText($offer->notes, $bodyFont);
        }

        // ── Signature area ────────────────────────────────────
        $section->addTextBreak(2);
        $sigTable = $section->addTable(['borderSize' => 0, 'borderColor' => 'ffffff', 'cellMargin' => 80]);
        $sigTable->addRow(200);
        $sigLeft = $sigTable->addCell(4800);
        $sigLeft->addText('Ofertę przygotował:', $smallFont);
        $sigLeft->addText('WIPRO Wind sp. z o.o.', $valueFont);
        $sigLeft->addText('kontakt@wipro-wind.pl', $smallFont);
        $sigLeft->addText('', $bodyFont);
        $sigLeft->addText('_________________________', $smallFont);
        $sigLeft->addText('Podpis i pieczęć', $smallFont);

        $sigRight = $sigTable->addCell(4800);
        $sigRight->addText('Akceptacja klienta:', $smallFont);
        $sigRight->addText($qr->investor_name, $valueFont);
        if ($qr->investor_company) {
            $sigRight->addText($qr->investor_company, $smallFont);
        }
        $sigRight->addText('', $bodyFont);
        $sigRight->addText('_________________________', $smallFont);
        $sigRight->addText('Podpis i data', $smallFont);

        // ── Footer ────────────────────────────────────────────
        $footer = $section->addFooter();
        $footer->addText(
            'WIPRO Wind sp. z o.o.  ·  Nr oferty: ' . $offer->offer_number . '  ·  Wygenerowano: ' . now()->format('d.m.Y'),
            ['size' => 8, 'color' => 'aaaaaa'],
            $centerPara
        );

        // ── Save ─────────────────────────────────────────────
        $filename = str_replace('/', '_', $offer->offer_number) . '.docx';
        $tempPath = storage_path('app/offers/' . $filename);

        if (!is_dir(storage_path('app/offers'))) {
            mkdir(storage_path('app/offers'), 0755, true);
        }

        $objWriter = IOFactory::createWriter($phpWord, 'Word2007');
        $objWriter->save($tempPath);

        $path = 'offers/' . $filename;
        $offer->update(['docx_path' => $path]);

        return $path;
    }

    /**
     * Creates OfferItem records for the given offer applying margin and EI pricing from settings.
     * Loads elevator.elements relationship if not already loaded.
     * Returns total net amount.
     */
    public function buildPricedItems(QuoteRequest $quoteRequest, Offer $offer): float
    {
        $quoteRequest->loadMissing(['elevator.elements']);

        $margin   = 1 + ((float) Setting::get('profit_margin_percent', '0')) / 100;
        $ei30Unit = (float) Setting::get('door_ei30_price', '0');
        $ei60Unit = (float) Setting::get('door_ei60_price', '0');

        $config   = $this->parseConfiguratorNotes($quoteRequest->additional_notes);
        $ei30Count = (int) ($config['ei30DoorsCount'] ?? 0);
        $ei60Count = (int) ($config['ei60DoorsCount'] ?? 0);

        $totalNet   = 0.0;
        $sortOrder  = 1;

        if ($quoteRequest->elevator) {
            $elevator  = $quoteRequest->elevator;
            $basePrice = round((float) $elevator->base_price * $margin, 2);

            OfferItem::create([
                'offer_id'        => $offer->id,
                'description'     => "Dźwig osobowy {$elevator->manufacturer} {$elevator->model} (udźwig {$elevator->capacity} kg, {$elevator->persons} os.)",
                'quantity'        => 1,
                'unit'            => 'szt.',
                'unit_price_net'  => $basePrice,
                'total_price_net' => $basePrice,
                'sort_order'      => $sortOrder++,
            ]);
            $totalNet += $basePrice;

            foreach ($elevator->elements as $element) {
                $elemPrice = round((float) $element->price * $margin, 2);
                OfferItem::create([
                    'offer_id'        => $offer->id,
                    'description'     => $element->name,
                    'quantity'        => 1,
                    'unit'            => 'szt.',
                    'unit_price_net'  => $elemPrice,
                    'total_price_net' => $elemPrice,
                    'sort_order'      => $sortOrder++,
                ]);
                $totalNet += $elemPrice;
            }
        } else {
            OfferItem::create([
                'offer_id'        => $offer->id,
                'description'     => 'Dźwig osobowy - wycena indywidualna',
                'quantity'        => 1,
                'unit'            => 'szt.',
                'unit_price_net'  => 0,
                'total_price_net' => 0,
                'sort_order'      => $sortOrder++,
            ]);
        }

        if ($ei30Count > 0 && $ei30Unit > 0) {
            $unitPrice  = round($ei30Unit * $margin, 2);
            $totalItem  = round($unitPrice * $ei30Count, 2);
            OfferItem::create([
                'offer_id'        => $offer->id,
                'description'     => 'Drzwi przeciwpożarowe EI30',
                'quantity'        => $ei30Count,
                'unit'            => 'szt.',
                'unit_price_net'  => $unitPrice,
                'total_price_net' => $totalItem,
                'sort_order'      => $sortOrder++,
            ]);
            $totalNet += $totalItem;
        }

        if ($ei60Count > 0 && $ei60Unit > 0) {
            $unitPrice  = round($ei60Unit * $margin, 2);
            $totalItem  = round($unitPrice * $ei60Count, 2);
            OfferItem::create([
                'offer_id'        => $offer->id,
                'description'     => 'Drzwi przeciwpożarowe EI60',
                'quantity'        => $ei60Count,
                'unit'            => 'szt.',
                'unit_price_net'  => $unitPrice,
                'total_price_net' => $totalItem,
                'sort_order'      => $sortOrder++,
            ]);
            $totalNet += $totalItem;
        }

        return $totalNet;
    }

    /**
     * Extracts the JSON object embedded in additional_notes.
     * The configurator appends a JSON block after two newlines.
     */
    public function parseConfiguratorNotes(?string $notes): array
    {
        if (!$notes) return [];
        foreach (array_reverse(preg_split('/\n{2,}/', $notes)) as $part) {
            $decoded = json_decode(trim($part), true);
            if (is_array($decoded)) return $decoded;
        }
        return [];
    }
}
