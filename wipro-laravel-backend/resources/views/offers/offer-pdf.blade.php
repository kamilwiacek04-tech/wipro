<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<title>Oferta {{ $offer->offer_number }}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: DejaVu Sans, sans-serif; font-size:10px; color:#1a1a2e; line-height:1.5; }
.accent { background:#ffb400; height:6px; }
.header { display:table; width:100%; padding:18px 32px 14px; border-bottom:1px solid #eee; }
.h-left { display:table-cell; vertical-align:middle; width:55%; }
.h-right { display:table-cell; vertical-align:middle; text-align:right; }
.logo-img { max-height:55px; max-width:180px; }
.company-name { font-size:22px; font-weight:bold; color:#1a1a2e; letter-spacing:2px; }
.company-meta { font-size:8px; color:#888; margin-top:4px; line-height:1.7; }
.badge { display:inline-block; background:#ffb400; color:#1a1a2e; font-size:7px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; padding:3px 12px; border-radius:20px; margin-bottom:4px; }
.offer-num { font-size:14px; font-weight:bold; }
.offer-meta { font-size:8px; color:#888; margin-top:2px; }
.body { padding:0 32px 20px; }
.section { margin-top:16px; }
.section-title { font-size:7px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#ffb400; border-bottom:2px solid #ffb400; padding-bottom:3px; margin-bottom:10px; }
.two-col { display:table; width:100%; }
.col { display:table-cell; width:50%; vertical-align:top; }
.col-r { padding-left:16px; }
.info-row { display:table; width:100%; margin-bottom:4px; }
.info-label { display:table-cell; width:42%; font-size:8px; color:#888; }
.info-value { display:table-cell; font-size:10px; font-weight:bold; }
table.items { width:100%; border-collapse:collapse; margin-top:6px; font-size:9px; }
table.items th { text-align:left; color:#888; border-bottom:1px solid #ddd; padding:4px 6px; font-weight:normal; font-size:8px; }
table.items td { padding:5px 6px; border-bottom:1px solid #f5f5f5; }
table.items tr:last-child td { border-bottom:none; }
.price-box { border:2px solid #1a1a2e; border-radius:6px; overflow:hidden; margin-top:6px; }
.p-row { display:table; width:100%; padding:7px 14px; border-bottom:1px solid #f0f0f0; }
.p-row:last-child { border-bottom:none; }
.p-label { display:table-cell; font-size:9px; color:#555; }
.p-value { display:table-cell; text-align:right; font-size:9px; font-weight:bold; }
.p-grand { background:#1a1a2e; }
.p-grand .p-label { color:#fff; font-size:10px; }
.p-grand .p-value { color:#ffb400; font-size:12px; }
.pasek { margin-top:auto; padding-top:16px; }
.pasek img { width:100%; display:block; }
.spec-grid { display:table; width:100%; }
.spec-row { display:table-row; }
.spec-cell { display:table-cell; width:25%; padding:6px 8px; border:1px solid #f0f0f0; vertical-align:top; }
.spec-cell-label { font-size:7px; color:#aaa; text-transform:uppercase; letter-spacing:0.5px; }
.spec-cell-value { font-size:9px; font-weight:bold; margin-top:2px; }
.spec-cell:nth-child(even) { background:#fafafa; }
.cabin-img { max-width:280px; max-height:220px; margin-top:14px; border-radius:6px; }
</style>
</head>
<body>

<div class="accent"></div>

{{-- PAGE 1: Commercial offer --}}
<div class="header">
  <div class="h-left">
    @if($logoBase64)
      <img class="logo-img" src="{{ $logoBase64 }}">
    @else
      <div class="company-name">{{ $settings['company_name'] ?? 'WIPRO' }}</div>
    @endif
    <div class="company-meta">
      @if(!empty($settings['company_address'])){{ $settings['company_address'] }}<br>@endif
      @if(!empty($settings['company_nip']))NIP: {{ $settings['company_nip'] }}@endif
      @if(!empty($settings['company_regon'])}&nbsp;&nbsp;REGON: {{ $settings['company_regon'] }}@endif
      @if(!empty($settings['company_krs']))<br>KRS: {{ $settings['company_krs'] }}@endif
    </div>
  </div>
  <div class="h-right">
    <div class="badge">Oferta handlowa</div>
    <div class="offer-num">{{ $offer->offer_number }}</div>
    <div class="offer-meta">Data: {{ $offer->created_at->format('d.m.Y') }}</div>
    @if($offer->valid_until)
    <div class="offer-meta">Ważna do: <strong>{{ $offer->valid_until->format('d.m.Y') }}</strong></div>
    @endif
  </div>
</div>

<div class="body">

<div class="section">
  <div class="two-col">
    <div class="col">
      <div class="section-title">Adresat oferty</div>
      @if($qr->investor_name)
      <div class="info-row"><span class="info-label">Imię i nazwisko</span><span class="info-value">{{ $qr->investor_name }}</span></div>
      @endif
      @if($qr->investor_company)
      <div class="info-row"><span class="info-label">Firma</span><span class="info-value">{{ $qr->investor_company }}</span></div>
      @endif
      @if($qr->investor_nip)
      <div class="info-row"><span class="info-label">NIP</span><span class="info-value">{{ $qr->investor_nip }}</span></div>
      @endif
      @if($qr->investor_email)
      <div class="info-row"><span class="info-label">Email</span><span class="info-value">{{ $qr->investor_email }}</span></div>
      @endif
      @if($qr->investor_phone)
      <div class="info-row"><span class="info-label">Telefon</span><span class="info-value">{{ $qr->investor_phone }}</span></div>
      @endif
    </div>
    <div class="col col-r">
      <div class="section-title">Dane inwestycji</div>
      @if($qr->investment_name)
      <div class="info-row"><span class="info-label">Nazwa</span><span class="info-value">{{ $qr->investment_name }}</span></div>
      @endif
      @if($qr->investment_address)
      <div class="info-row"><span class="info-label">Adres</span><span class="info-value">{{ $qr->investment_address }}</span></div>
      @endif
      @if($qr->stops)
      <div class="info-row"><span class="info-label">Liczba przystanków</span><span class="info-value">{{ $qr->stops }}</span></div>
      @endif
      @if($qr->drive_type)
      <div class="info-row"><span class="info-label">Napęd</span><span class="info-value">{{ $qr->drive_type }}</span></div>
      @endif
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Zakres i wycena</div>
  <table class="items">
    <thead>
      <tr>
        <th style="width:50%">Opis</th>
        <th style="text-align:center">Ilość</th>
        <th style="text-align:center">J.m.</th>
        <th style="text-align:right">Cena jedn. netto</th>
        <th style="text-align:right">Wartość netto</th>
      </tr>
    </thead>
    <tbody>
      @foreach($offer->items as $item)
      <tr>
        <td>{{ $item->description }}</td>
        <td style="text-align:center">{{ $item->quantity }}</td>
        <td style="text-align:center">{{ $item->unit }}</td>
        <td style="text-align:right">{{ number_format($item->unit_price_net, 2, ',', ' ') }} PLN</td>
        <td style="text-align:right">{{ number_format($item->total_price_net, 2, ',', ' ') }} PLN</td>
      </tr>
      @endforeach
    </tbody>
  </table>
</div>

<div class="section">
  <div class="section-title">Wartość oferty</div>
  <div class="price-box">
    <div class="p-row"><span class="p-label">Wartość netto</span><span class="p-value">{{ number_format($offer->total_price_net, 2, ',', ' ') }} PLN</span></div>
    <div class="p-row"><span class="p-label">VAT {{ $offer->vat_rate }}%</span><span class="p-value">{{ number_format($offer->total_price_gross - $offer->total_price_net, 2, ',', ' ') }} PLN</span></div>
    <div class="p-row p-grand"><span class="p-label">Łącznie brutto</span><span class="p-value">{{ number_format($offer->total_price_gross, 2, ',', ' ') }} PLN</span></div>
  </div>
</div>

@if($pasekBase64)
<div class="pasek">
  <img src="{{ $pasekBase64 }}">
</div>
@endif

</div>{{-- /body page 1 --}}

{{-- PAGE 2: Technical specification --}}
<div style="page-break-before:always;"></div>

<div class="accent"></div>
<div style="padding:18px 32px 20px;">

<div class="section">
  <div class="section-title">Specyfikacja Techniczna Dźwigu</div>
  @php
    $specs = array_filter([
      'Udźwig'        => $qr->lift_capacity ? $qr->lift_capacity . ' kg' : null,
      'Przystanki'    => $qr->stops,
      'Kondygnacje'   => $qr->floors,
      'Napęd'         => $qr->drive_type,
      'Wys. podnosz.' => isset($parsedNotes['liftingHeight']) ? $parsedNotes['liftingHeight'] . ' m' : null,
      'Szer. szybu'   => $qr->shaft_width  ? $qr->shaft_width  . ' mm' : null,
      'Głęb. szybu'   => $qr->shaft_depth  ? $qr->shaft_depth  . ' mm' : null,
      'Szer. kabiny'  => $qr->cabin_width  ? $qr->cabin_width  . ' mm' : null,
      'Głęb. kabiny'  => $qr->cabin_depth  ? $qr->cabin_depth  . ' mm' : null,
      'Wys. kabiny'   => $qr->cabin_height ? $qr->cabin_height . ' mm' : null,
      'Podszybie'     => $qr->pit_depth    ? $qr->pit_depth    . ' mm' : null,
      'Nadszybie'     => $qr->overhead     ? $qr->overhead     . ' mm' : null,
      'Typ drzwi'     => $qr->door_type,
      'Szer. drzwi'   => $qr->door_width   ? $qr->door_width   . ' mm' : null,
      'Wys. drzwi'    => $qr->door_height  ? $qr->door_height  . ' mm' : null,
      'Drzwi EI30'    => ($parsedNotes['ei30DoorsCount'] ?? 0) > 0 ? ($parsedNotes['ei30DoorsCount'] . ' szt.') : null,
      'Drzwi EI60'    => ($parsedNotes['ei60DoorsCount'] ?? 0) > 0 ? ($parsedNotes['ei60DoorsCount'] . ' szt.') : null,
      'Liczba wejść'  => $parsedNotes['accessCount'] ?? null,
      'Strona mech.'  => isset($parsedNotes['leftSideMechanic']) ? ($parsedNotes['leftSideMechanic'] ? 'Lewa' : 'Prawa') : null,
      'Przeznaczenie' => $parsedNotes['status'] ?? null,
    ]);
  @endphp
  <div class="spec-grid">
    @foreach(array_chunk($specs, 4, true) as $row)
    <div class="spec-row">
      @foreach($row as $label => $value)
      <div class="spec-cell">
        <div class="spec-cell-label">{{ $label }}</div>
        <div class="spec-cell-value">{{ $value }}</div>
      </div>
      @endforeach
      @for($i = count($row); $i < 4; $i++)
      <div class="spec-cell" style="background:#fff;border-color:#f8f8f8;"></div>
      @endfor
    </div>
    @endforeach
  </div>
</div>

@if($cabinImageBase64)
<div class="section">
  <div class="section-title">Wybrany model kabiny</div>
  <img class="cabin-img" src="{{ $cabinImageBase64 }}">
</div>
@endif

</div>

</body>
</html>
