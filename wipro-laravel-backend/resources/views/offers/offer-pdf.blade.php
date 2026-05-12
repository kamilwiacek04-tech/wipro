<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<title>Oferta {{ $offer->offer_number }}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: DejaVu Sans, sans-serif; font-size:9px; color:#1a1a1a; line-height:1.5; }
.hdr { display:table; width:100%; padding:14px 28px 10px; }
.hdr-l { display:table-cell; vertical-align:top; width:62%; }
.hdr-r { display:table-cell; vertical-align:top; text-align:right; }
.co-name { font-size:13px; font-weight:bold; line-height:1.35; margin-bottom:6px; }
.co-info { font-size:8.5px; color:#222; line-height:1.85; }
.logo-img { max-height:72px; max-width:190px; }
hr { border:none; border-top:1px solid #aaa; margin:0 28px; }
.cblock { display:table; width:100%; padding:9px 28px; }
.cblock-l { display:table-cell; width:58%; vertical-align:top; }
.cblock-r { display:table-cell; vertical-align:top; text-align:right; font-size:8.5px; color:#333; }
.clabel { font-weight:bold; font-size:10px; margin-bottom:5px; }
.cinfo { padding-left:10px; font-size:9px; line-height:1.9; color:#222; }
.title { text-align:center; font-size:15px; font-weight:bold; padding:15px 28px 13px; }
.items-wrap { padding:0 28px; }
table.items { width:100%; border-collapse:collapse; font-size:9px; }
table.items thead tr { border-top:1px solid #999; border-bottom:1px solid #999; }
table.items th { padding:6px 8px; font-weight:normal; text-align:left; color:#444; font-size:8.5px; }
table.items td { padding:8px 8px; border-bottom:1px solid #e5e5e5; vertical-align:top; }
table.items tbody tr:last-child td { border-bottom:none; }
.td-qty { text-align:center; font-weight:bold; }
.td-price { text-align:right; white-space:nowrap; }
.summary { padding:10px 28px 0; text-align:right; font-size:9px; line-height:2.1; }
.s-row { display:block; }
.s-total { font-weight:bold; font-size:11px; }
.pasek { margin-top:22px; }
.pasek img { width:100%; display:block; }
/* Page 2 */
.spec-title { text-align:center; font-size:16px; font-weight:bold; padding:16px 28px 12px; }
.spec-wrap { padding:0 22px; }
.sections { display:table; width:100%; }
.sec-row { display:table-row; }
.sec-l { display:table-cell; width:49%; vertical-align:top; padding-right:5px; }
.sec-r { display:table-cell; width:49%; vertical-align:top; padding-left:5px; }
table.sec { width:100%; border-collapse:collapse; border:1px solid #bbb; margin-bottom:8px; font-size:8.5px; }
table.sec .sec-head { font-weight:bold; font-size:9px; padding:5px 8px; border-bottom:1px solid #bbb; }
table.sec td { padding:3.5px 8px; vertical-align:top; }
table.sec td.lbl { text-decoration:underline; width:54%; color:#222; }
table.sec tr.sep td { border-top:1px solid #efefef; }
.spec-footer { padding:16px 28px 10px; font-size:8.5px; color:#333; line-height:1.6; }
</style>
</head>
<body>

{{-- PAGE 1 --}}
<div class="hdr">
  <div class="hdr-l">
    <div class="co-name">{{ $settings['company_name'] ?? 'WIPRO' }}</div>
    <div class="co-info">
      @if(!empty($settings['company_address']))Adres siedziby:<br>{{ $settings['company_address'] }}<br>@endif
      @if(!empty($settings['company_nip']))NIP: {{ $settings['company_nip'] }}<br>@endif
      @if(!empty($settings['company_regon']))REGON: {{ $settings['company_regon'] }}<br>@endif
      KRS: {{ $settings['company_krs'] ?? '' }}
    </div>
  </div>
  <div class="hdr-r">
    @if($logoBase64)<img class="logo-img" src="{{ $logoBase64 }}">@endif
  </div>
</div>

<hr>

<div class="cblock">
  <div class="cblock-l">
    <div class="clabel">Klient:</div>
    <div class="cinfo">
      @php $clientAddr = $qr->investment_address ?? $qr->investor_address ?? null; @endphp
      @if($clientAddr)<div>{{ $clientAddr }}</div>@endif
      @if($qr->investor_name)<div>{{ $qr->investor_name }}</div>@endif
      @if($qr->investor_phone)<div>{{ $qr->investor_phone }}</div>@endif
      @if($qr->investor_email)<div>{{ $qr->investor_email }}</div>@endif
    </div>
  </div>
  <div class="cblock-r">
    Data wystawienia: {{ $offer->created_at->format('d.m.Y H:i:s') }}
  </div>
</div>

<hr>

<div class="title">Oferta handlowa nr {{ $offer->offer_number }}</div>

<hr style="margin-bottom:0">

<div class="items-wrap">
  <table class="items">
    <thead>
      <tr>
        <th style="width:56%">Nazwa towaru</th>
        <th style="text-align:center; width:9%">Ilość</th>
        <th style="text-align:right; width:17%">Cena netto</th>
        <th style="text-align:right; width:18%">Wartość netto</th>
      </tr>
    </thead>
    <tbody>
      @foreach($offer->items as $item)
      <tr>
        <td>{{ $item->description }}</td>
        <td class="td-qty">{{ $item->quantity }}</td>
        <td class="td-price">{{ number_format((float)$item->unit_price_net, 2, ',', ' ') }} zł</td>
        <td class="td-price">{{ number_format((float)$item->total_price_net, 2, ',', ' ') }} zł</td>
      </tr>
      @endforeach
    </tbody>
  </table>
</div>

<hr style="margin-top:0">

<div class="summary">
  <span class="s-row">Wartość netto:&nbsp;&nbsp;{{ number_format((float)$offer->total_price_net, 2, ',', ' ') }} zł</span>
  <span class="s-row">VAT({{ intval($offer->vat_rate) }}%):&nbsp;&nbsp;{{ number_format((float)$offer->total_price_gross - (float)$offer->total_price_net, 2, ',', ' ') }} zł</span>
  <span class="s-row s-total">Razem do zapłaty:&nbsp;&nbsp;{{ number_format((float)$offer->total_price_gross, 2, ',', ' ') }} zł</span>
</div>

@if($pasekBase64)
<div class="pasek"><img src="{{ $pasekBase64 }}"></div>
@endif

{{-- PAGE 2 --}}
<div style="page-break-before:always;"></div>

@php
  $el = $qr->elevator;
  $statusMap = [
    'PASSENGER'   => 'Pasażerski',
    'ARCHITECT'   => 'Projektowy',
    'CONTRACTOR'  => 'Budowlany',
    'RESIDENTIAL' => 'Mieszkalny',
    'HOSPITAL'    => 'Szpitalny',
    'FREIGHT'     => 'Towarowy',
  ];
  $statusLabel = $statusMap[$parsedNotes['status'] ?? ''] ?? ($parsedNotes['status'] ?? null);
  $shaftW = $qr->shaft_width  ?? $el?->shaft_width;
  $shaftD = $qr->shaft_depth  ?? $el?->shaft_depth;
  $pitD   = $qr->pit_depth    ?? $el?->pit_depth;
  $oh     = $qr->overhead     ?? $el?->overhead;
  $doorW  = $qr->door_width   ?? $el?->door_width;
  $doorH  = $qr->door_height  ?? $el?->door_height;
  $cabW   = $qr->cabin_width  ?? $el?->cabin_width;
  $cabD   = $qr->cabin_depth  ?? $el?->cabin_depth;
  $cabH   = $qr->cabin_height ?? $el?->cabin_height;
  $ei30   = (int)($parsedNotes['ei30DoorsCount'] ?? 0);
  $ei60   = (int)($parsedNotes['ei60DoorsCount'] ?? 0);
@endphp

<div class="spec-title">Specyfikacja techniczna dźwigu</div>
<hr style="margin:0 22px 10px">

<div class="spec-wrap">
<div class="sections">

<div class="sec-row">

<div class="sec-l">
  <table class="sec">
    <tr><td colspan="2" class="sec-head">Parametry dźwigu</td></tr>
    @if($el?->standards)
    <tr><td class="lbl">Zgodność</td><td>{{ $el->standards }}</td></tr>
    @endif
    @if($el?->capacity)
    <tr class="sep"><td class="lbl">Udźwig [kg]</td><td>{{ $el->capacity }}</td></tr>
    @endif
    @if($el?->persons)
    <tr class="sep"><td class="lbl">Liczba pasażerów</td><td>{{ $el->persons }} osób</td></tr>
    @endif
    @if($el)
    <tr class="sep"><td class="lbl">Typ</td><td>{{ trim(($el->manufacturer ?? '') . ' ' . ($el->model ?? '')) }}@if($el->description) — {{ $el->description }}@endif</td></tr>
    <tr class="sep"><td class="lbl">Model</td><td>{{ $el->model }}</td></tr>
    @endif
    @if($statusLabel)
    <tr class="sep"><td class="lbl">Przeznaczenie</td><td>{{ $statusLabel }}</td></tr>
    @endif
    @if($qr->stops)
    <tr class="sep"><td class="lbl">Ilość przystanków</td><td>{{ $qr->stops }}</td></tr>
    @endif
    @if(isset($parsedNotes['accessCount']))
    <tr class="sep"><td class="lbl">Ilość dojść</td><td>{{ $parsedNotes['accessCount'] }}</td></tr>
    @endif
    @if($el?->speed)
    <tr class="sep"><td class="lbl">Prędkość</td><td>{{ $el->speed }} m/s</td></tr>
    @endif
    @if(isset($parsedNotes['liftingHeight']))
    <tr class="sep"><td class="lbl">Wysokość podnoszenia [m]</td><td>{{ $parsedNotes['liftingHeight'] }}</td></tr>
    @endif
    @if($el?->machine_room)
    <tr class="sep"><td class="lbl">Maszynownia</td><td>{{ $el->machine_room }}</td></tr>
    @endif
  </table>
</div>

<div class="sec-r">
  <table class="sec" style="margin-bottom:8px">
    <tr><td colspan="2" class="sec-head">Parametry szybu:</td></tr>
    @if($shaftW)
    <tr><td class="lbl">Szerokość szybu</td><td>{{ $shaftW }}</td></tr>
    @endif
    @if($shaftD)
    <tr class="sep"><td class="lbl">Głębokość szybu</td><td>{{ $shaftD }}</td></tr>
    @endif
    @if($pitD)
    <tr class="sep"><td class="lbl">Głębokość podszybia [m]</td><td>{{ $pitD }}</td></tr>
    @endif
    @if($oh)
    <tr class="sep"><td class="lbl">Wysokość nadszybia [m]</td><td>{{ $oh }}</td></tr>
    @endif
    @if($doorW && $doorH)
    <tr class="sep"><td class="lbl">Otwory drzwiowe (szer. x wys.):</td><td>{{ $doorW }} x {{ $doorH }}</td></tr>
    @endif
  </table>

  @if($qr->drive_type || $el?->drive_type)
  <table class="sec">
    <tr><td colspan="2" class="sec-head">Zespół napędowy</td></tr>
    <tr><td class="lbl">Typ</td><td>{{ $qr->drive_type ?? $el?->drive_type }}</td></tr>
  </table>
  @endif
</div>

</div>{{-- /sec-row 1 --}}

<div class="sec-row">

<div class="sec-l">
  <table class="sec">
    <tr><td colspan="2" class="sec-head">Drzwi</td></tr>
    @if($qr->door_type)
    <tr><td class="lbl">Typ:</td><td>{{ $qr->door_type }}</td></tr>
    @endif
    @if($doorW && $doorH)
    <tr class="sep"><td class="lbl">Wymiary drzwi (szer. x wys.):</td><td>{{ $doorW }} x {{ $doorH }}</td></tr>
    @endif
    @if($el?->cabin_door_finish)
    <tr class="sep"><td class="lbl">Drzwi kabinowe wykończenie:</td><td>{{ $el->cabin_door_finish }}</td></tr>
    @endif
    @if($el?->landing_door_finish)
    <tr class="sep"><td class="lbl">Drzwi szybowe wykończenie:</td><td>{{ $el->landing_door_finish }}</td></tr>
    @endif
    @if($el?->door_fire_class)
    <tr class="sep"><td class="lbl">Klasa ognioodporności:</td><td>{{ $el->door_fire_class }}</td></tr>
    @endif
    @if($ei30 > 0)
    <tr class="sep"><td class="lbl">Ilość drzwi EI 30:</td><td>{{ $ei30 }}</td></tr>
    @endif
    @if($ei60 > 0)
    <tr class="sep"><td class="lbl">Ilość drzwi EI 60:</td><td>{{ $ei60 }}</td></tr>
    @endif
  </table>
</div>

<div class="sec-r">
  <table class="sec">
    <tr><td colspan="2" class="sec-head">Kabina@if($el?->cabin_finish): {{ $el->cabin_finish }}@endif</td></tr>
    @if($cabW && $cabD && $cabH)
    <tr><td class="lbl">Wymiary kabiny (szer. x gł. x wys.):</td><td>{{ $cabW }} x {{ $cabD }} x {{ $cabH }}</td></tr>
    @endif
    @if($el?->cabin_finish)
    <tr class="sep"><td class="lbl">Wykończenie wszystkich ścian:</td><td>{{ $el->cabin_finish }}</td></tr>
    @endif
    @if(isset($parsedNotes['leftSideMechanic']))
    <tr class="sep"><td class="lbl">Strona mechanizmu:</td><td>{{ $parsedNotes['leftSideMechanic'] ? 'Lewa' : 'Prawa' }}</td></tr>
    @endif
    @if($qr->lighting)
    <tr class="sep"><td class="lbl">Oświetlenie:</td><td>{{ $qr->lighting }}</td></tr>
    @endif
    @if($qr->floor_material)
    <tr class="sep"><td class="lbl">Podłoga:</td><td>{{ $qr->floor_material }}</td></tr>
    @endif
    @if($qr->control_panel)
    <tr class="sep"><td class="lbl">Panel sterowania:</td><td>{{ $qr->control_panel }}</td></tr>
    @endif
  </table>
</div>

</div>{{-- /sec-row 2 --}}

</div>{{-- /sections --}}
</div>{{-- /spec-wrap --}}

<div class="spec-footer">
  W celu sfinalizowania lub korekty umowy prosimy o przesłanie numeru umowy drogą mailową na adres
  <strong>{{ $settings['company_email'] ?? 'biuro@windywipro.pl' }}</strong>.
  Pozwoli nam to na sprawne przeprowadzenie dalszych etapów realizacji.
</div>

</body>
</html>
