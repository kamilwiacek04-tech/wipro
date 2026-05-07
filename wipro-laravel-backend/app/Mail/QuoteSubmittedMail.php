<?php

namespace App\Mail;

use App\Models\QuoteRequest;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class QuoteSubmittedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User $user,
        public readonly QuoteRequest $quoteRequest,
        public readonly string $myQuotesUrl,
        string $locale = 'pl',
    ) {
        $this->locale($locale);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: __('emails.quote_submitted.subject', ['number' => $this->quoteRequest->request_number]),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.quote-submitted',
        );
    }
}
