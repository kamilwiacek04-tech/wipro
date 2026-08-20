<?php

namespace App\Mail;

use App\Models\Offer;
use App\Models\QuoteRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class QuoteMailWithAttachments extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly QuoteRequest $quoteRequest,
        public readonly Offer $offer,
        public readonly string $offerPdfPath,
        public readonly string $aestheticPdfContent,
        public readonly string $techSpecPdfContent,
        public readonly array $extraLinks,
        string $locale = 'pl',
    ) {
        $this->locale($locale);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Oferta handlowa nr ' . $this->offer->offer_number,
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.quote-with-attachments');
    }

    public function attachments(): array
    {
        $list = [];

        // 1. Full offer PDF
        if (Storage::exists($this->offerPdfPath)) {
            $filename = 'oferta-' . str_replace('/', '_', $this->offer->offer_number) . '.pdf';
            $list[] = Attachment::fromPath(Storage::path($this->offerPdfPath))
                ->as($filename)
                ->withMime('application/pdf');
        }

        // 2. Aesthetic description PDF (in-memory)
        $aestheticContent = $this->aestheticPdfContent;
        $list[] = Attachment::fromData(fn() => $aestheticContent, 'opis-rozwiazan-estetycznych.pdf')
            ->withMime('application/pdf');

        // 3. Technical spec PDF (in-memory)
        $techContent = $this->techSpecPdfContent;
        $list[] = Attachment::fromData(fn() => $techContent, 'specyfikacja-techniczna.pdf')
            ->withMime('application/pdf');

        // Rysunki i opisy windy są wysyłane jako linki (patrz $extraLinks), nie załączniki.

        return $list;
    }
}
