<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <title>Oferta {{ $offer->offer_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 10px;
            color: #1a1a2e;
            background: #fff;
            line-height: 1.5;
        }

        /* ─── ACCENT BAR ─── */
        .accent-bar { background: #ffb400; height: 7px; }

        /* ─── HEADER ─── */
        .header {
            display: table;
            width: 100%;
            padding: 22px 36px 18px;
            border-bottom: 1px solid #efefef;
        }
        .header-left { display: table-cell; vertical-align: middle; width: 50%; }
        .header-right { display: table-cell; vertical-align: middle; text-align: right; }
        .logo-name { font-size: 28px; font-weight: bold; color: #1a1a2e; letter-spacing: 3px; }
        .logo-tagline { font-size: 9px; color: #aaa; letter-spacing: 2px; text-transform: uppercase; margin-top: 2px; }
        .doc-type {
            display: inline-block;
            background: #ffb400;
            color: #1a1a2e;
            font-size: 8px;
            font-weight: bold;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            padding: 4px 14px;
            border-radius: 20px;
            margin-bottom: 6px;
        }
        .offer-num { font-size: 15px; font-weight: bold; color: #1a1a2e; }
        .offer-meta { font-size: 9px; color: #888; margin-top: 3px; }

        /* ─── DOCUMENT TITLE ─── */
        .doc-title {
            text-align: center;
            padding: 20px 36px 16px;
            border-bottom: 1px solid #efefef;
        }
        .doc-title h1 {
            font-size: 15px;
            font-weight: bold;
            color: #1a1a2e;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .doc-title p {
            font-size: 10px;
            color: #888;
            margin-top: 4px;
        }

        /* ─── SECTIONS ─── */
        .body { padding: 0 36px 24px; }

        .section { margin-top: 20px; }
        .section-title {
            font-size: 8px;
            font-weight: bold;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #ffb400;
            border-bottom: 2px solid #ffb400;
            padding-bottom: 4px;
            margin-bottom: 12px;
        }

        /* ─── TWO-COLUMN LAYOUT ─── */
        .two-col { display: table; width: 100%; }
        .col-left { display: table-cell; width: 50%; vertical-align: top; padding-right: 20px; }
        .col-right { display: table-cell; width: 50%; vertical-align: top; padding-left: 8px; }

        /* ─── INFO ROWS ─── */
        .info-row { display: table; width: 100%; margin-bottom: 5px; }
        .info-label { display: table-cell; width: 42%; font-size: 9px; color: #888; vertical-align: top; }
        .info-value { display: table-cell; font-size: 10px; color: #1a1a2e; font-weight: bold; vertical-align: top; }

        /* ─── TECH SPEC GRID ─── */
        .spec-grid { display: table; width: 100%; }
        .spec-row { display: table-row; }
        .spec-cell {
            display: table-cell;
            width: 25%;
            padding: 7px 8px;
            border: 1px solid #f0f0f0;
            vertical-align: top;
        }
        .spec-cell-label { font-size: 8px; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px; }
        .spec-cell-value { font-size: 10px; color: #1a1a2e; font-weight: bold; margin-top: 2px; }
        .spec-cell:nth-child(even) { background: #fafafa; }

        /* ─── SCOPE LIST ─── */
        .scope-list { margin: 0; padding: 0; list-style: none; }
        .scope-item {
            display: table;
            width: 100%;
            padding: 8px 10px;
            border-bottom: 1px solid #f5f5f5;
        }
        .scope-item:first-child { border-top: 1px solid #f5f5f5; }
        .scope-num {
            display: table-cell;
            width: 24px;
            font-size: 10px;
            font-weight: bold;
            color: #ffb400;
            vertical-align: middle;
        }
        .scope-desc { display: table-cell; font-size: 10px; color: #1a1a2e; vertical-align: middle; }
        .scope-note { font-size: 9px; color: #888; margin-top: 2px; }

        /* ─── PRICE BOX ─── */
        .price-box {
            border: 2px solid #1a1a2e;
            border-radius: 8px;
            overflow: hidden;
            margin-top: 8px;
        }
        .price-row { display: table; width: 100%; }
        .price-row-inner {
            display: table;
            width: 100%;
            border-bottom: 1px solid #f0f0f0;
            padding: 8px 16px;
        }
        .price-row-inner:last-child { border-bottom: none; }
        .price-label { display: table-cell; font-size: 10px; color: #555; }
        .price-value { display: table-cell; text-align: right; font-size: 10px; color: #1a1a2e; font-weight: bold; }
        .price-grand { background: #1a1a2e; }
        .price-grand .price-label { color: #fff; font-size: 11px; font-weight: bold; }
        .price-grand .price-value { color: #ffb400; font-size: 13px; font-weight: bold; }

        /* ─── TERMS ─── */
        .terms-grid { display: table; width: 100%; }
        .term-item {
            display: table-cell;
            width: 33.3%;
            padding: 10px 12px;
            background: #fafafa;
            border: 1px solid #f0f0f0;
            vertical-align: top;
        }
        .term-label { font-size: 8px; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
        .term-value { font-size: 10px; color: #1a1a2e; font-weight: bold; }

        /* ─── VALIDITY ─── */
        .validity-bar {
            background: #fff8e1;
            border-left: 4px solid #ffb400;
            padding: 10px 16px;
            margin-top: 14px;
            font-size: 9px;
            color: #7c5700;
        }

        /* ─── NOTES ─── */
        .notes-box {
            background: #f8f8f8;
            border-radius: 6px;
            padding: 12px 14px;
            font-size: 9px;
            color: #555;
            margin-top: 8px;
        }

        /* ─── SIGNATURE AREA ─── */
        .signature-area {
            display: table;
            width: 100%;
            margin-top: 28px;
            padding-top: 16px;
            border-top: 1px solid #efefef;
        }
        .sig-left { display: table-cell; width: 45%; vertical-align: top; }
        .sig-right { display: table-cell; width: 45%; vertical-align: top; text-align: right; }
        .sig-line {
            border-top: 1px solid #ddd;
            margin-top: 36px;
            padding-top: 4px;
            font-size: 9px;
            color: #aaa;
        }

        /* ─── FOOTER ─── */
        .footer {
            margin-top: 20px;
            padding: 10px 36px;
            border-top: 1px solid #f0f0f0;
            display: table;
            width: 100%;
        }
        .footer-left { display: table-cell; font-size: 8px; color: #bbb; vertical-align: middle; }
        .footer-right { display: table-cell; text-align: right; font-size: 8px; color: #bbb; vertical-align: middle; }
        .footer-bar { background: #ffb400; height: 4px; }
    </style>
</head>
<body>

<div class="accent-bar"></div>

{{-- HEADER --}}
<div class="header">
    <div class="header-left">
        <div class="logo-name">WIPRO</div>
        <div class="logo-tagline">Wind &amp; Dźwigi — Systemy transportu pionowego</div>
    </div>
    <div class="header-right">
        <div class="doc-type">Oferta handlowa</div>
        <div class="offer-num">{{ $offer->offer_number }}</div>
        <div class="offer-meta">
            Data wystawienia: {{ $offer->created_at->format('d.m.Y') }}
            @if($offer->valid_until)
            &nbsp;·&nbsp; Ważna do: <strong>{{ $offer->valid_until->format('d.m.Y') }}</strong>
            @endif
        </div>
        <div class="offer-meta" style="margin-top:3px; color:#1a1a2e; font-weight:bold;">
            Zapytanie nr: {{ $offer->quoteRequest->request_number }}
        </div>
    </div>
</div>

{{-- DOCUMENT TITLE --}}
<div class="doc-title">
    <h1>Oferta na dostawę i montaż dźwigu osobowego</h1>
    <p>Niniejsza oferta przygotowana została na podstawie złożonego zapytania ofertowego.</p>
</div>

<div class="body">

{{-- ADDRESSEE + INVESTMENT --}}
<div class="section">
    <div class="two-col">
        <div class="col-left">
            <div class="section-title">Adresat oferty</div>
            <div class="info-row">
                <span class="info-label">Imię i nazwisko</span>
                <span class="info-value">{{ $offer->quoteRequest->investor_name }}</span>
            </div>
            @if($offer->quoteRequest->investor_company)
            <div class="info-row">
                <span class="info-label">Firma / Inwestor</span>
                <span class="info-value">{{ $offer->quoteRequest->investor_company }}</span>
            </div>
            @endif
            @if($offer->quoteRequest->investor_nip)
            <div class="info-row">
                <span class="info-label">NIP</span>
                <span class="info-value">{{ $offer->quoteRequest->investor_nip }}</span>
            </div>
            @endif
            <div class="info-row">
                <span class="info-label">Email</span>
                <span class="info-value">{{ $offer->quoteRequest->investor_email }}</span>
            </div>
            @if($offer->quoteRequest->investor_phone)
            <div class="info-row">
                <span class="info-label">Telefon</span>
                <span class="info-value">{{ $offer->quoteRequest->investor_phone }}</span>
            </div>
            @endif
            @if($offer->quoteRequest->investor_address || $offer->quoteRequest->investor_city)
            <div class="info-row">
                <span class="info-label">Adres</span>
                <span class="info-value">
                    {{ implode(', ', array_filter([$offer->quoteRequest->investor_address, $offer->quoteRequest->investor_city])) }}
                </span>
            </div>
            @endif
        </div>
        <div class="col-right">
            <div class="section-title">Dane inwestycji</div>
            @if($offer->quoteRequest->investment_name)
            <div class="info-row">
                <span class="info-label">Nazwa inwestycji</span>
                <span class="info-value">{{ $offer->quoteRequest->investment_name }}</span>
            </div>
            @endif
            @if($offer->quoteRequest->investment_address)
            <div class="info-row">
                <span class="info-label">Adres</span>
                <span class="info-value">{{ $offer->quoteRequest->investment_address }}</span>
            </div>
            @endif
            @if($offer->quoteRequest->floors)
            <div class="info-row">
                <span class="info-label">Liczba kondygnacji</span>
                <span class="info-value">{{ $offer->quoteRequest->floors }}</span>
            </div>
            @endif
            @if($offer->quoteRequest->stops)
            <div class="info-row">
                <span class="info-label">Liczba przystanków</span>
                <span class="info-value">{{ $offer->quoteRequest->stops }}</span>
            </div>
            @endif
            @if($offer->quoteRequest->drive_type)
            <div class="info-row">
                <span class="info-label">Rodzaj napędu</span>
                <span class="info-value">{{ $offer->quoteRequest->drive_type }}</span>
            </div>
            @endif
        </div>
    </div>
</div>

{{-- TECHNICAL SPECIFICATION --}}
@php
$specs = array_filter([
    'Udźwig' => $offer->quoteRequest->lift_capacity ? $offer->quoteRequest->lift_capacity . ' kg' : null,
    'Przystanki' => $offer->quoteRequest->stops,
    'Napęd' => $offer->quoteRequest->drive_type,
    'Szer. szybu' => $offer->quoteRequest->shaft_width ? $offer->quoteRequest->shaft_width . ' mm' : null,
    'Głęb. szybu' => $offer->quoteRequest->shaft_depth ? $offer->quoteRequest->shaft_depth . ' mm' : null,
    'Szer. kabiny' => $offer->quoteRequest->cabin_width ? $offer->quoteRequest->cabin_width . ' mm' : null,
    'Głęb. kabiny' => $offer->quoteRequest->cabin_depth ? $offer->quoteRequest->cabin_depth . ' mm' : null,
    'Wys. kabiny' => $offer->quoteRequest->cabin_height ? $offer->quoteRequest->cabin_height . ' mm' : null,
    'Podszybie' => $offer->quoteRequest->pit_depth ? $offer->quoteRequest->pit_depth . ' mm' : null,
    'Nadszybie' => $offer->quoteRequest->overhead ? $offer->quoteRequest->overhead . ' mm' : null,
    'Drzwi' => $offer->quoteRequest->door_type,
    'Szer. drzwi' => $offer->quoteRequest->door_width ? $offer->quoteRequest->door_width . ' mm' : null,
]);
@endphp

@if(count($specs) > 0)
<div class="section">
    <div class="section-title">Specyfikacja techniczna</div>
    <div class="spec-grid">
        @php $specChunks = array_chunk(array_keys($specs), 4, true); $specValues = array_values($specs); $specKeys = array_keys($specs); @endphp
        @foreach(array_chunk($specs, 4, true) as $row)
        <div class="spec-row">
            @foreach($row as $label => $value)
            <div class="spec-cell">
                <div class="spec-cell-label">{{ $label }}</div>
                <div class="spec-cell-value">{{ $value }}</div>
            </div>
            @endforeach
            @for($i = count($row); $i < 4; $i++)
            <div class="spec-cell" style="background:#fff; border-color:#f8f8f8;"></div>
            @endfor
        </div>
        @endforeach
    </div>
</div>
@endif

{{-- FINISHES --}}
@php
$finishes = array_filter([
    'Poręcze' => $offer->quoteRequest->handrail,
    'Podsufitka' => $offer->quoteRequest->ceiling,
    'Oświetlenie' => $offer->quoteRequest->lighting,
    'Podłoga' => $offer->quoteRequest->floor_material,
    'Panel sterowania' => $offer->quoteRequest->control_panel,
]);
@endphp

@if(count($finishes) > 0)
<div class="section">
    <div class="section-title">Wykończenie i akcesoria</div>
    <div class="spec-grid">
        @foreach(array_chunk($finishes, 4, true) as $row)
        <div class="spec-row">
            @foreach($row as $label => $value)
            <div class="spec-cell">
                <div class="spec-cell-label">{{ $label }}</div>
                <div class="spec-cell-value">{{ $value }}</div>
            </div>
            @endforeach
            @for($i = count($row); $i < 4; $i++)
            <div class="spec-cell" style="background:#fff; border-color:#f8f8f8;"></div>
            @endfor
        </div>
        @endforeach
    </div>
</div>
@endif

{{-- SCOPE OF SUPPLY --}}
@if($offer->items->count() > 0)
<div class="section">
    <div class="section-title">Zakres oferty</div>
    <div class="scope-list">
        @foreach($offer->items as $i => $item)
        <div class="scope-item">
            <span class="scope-num">{{ $i + 1 }}.</span>
            <span class="scope-desc">{{ $item->description }}</span>
        </div>
        @endforeach
    </div>
</div>
@endif

{{-- PRICING --}}
<div class="section">
    <div class="section-title">Wartość oferty</div>
    <div class="price-box">
        <div class="price-row-inner">
            <span class="price-label">Wartość netto</span>
            <span class="price-value">{{ number_format($offer->total_price_net, 2, ',', ' ') }} PLN</span>
        </div>
        <div class="price-row-inner">
            <span class="price-label">VAT {{ $offer->vat_rate }}%</span>
            <span class="price-value">{{ number_format($offer->total_price_gross - $offer->total_price_net, 2, ',', ' ') }} PLN</span>
        </div>
        <div class="price-row-inner price-grand">
            <span class="price-label">Łącznie brutto</span>
            <span class="price-value">{{ number_format($offer->total_price_gross, 2, ',', ' ') }} PLN</span>
        </div>
    </div>
</div>

{{-- COMMERCIAL TERMS --}}
<div class="section">
    <div class="section-title">Warunki handlowe</div>
    <div class="terms-grid">
        <div class="term-item">
            <div class="term-label">Termin płatności</div>
            <div class="term-value">30 dni od wystawienia faktury</div>
        </div>
        <div class="term-item">
            <div class="term-label">Gwarancja</div>
            <div class="term-value">24 miesiące</div>
        </div>
        <div class="term-item">
            <div class="term-label">Termin realizacji</div>
            <div class="term-value">Do uzgodnienia indywidualnie</div>
        </div>
    </div>
</div>

{{-- VALIDITY --}}
@if($offer->valid_until)
<div class="validity-bar">
    <strong>Ważność oferty:</strong> Oferta obowiązuje do <strong>{{ $offer->valid_until->format('d.m.Y') }}</strong>.
    Po upływie terminu ważności prosimy o kontakt w celu potwierdzenia aktualności cen.
</div>
@endif

{{-- NOTES --}}
@if($offer->notes)
<div class="section">
    <div class="section-title">Uwagi i zastrzeżenia</div>
    <div class="notes-box">{{ $offer->notes }}</div>
</div>
@endif

{{-- SIGNATURE AREA --}}
<div class="signature-area">
    <div class="sig-left">
        <div style="font-size:9px; color:#888; margin-bottom: 4px;">Oferta przygotowana przez:</div>
        <div style="font-size:10px; font-weight:bold; color:#1a1a2e;">WIPRO Wind sp. z o.o.</div>
        <div style="font-size:9px; color:#888;">kontakt@wipro-wind.pl</div>
        <div class="sig-line">Podpis i pieczęć</div>
    </div>
    <div class="sig-right">
        <div style="font-size:9px; color:#888; margin-bottom: 4px;">Akceptacja klienta:</div>
        <div style="font-size:10px; color:#888; font-style:italic;">{{ $offer->quoteRequest->investor_name }}</div>
        @if($offer->quoteRequest->investor_company)
        <div style="font-size:9px; color:#bbb;">{{ $offer->quoteRequest->investor_company }}</div>
        @endif
        <div class="sig-line">Podpis i data</div>
    </div>
</div>

</div>{{-- /body --}}

<div class="footer">
    <div class="footer-left">
        WIPRO Wind sp. z o.o. &nbsp;·&nbsp; kontakt@wipro-wind.pl &nbsp;·&nbsp; Oferta nr {{ $offer->offer_number }}
    </div>
    <div class="footer-right">
        Wygenerowano {{ now()->format('d.m.Y') }}
    </div>
</div>
<div class="footer-bar"></div>

</body>
</html>
