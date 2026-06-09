<?php

namespace App\Services;

use App\Models\CabinAccessory;
use App\Models\CabinColor;
use App\Models\CabinModel;
use App\Models\Offer;
use App\Models\OfferItem;
use App\Models\QuoteRequest;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpWord\Element\Section as WordSection;
use PhpOffice\PhpWord\Element\Table as WordTable;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\SimpleType\Jc;

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
        $el = $qr->elevator;

        $settings = Setting::all()->pluck('value', 'key')->toArray();
        $config   = $this->parseConfiguratorNotes($qr->additional_notes);

        // Label maps
        $purposeLabels = [
            'PASSENGER'         => 'Osobowy',
            'FREIGHT_PASSENGER' => 'Pasażersko-towarowy',
            'HOSPITAL'          => 'Szpitalny',
            'FIRE'              => 'Pożarowy',
        ];
        $accessDiagramLabels = [
            'FRONT'      => 'Frontowe',
            'THROUGHT'   => 'Przelotowe',
            'CORNER'     => 'Kątowe',
            'TRIPARTITE' => 'Trójstronne',
        ];
        $statusMap = [
            'PASSENGER'   => 'Pasażerski',
            'ARCHITECT'   => 'Projektowy',
            'CONTRACTOR'  => 'Budowlany',
            'RESIDENTIAL' => 'Mieszkalny',
            'HOSPITAL'    => 'Szpitalny',
            'FREIGHT'     => 'Towarowy',
        ];
        $statusLabel = $statusMap[$config['status'] ?? ''] ?? ($config['status'] ?? null);

        // Cabin model
        $cabinModelName = null;
        if ($id = (int)($config['cabinModelId'] ?? 0)) {
            $cabinModelName = CabinModel::find($id)?->name_pl;
        }

        // Accessories (signal, mirror)
        $accIds    = array_values(array_filter([(int)($config['signalId'] ?? 0), (int)($config['mirrorId'] ?? 0)]));
        $accLookup = !empty($accIds) ? CabinAccessory::whereIn('id', $accIds)->pluck('name_pl', 'id') : collect();
        $signalName = ($sid = (int)($config['signalId'] ?? 0)) ? ($accLookup[$sid] ?? null) : null;
        $mirrorName = ($mid = (int)($config['mirrorId'] ?? 0)) ? ($accLookup[$mid] ?? null) : null;

        // Colors
        $colorIds = array_values(array_filter(array_unique([
            (int)($config['cabinColorId']     ?? 0),
            (int)($config['doorColorId']      ?? 0),
            (int)($config['cabinDoorColorId'] ?? 0),
        ])));
        $colorLookup    = !empty($colorIds) ? CabinColor::whereIn('id', $colorIds)->pluck('name_pl', 'id') : collect();
        $cabinColorName = ($id = (int)($config['cabinColorId']  ?? 0)) ? ($colorLookup[$id] ?? null) : null;
        $doorColorName  = ($id = (int)($config['doorColorId']   ?? 0)) ? ($colorLookup[$id] ?? null) : null;
        $sameAsDoor     = $config['cabinDoorSameAsLanding'] ?? true;
        $cabinDoorColorName = (!$sameAsDoor && ($id = (int)($config['cabinDoorColorId'] ?? 0)))
            ? ($colorLookup[$id] ?? null)
            : ($doorColorName ? $doorColorName . ' (jak przystankowe)' : null);

        // Extras
        $extraIds   = array_values(array_filter((array)($config['extraIds'] ?? [])));
        $extraNames = !empty($extraIds) ? CabinAccessory::whereIn('id', $extraIds)->pluck('name_pl')->toArray() : [];

        // Dimension variables
        $shaftW = $qr->shaft_width  ?? $el?->shaft_width;
        $shaftD = $qr->shaft_depth  ?? $el?->shaft_depth;
        $pitD   = $qr->pit_depth    ?? $el?->pit_depth;
        $oh     = $qr->overhead     ?? $el?->overhead;
        $doorW  = $qr->door_width   ?? $el?->door_width;
        $doorH  = $qr->door_height  ?? $el?->door_height;
        $cabW   = $qr->cabin_width  ?? $el?->cabin_width;
        $cabD   = $qr->cabin_depth  ?? $el?->cabin_depth;
        $cabH   = $qr->cabin_height ?? $el?->cabin_height;
        $ei30   = (int)($config['ei30DoorsCount'] ?? 0);
        $ei60   = (int)($config['ei60DoorsCount'] ?? 0);

        $phpWord = new PhpWord();
        $phpWord->setDefaultFontName('Calibri');
        $phpWord->setDefaultFontSize(9);

        $section = $phpWord->addSection([
            'marginTop'    => 800,
            'marginBottom' => 800,
            'marginLeft'   => 1000,
            'marginRight'  => 1000,
        ]);

        // A4 content width: 11906 - 2000 margins = 9906 twips
        $W    = 9906;
        $colW = (int)($W / 2);       // 4953 per column
        $lw   = (int)($colW * 0.52); // label width in spec tables
        $vw   = $colW - $lw;          // value width in spec tables

        $centerPara = ['alignment' => Jc::CENTER];
        $rightPara  = ['alignment' => Jc::END];

        $f8       = ['size' => 8,  'color' => '444444'];
        $f9       = ['size' => 9,  'color' => '1a1a1a'];
        $bold15   = ['bold' => true, 'size' => 15, 'color' => '1a1a1a'];
        $bold16   = ['bold' => true, 'size' => 16, 'color' => '1a1a1a'];
        $headFont = ['bold' => true, 'size' => 9,  'color' => '1a1a1a'];
        $secStyle = ['borderSize' => 4, 'borderColor' => 'bbbbbb', 'cellMarginTop' => 35, 'cellMarginBottom' => 35, 'cellMarginLeft' => 80, 'cellMarginRight' => 80];
        $noStyle  = ['borderSize' => 0, 'borderColor' => 'ffffff', 'cellMargin' => 0];

        // ════════════════════════════════════════════════════
        // PAGE 1 — mirrors offer-pdf.blade.php page 1
        // ════════════════════════════════════════════════════

        // ── Header (company info | logo) ─────────────────────
        $hdrT = $section->addTable(['borderSize' => 0, 'borderColor' => 'ffffff', 'cellMargin' => 80]);
        $hdrT->addRow(900);
        $hdrL = $hdrT->addCell(6200);
        $hdrL->addText($settings['company_name'] ?? 'WIPRO', ['bold' => true, 'size' => 14, 'color' => '1a1a1a']);
        if (!empty($settings['company_address'])) {
            foreach (array_filter(array_map('trim', explode("\n", $settings['company_address']))) as $line) {
                $hdrL->addText($line, ['size' => 8, 'color' => '222222']);
            }
        }
        foreach (['company_nip' => 'NIP', 'company_regon' => 'REGON', 'company_krs' => 'KRS'] as $key => $lbl) {
            if (!empty($settings[$key])) {
                $hdrL->addText($lbl . ': ' . $settings[$key], ['size' => 8, 'color' => '444444']);
            }
        }
        $hdrR = $hdrT->addCell(3706, ['vAlign' => 'top']);
        $logoPath = $settings['company_logo_path'] ?? null;
        if ($logoPath && Storage::exists($logoPath)) {
            try {
                $hdrR->addImage(storage_path('app/' . $logoPath), ['width' => 150, 'height' => 55, 'alignment' => Jc::END]);
            } catch (\Throwable) {}
        }

        // ── HR ────────────────────────────────────────────────
        $this->addDocxHr($section, $W);

        // ── Client block (client info | date) ─────────────────
        $cliT = $section->addTable(['borderSize' => 0, 'borderColor' => 'ffffff', 'cellMargin' => 80]);
        $cliT->addRow();
        $cliL = $cliT->addCell(6200);
        $cliL->addText('Klient:', ['bold' => true, 'size' => 10, 'color' => '1a1a1a']);
        $clientAddr = $qr->investment_address ?? $qr->investor_address ?? null;
        if ($clientAddr)         $cliL->addText($clientAddr,         ['size' => 9, 'color' => '222222']);
        if ($qr->investor_name)  $cliL->addText($qr->investor_name,  ['size' => 9, 'color' => '222222']);
        if ($qr->investor_phone) $cliL->addText($qr->investor_phone, ['size' => 9, 'color' => '222222']);
        if ($qr->investor_email) $cliL->addText($qr->investor_email, ['size' => 9, 'color' => '222222']);
        $cliR = $cliT->addCell(3706);
        $cliR->addText('Data wystawienia: ' . $offer->created_at->format('d.m.Y H:i:s'), ['size' => 8, 'color' => '333333']);

        // ── HR ────────────────────────────────────────────────
        $this->addDocxHr($section, $W);

        // ── Title ─────────────────────────────────────────────
        $section->addText('Oferta handlowa nr ' . $offer->offer_number, $bold15, $centerPara);
        $section->addTextBreak(0);

        // ── HR before items ───────────────────────────────────
        $this->addDocxHr($section, $W);

        // ── Items table ───────────────────────────────────────
        if ($offer->items->count() > 0) {
            $itT = $section->addTable(['borderSize' => 0, 'borderColor' => 'ffffff', 'cellMargin' => 70]);
            $itT->addRow(350);
            $itT->addCell(4700)->addText('Nazwa towaru', $f8);
            $itT->addCell(750)->addText('Ilość', $f8, $centerPara);
            $itT->addCell(700)->addText('Jed.', $f8, $centerPara);
            $itT->addCell(1800)->addText('Cena netto', $f8, $rightPara);
            $itT->addCell(1956)->addText('Wartość netto', $f8, $rightPara);
            foreach ($offer->items as $item) {
                $sep = ['borderTopSize' => 4, 'borderTopColor' => 'e5e5e5'];
                $itT->addRow();
                $itT->addCell(4700, $sep)->addText($item->description, $f9);
                $itT->addCell(750,  $sep)->addText((string)$item->quantity, ['bold' => true, 'size' => 9], $centerPara);
                $itT->addCell(700,  $sep)->addText($item->unit ?? 'szt.', $f9, $centerPara);
                $itT->addCell(1800, $sep)->addText(number_format((float)$item->unit_price_net,  2, ',', ' ') . ' zł', $f9, $rightPara);
                $itT->addCell(1956, $sep)->addText(number_format((float)$item->total_price_net, 2, ',', ' ') . ' zł', $f9, $rightPara);
            }
        }

        // ── HR after items ────────────────────────────────────
        $this->addDocxHr($section, $W);

        // ── Price summary ─────────────────────────────────────
        if ($offer->total_price_net > 0) {
            $section->addText(
                'Orientacyjna wartość netto:    ' . number_format((float)$offer->total_price_net, 2, ',', ' ') . ' zł',
                ['bold' => true, 'size' => 11, 'color' => '1a1a1a'],
                $rightPara
            );
            $section->addText(
                'Kwota orientacyjna — nie stanowi wiążącej oferty handlowej.',
                ['size' => 8, 'color' => '888888', 'italic' => true],
                $rightPara
            );
        }

        // ════════════════════════════════════════════════════
        // PAGE 2 — mirrors offer-pdf.blade.php page 2
        // ════════════════════════════════════════════════════

        $section->addPageBreak();

        // ── Spec title ────────────────────────────────────────
        $section->addText('Specyfikacja techniczna dźwigu', $bold16, $centerPara);
        $this->addDocxHr($section, $W);
        $section->addTextBreak(0);

        // ── Two-column layout: outer table (no borders) ───────
        $outerT = $section->addTable($noStyle);
        $outerT->addRow();
        $outerL = $outerT->addCell($colW, ['vAlign' => 'top']);
        $outerR = $outerT->addCell($colW, ['vAlign' => 'top']);

        // ── LEFT: Parametry dźwigu ────────────────────────────
        $pdzT = $outerL->addTable($secStyle);
        $pdzT->addRow();
        $pdzT->addCell($colW, ['bgColor' => 'efefef', 'gridSpan' => 2])->addText('Parametry dźwigu', $headFont);
        if ($el?->standards)                 $this->addSpecRow($pdzT, 'Zgodność',             (string)$el->standards,         $lw, $vw);
        if ($el?->capacity)                  $this->addSpecRow($pdzT, 'Udźwig [kg]',           (string)$el->capacity,          $lw, $vw);
        if ($el?->persons)                   $this->addSpecRow($pdzT, 'Liczba pasażerów',      $el->persons . ' osób',         $lw, $vw);
        if ($el) {
            $this->addSpecRow($pdzT, 'Typ', trim(($el->manufacturer ?? '') . ' ' . ($el->model ?? '')) . ($el->description ? ' — ' . $el->description : ''), $lw, $vw);
            $this->addSpecRow($pdzT, 'Model', (string)$el->model, $lw, $vw);
        }
        if ($statusLabel)                    $this->addSpecRow($pdzT, 'Przeznaczenie',         $statusLabel,                   $lw, $vw);
        if ($qr->stops)                      $this->addSpecRow($pdzT, 'Ilość przystanków',     (string)$qr->stops,             $lw, $vw);
        if (isset($config['accessCount']))   $this->addSpecRow($pdzT, 'Ilość dojść',           (string)(int)$config['accessCount'], $lw, $vw);
        if ($el?->speed)                     $this->addSpecRow($pdzT, 'Prędkość',              $el->speed . ' m/s',            $lw, $vw);
        if (!empty($config['liftingHeight'])) $this->addSpecRow($pdzT, 'Wys. podnoszenia [m]', (string)$config['liftingHeight'], $lw, $vw);
        if ($el?->machine_room)              $this->addSpecRow($pdzT, 'Maszynownia',           (string)$el->machine_room,      $lw, $vw);

        // ── LEFT: Drzwi ───────────────────────────────────────
        $outerL->addText('');
        $drzT = $outerL->addTable($secStyle);
        $drzT->addRow();
        $drzT->addCell($colW, ['bgColor' => 'efefef', 'gridSpan' => 2])->addText('Drzwi', $headFont);
        if ($qr->door_type)            $this->addSpecRow($drzT, 'Schemat dojścia',         $accessDiagramLabels[$qr->door_type] ?? $qr->door_type, $lw, $vw);
        if ($doorW && $doorH)          $this->addSpecRow($drzT, 'Wymiary (szer. x wys.)',  $doorW . ' x ' . $doorH,                                $lw, $vw);
        if ($el?->cabin_door_finish)   $this->addSpecRow($drzT, 'Drzwi kab. wykończenie', (string)$el->cabin_door_finish,                          $lw, $vw);
        if ($el?->landing_door_finish) $this->addSpecRow($drzT, 'Drzwi szybowe wykończenie', (string)$el->landing_door_finish,                     $lw, $vw);
        if ($el?->door_fire_class)     $this->addSpecRow($drzT, 'Klasa ognioodporności',   (string)$el->door_fire_class,                            $lw, $vw);
        if ($ei30 > 0)                 $this->addSpecRow($drzT, 'Ilość drzwi EI 30',       (string)$ei30,                                           $lw, $vw);
        if ($ei60 > 0)                 $this->addSpecRow($drzT, 'Ilość drzwi EI 60',       (string)$ei60,                                           $lw, $vw);

        // ── RIGHT: Parametry szybu ────────────────────────────
        $szybT = $outerR->addTable($secStyle);
        $szybT->addRow();
        $szybT->addCell($colW, ['bgColor' => 'efefef', 'gridSpan' => 2])->addText('Parametry szybu', $headFont);
        if ($shaftW)          $this->addSpecRow($szybT, 'Szerokość szybu',           (string)$shaftW,                $lw, $vw);
        if ($shaftD)          $this->addSpecRow($szybT, 'Głębokość szybu',           (string)$shaftD,                $lw, $vw);
        if ($pitD)            $this->addSpecRow($szybT, 'Głębokość podszybia [m]',   (string)$pitD,                  $lw, $vw);
        if ($oh)              $this->addSpecRow($szybT, 'Wysokość nadszybia [m]',    (string)$oh,                    $lw, $vw);
        if ($doorW && $doorH) $this->addSpecRow($szybT, 'Otwory drzwiowe (sz. x wys.)', $doorW . ' x ' . $doorH,    $lw, $vw);

        // ── RIGHT: Zespół napędowy ────────────────────────────
        $driveRaw = $qr->drive_type ?? $el?->drive_type;
        if ($driveRaw) {
            $outerR->addText('');
            $napT = $outerR->addTable($secStyle);
            $napT->addRow();
            $napT->addCell($colW, ['bgColor' => 'efefef', 'gridSpan' => 2])->addText('Zespół napędowy', $headFont);
            $this->addSpecRow($napT, 'Typ', $purposeLabels[$driveRaw] ?? $driveRaw, $lw, $vw);
        }

        // ── RIGHT: Kabina ─────────────────────────────────────
        $outerR->addText('');
        $kabT = $outerR->addTable($secStyle);
        $kabT->addRow();
        $kabT->addCell($colW, ['bgColor' => 'efefef', 'gridSpan' => 2])->addText('Kabina' . ($el?->cabin_finish ? ' — ' . $el->cabin_finish : ''), $headFont);
        if ($cabW && $cabD && $cabH)           $this->addSpecRow($kabT, 'Wymiary (sz. x gł. x wys.)',   $cabW . ' x ' . $cabD . ' x ' . $cabH, $lw, $vw);
        if ($el?->cabin_finish)                $this->addSpecRow($kabT, 'Wykończenie ścian',             (string)$el->cabin_finish,              $lw, $vw);
        if (isset($config['leftSideMechanic'])) $this->addSpecRow($kabT, 'Strona mechanizmu',            $config['leftSideMechanic'] ? 'Lewa' : 'Prawa', $lw, $vw);
        if ($qr->lighting)                     $this->addSpecRow($kabT, 'Oświetlenie',                   (string)$qr->lighting,                  $lw, $vw);
        if ($qr->floor_material)               $this->addSpecRow($kabT, 'Podłoga',                       (string)$qr->floor_material,            $lw, $vw);
        if ($qr->control_panel)                $this->addSpecRow($kabT, 'Panel sterowania',               (string)$qr->control_panel,             $lw, $vw);
        if ($qr->handrail)                     $this->addSpecRow($kabT, 'Poręcze',                       (string)$qr->handrail,                  $lw, $vw);
        if ($qr->ceiling)                      $this->addSpecRow($kabT, 'Podsufitka',                    (string)$qr->ceiling,                   $lw, $vw);
        if ($cabinModelName)                   $this->addSpecRow($kabT, 'Model kabiny',                  $cabinModelName,                        $lw, $vw);
        if ($signalName)                       $this->addSpecRow($kabT, 'Sygnalizacja',                  $signalName,                            $lw, $vw);
        if ($mirrorName)                       $this->addSpecRow($kabT, 'Lustro',                        $mirrorName,                            $lw, $vw);
        if ($cabinColorName)                   $this->addSpecRow($kabT, 'Kolor kabiny',                  $cabinColorName,                        $lw, $vw);

        // ── Row 2: Extras + Door colors ───────────────────────
        if (!empty($extraNames) || $doorColorName || $cabinDoorColorName) {
            $section->addTextBreak(0);
            $out2T = $section->addTable($noStyle);
            $out2T->addRow();
            $out2L = $out2T->addCell($colW, ['vAlign' => 'top']);
            $out2R = $out2T->addCell($colW, ['vAlign' => 'top']);

            if (!empty($extraNames)) {
                $extT = $out2L->addTable($secStyle);
                $extT->addRow();
                $extT->addCell($colW, ['bgColor' => 'efefef'])->addText('Dodatki', $headFont);
                foreach ($extraNames as $extraName) {
                    $extT->addRow();
                    $extT->addCell($colW)->addText($extraName, ['size' => 8, 'color' => '1a1a1a']);
                }
            }

            if ($doorColorName || $cabinDoorColorName) {
                $clrT = $out2R->addTable($secStyle);
                $clrT->addRow();
                $clrT->addCell($colW, ['bgColor' => 'efefef', 'gridSpan' => 2])->addText('Kolory drzwi', $headFont);
                if ($doorColorName)      $this->addSpecRow($clrT, 'Kolor drzwi przyst.', $doorColorName,       $lw, $vw);
                if ($cabinDoorColorName) $this->addSpecRow($clrT, 'Kolor drzwi kabin.',  $cabinDoorColorName,  $lw, $vw);
            }
        }

        // ── Footer text ───────────────────────────────────────
        $section->addTextBreak(1);
        $section->addText(
            'W celu sfinalizowania lub korekty umowy prosimy o przesłanie numeru umowy drogą mailową na adres ' . ($settings['company_email'] ?? 'biuro@windywipro.pl') . '. Pozwoli nam to na sprawne przeprowadzenie dalszych etapów realizacji.',
            ['size' => 8, 'color' => '333333']
        );

        // ── Save ─────────────────────────────────────────────
        $filename = str_replace('/', '_', $offer->offer_number) . '.docx';
        $tempPath = storage_path('app/offers/' . $filename);

        if (!is_dir(storage_path('app/offers'))) {
            mkdir(storage_path('app/offers'), 0755, true);
        }

        IOFactory::createWriter($phpWord, 'Word2007')->save($tempPath);

        $path = 'offers/' . $filename;
        $offer->update(['docx_path' => $path]);

        return $path;
    }

    private function addDocxHr(WordSection $section, int $width): void
    {
        $hr = $section->addTable(['borderSize' => 0, 'borderColor' => 'ffffff', 'cellMargin' => 0]);
        $hr->addRow(30);
        $hr->addCell($width, [
            'borderTopSize' => 6, 'borderTopColor' => 'aaaaaa',
            'borderBottomSize' => 0, 'borderBottomColor' => 'ffffff',
            'borderLeftSize' => 0, 'borderLeftColor' => 'ffffff',
            'borderRightSize' => 0, 'borderRightColor' => 'ffffff',
        ])->addText('');
    }

    private function addSpecRow(WordTable $table, string $label, string $value, int $lw, int $vw): void
    {
        $sep = ['borderTopSize' => 4, 'borderTopColor' => 'efefef'];
        $table->addRow();
        $table->addCell($lw, $sep)->addText($label, ['size' => 8, 'color' => '222222', 'underline' => 'single']);
        $table->addCell($vw, $sep)->addText($value,  ['size' => 8, 'color' => '1a1a1a']);
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
