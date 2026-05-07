<?php

namespace App\Mail;

use App\Models\Offer;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OfferSentMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User $user,
        public readonly Offer $offer,
        public readonly string $acceptUrl,
        public readonly string $rejectUrl,
        public readonly string $portalUrl,
        string $locale = 'pl',
    ) {
        $this->locale($locale);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: __('emails.offer_sent.subject', ['number' => $this->offer->offer_number]),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.offer-sent',
        );
    }
}
