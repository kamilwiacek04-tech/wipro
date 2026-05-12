<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<title>Specyfikacja Techniczna</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: DejaVu Sans, sans-serif; font-size:9px; color:#1a1a1a; line-height:1.5; }
hr { border:none; border-top:1px solid #aaa; margin:0 22px; }
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
  <strong>{{ config('mail.from.address', 'biuro@windywipro.pl') }}</strong>.
  Pozwoli nam to na sprawne przeprowadzenie dalszych etapów realizacji.
</div>

</body>
</html>
