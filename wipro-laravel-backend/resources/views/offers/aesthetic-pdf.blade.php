<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<title>Opis Rozwiązań Estetycznych</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: DejaVu Sans, sans-serif; font-size:10px; color:#1a1a2e; line-height:1.5; }
.accent { background:#ffb400; height:6px; }
.header { padding:16px 32px 14px; border-bottom:1px solid #eee; }
.header h1 { font-size:15px; font-weight:bold; color:#1a1a2e; }
.header p { font-size:8px; color:#888; margin-top:3px; }
.body { padding:16px 32px; }
.section-title { font-size:7px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#ffb400; border-bottom:2px solid #ffb400; padding-bottom:3px; margin-bottom:12px; margin-top:18px; }
.cabin-section { text-align:center; margin-bottom:16px; }
.cabin-section img { max-width:320px; max-height:250px; border-radius:8px; }
.cabin-section p { font-size:11px; font-weight:bold; margin-top:8px; }
.grid { display:table; width:100%; border-collapse:separate; }
.grid-row { display:table-row; }
.grid-cell { display:table-cell; width:50%; padding:10px; border:1px solid #f0f0f0; vertical-align:top; text-align:center; }
.grid-cell img { max-width:180px; max-height:140px; border-radius:6px; }
.grid-cell p { font-size:9px; font-weight:bold; margin-top:6px; color:#1a1a2e; }
.grid-cell .cat { font-size:7px; color:#aaa; text-transform:uppercase; letter-spacing:1px; margin-top:2px; }
.no-image { width:180px; height:120px; background:#f5f5f5; border-radius:6px; display:inline-block; line-height:120px; color:#ccc; font-size:9px; }
</style>
</head>
<body>

<div class="accent"></div>
<div class="header">
  <h1>Opis Rozwiązań Estetycznych</h1>
  <p>Zapytanie nr: {{ $qr->request_number }} &nbsp;·&nbsp; {{ now()->format('d.m.Y') }}</p>
</div>

<div class="body">

@if($cabinModel)
<div class="section-title">Wybrany model kabiny</div>
<div class="cabin-section">
  @if($cabinImageBase64)
    <img src="{{ $cabinImageBase64 }}">
  @else
    <div class="no-image">Brak zdjęcia</div>
  @endif
  <p>{{ $cabinModel->name_pl }}</p>
</div>
@endif

@if(count($accessories) > 0)
<div class="section-title">Wybrane wykończenia i akcesoria</div>
<div class="grid">
  @foreach(array_chunk($accessories, 2) as $row)
  <div class="grid-row">
    @foreach($row as $idx => $accessory)
    <div class="grid-cell">
      @if(isset($accessoryImages[$accessory['id']]) && $accessoryImages[$accessory['id']])
        <img src="{{ $accessoryImages[$accessory['id']] }}">
      @else
        <div class="no-image">Brak zdjęcia</div>
      @endif
      <p>{{ $accessory['name_pl'] }}</p>
      <div class="cat">{{ $accessory['category'] }}</div>
    </div>
    @endforeach
    @if(count($row) === 1)
    <div class="grid-cell"></div>
    @endif
  </div>
  @endforeach
</div>
@endif

</div>
</body>
</html>
