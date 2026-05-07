<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ __('emails.offer_sent.title') }}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 620px; margin: 0 auto; padding: 20px; }
        .header { background: #ffb400; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: #1a1a1a; margin: 0; font-size: 22px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; border: 1px solid #e0e0e0; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .number { font-size: 18px; font-family: monospace; font-weight: bold; color: #1a1a1a; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 14px; }
        th { text-align: left; color: #888; font-weight: normal; padding: 4px 8px; border-bottom: 1px solid #eee; }
        td { padding: 6px 8px; border-bottom: 1px solid #f4f4f4; }
        .total-row td { font-weight: bold; border-top: 2px solid #e0e0e0; padding-top: 10px; }
        .btn-accept { display: inline-block; background: #22c55e; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; }
        .btn-reject { display: inline-block; background: #ef4444; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; }
        .btn-portal { display: inline-block; background: #ffb400; color: #1a1a1a !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; }
        .actions { display: flex; gap: 16px; margin: 24px 0; flex-wrap: wrap; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ __('emails.offer_sent.title') }}</h1>
    </div>
    <div class="content">
        <p>{{ __('emails.offer_sent.greeting', ['name' => $user->name]) }}</p>
        <p>{{ __('emails.offer_sent.intro') }}</p>

        <div class="info-box">
            <p><strong>{{ __('emails.offer_sent.offer_number') }}</strong> <span class="number">{{ $offer->offer_number }}</span></p>
            <p><strong>{{ __('emails.offer_sent.issue_date') }}</strong> {{ $offer->sent_at?->format('d.m.Y') ?? now()->format('d.m.Y') }}</p>
            @if($offer->valid_until)
            <p><strong>{{ __('emails.offer_sent.valid_until') }}</strong> {{ \Carbon\Carbon::parse($offer->valid_until)->format('d.m.Y') }}</p>
            @endif

            <table>
                <thead>
                    <tr>
                        <th>{{ __('emails.offer_sent.col_description') }}</th>
                        <th style="text-align:right">{{ __('emails.offer_sent.col_qty') }}</th>
                        <th style="text-align:right">{{ __('emails.offer_sent.col_unit_price') }}</th>
                        <th style="text-align:right">{{ __('emails.offer_sent.col_total') }}</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($offer->items as $item)
                    <tr>
                        <td>{{ $item->description }}</td>
                        <td style="text-align:right">{{ $item->quantity }} {{ $item->unit }}</td>
                        <td style="text-align:right">{{ number_format($item->unit_price_net, 2, ',', ' ') }} zł</td>
                        <td style="text-align:right">{{ number_format($item->total_price_net, 2, ',', ' ') }} zł</td>
                    </tr>
                    @endforeach
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="text-align:right; color:#888; font-size:13px;">{{ __('emails.offer_sent.net_total') }}</td>
                        <td style="text-align:right">{{ number_format($offer->total_price_net, 2, ',', ' ') }} zł</td>
                    </tr>
                    <tr>
                        <td colspan="3" style="text-align:right; color:#888; font-size:13px;">{{ __('emails.offer_sent.vat', ['rate' => $offer->vat_rate]) }}</td>
                        <td style="text-align:right">{{ number_format($offer->total_price_gross - $offer->total_price_net, 2, ',', ' ') }} zł</td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="3" style="text-align:right">{{ __('emails.offer_sent.gross_total') }}</td>
                        <td style="text-align:right; font-size:16px;">{{ number_format($offer->total_price_gross, 2, ',', ' ') }} zł</td>
                    </tr>
                </tfoot>
            </table>
        </div>

        @if($offer->notes)
        <div class="info-box">
            <p><strong>{{ __('emails.offer_sent.notes_label') }}</strong></p>
            <p style="font-size:14px; margin:0;">{{ $offer->notes }}</p>
        </div>
        @endif

        <p><strong>{{ __('emails.offer_sent.respond_prompt') }}</strong></p>
        <div class="actions">
            <a href="{{ $acceptUrl }}" class="btn-accept">{{ __('emails.offer_sent.accept_btn') }}</a>
            <a href="{{ $rejectUrl }}" class="btn-reject">{{ __('emails.offer_sent.reject_btn') }}</a>
        </div>

        <p style="font-size:13px; color:#666;">{{ __('emails.offer_sent.portal_hint') }}</p>
        <a href="{{ $portalUrl }}" class="btn-portal">{{ __('emails.offer_sent.portal_btn') }}</a>

        <p style="margin-top: 24px; font-size: 13px; color: #666;">
            {{ __('emails.offer_sent.contact') }} <a href="mailto:{{ config('mail.from.address') }}">{{ config('mail.from.address') }}</a>
        </p>
    </div>
</body>
</html>
