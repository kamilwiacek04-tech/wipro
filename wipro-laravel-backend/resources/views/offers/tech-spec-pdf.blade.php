<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<title>Specyfikacja Techniczna</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: DejaVu Sans, sans-serif; font-size:10px; color:#1a1a2e; line-height:1.5; }
.accent { background:#ffb400; height:6px; }
.header { padding:16px 32px 12px; border-bottom:1px solid #eee; }
.header h1 { font-size:14px; font-weight:bold; }
.header p { font-size:8px; color:#888; margin-top:3px; }
.body { padding:16px 32px; }
.section-title { font-size:7px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#ffb400; border-bottom:2px solid #ffb400; padding-bottom:3px; margin-bottom:10px; }
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
<div class="header">
  <h1>Specyfikacja Techniczna Dźwigu</h1>
  <p>Zapytanie nr: {{ $qr->request_number }} &nbsp;·&nbsp; Data: {{ now()->format('d.m.Y') }}</p>
</div>

<div class="body">

<div class="section-title">Dane techniczne</div>
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

@if($cabinImageBase64)
<div style="margin-top:16px;">
  <div class="section-title">Model kabiny</div>
  <img class="cabin-img" src="{{ $cabinImageBase64 }}">
</div>
@endif

</div>
</body>
</html>
