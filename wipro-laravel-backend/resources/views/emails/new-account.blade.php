<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ __('emails.new_account.title') }}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ffb400; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: #1a1a1a; margin: 0; font-size: 22px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; border: 1px solid #e0e0e0; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .info-box p { margin: 5px 0; font-size: 14px; }
        .btn { display: inline-block; background: #ffb400; color: #1a1a1a !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; font-size: 15px; }
        .notice { font-size: 12px; color: #888; margin-top: 16px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ __('emails.new_account.title') }}</h1>
    </div>
    <div class="content">
        <p>{{ __('emails.new_account.greeting') }}</p>
        <p>{!! __('emails.new_account.intro', ['email' => $user->email]) !!}</p>

        <div class="info-box">
            <p><strong>Email:</strong> {{ $user->email }}</p>
        </div>

        <p>{{ __('emails.new_account.set_password') }}</p>
        <a href="{{ $setupUrl }}" class="btn">{{ __('emails.new_account.btn') }}</a>

        <p class="notice">{{ __('emails.new_account.expiry') }}</p>

        <p style="margin-top: 24px; font-size: 13px; color: #666;">
            {{ __('emails.new_account.contact') }} <a href="mailto:{{ config('mail.from.address') }}">{{ config('mail.from.address') }}</a>
        </p>
    </div>
</body>
</html>
