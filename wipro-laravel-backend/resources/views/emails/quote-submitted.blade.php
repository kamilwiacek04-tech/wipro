<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ __('emails.quote_submitted.title') }}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ffb400; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: #1a1a1a; margin: 0; font-size: 22px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; border: 1px solid #e0e0e0; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .info-box p { margin: 5px 0; font-size: 14px; }
        .number { font-size: 18px; font-family: monospace; font-weight: bold; color: #1a1a1a; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ __('emails.quote_submitted.title') }}</h1>
    </div>
    <div class="content">
        <p>{{ __('emails.quote_submitted.greeting', ['name' => $user->name]) }}</p>
        <p>{{ __('emails.quote_submitted.intro') }}</p>

        <div class="info-box">
            <p><strong>{{ __('emails.quote_submitted.number') }}</strong> <span class="number">{{ $quoteRequest->request_number }}</span></p>
            <p><strong>{{ __('emails.quote_submitted.date') }}</strong> {{ $quoteRequest->created_at->format('d.m.Y H:i') }}</p>
            <p><strong>{{ __('emails.quote_submitted.status') }}</strong> {{ __('emails.quote_submitted.status_value') }}</p>
        </div>

        <p>{{ __('emails.quote_submitted.next_steps') }}</p>

        <p style="margin-top: 24px; font-size: 13px; color: #666;">
            {{ __('emails.quote_submitted.contact') }} <a href="mailto:{{ config('mail.from.address') }}">{{ config('mail.from.address') }}</a>
        </p>
    </div>
</body>
</html>
