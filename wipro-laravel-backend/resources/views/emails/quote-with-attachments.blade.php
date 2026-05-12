<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Oferta handlowa</title>
<style>
body { font-family: Arial, sans-serif; line-height:1.6; color:#333; max-width:620px; margin:0 auto; padding:20px; }
.header { background:#ffb400; padding:20px; text-align:center; border-radius:8px 8px 0 0; }
.header h1 { color:#1a1a1a; margin:0; font-size:22px; }
.content { background:#f9f9f9; padding:30px; border-radius:0 0 8px 8px; }
.info-box { background:white; border:1px solid #e0e0e0; border-radius:6px; padding:20px; margin:20px 0; }
.number { font-size:18px; font-family:monospace; font-weight:bold; color:#1a1a1a; }
</style>
</head>
<body>
<div class="header"><h1>Oferta handlowa WIPRO</h1></div>
<div class="content">
  <p>Szanowna Pani / Szanowny Panie <strong>{{ $quoteRequest->investor_name }}</strong>,</p>
  <p>Dziękujemy za złożone zapytanie ofertowe. W załączeniu przesyłamy komplet dokumentacji:</p>
  <div class="info-box">
    <p><strong>Numer oferty:</strong> <span class="number">{{ $offer->offer_number }}</span></p>
    <p><strong>Data wystawienia:</strong> {{ now()->format('d.m.Y') }}</p>
    @if($offer->valid_until)
    <p><strong>Ważna do:</strong> {{ \Carbon\Carbon::parse($offer->valid_until)->format('d.m.Y') }}</p>
    @endif
  </div>
  <p>W skład przesłanej dokumentacji wchodzą:</p>
  <ul style="font-size:14px; margin:10px 0 10px 20px; line-height:2;">
    <li>Oferta handlowa (PDF)</li>
    <li>Opis rozwiązań estetycznych (PDF)</li>
    <li>Specyfikacja techniczna (PDF)</li>
    <li>Rysunki techniczne (jeśli dostępne)</li>
    <li>Opis podstawowy (jeśli dostępny)</li>
  </ul>
  <p>W razie pytań prosimy o kontakt pod adresem <a href="mailto:{{ config('mail.from.address') }}">{{ config('mail.from.address') }}</a></p>
</div>
</body>
</html>
