<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use Illuminate\Http\Request;

class OfferResponseController extends Controller
{
    /**
     * Public token-based response (from email link)
     */
    public function respond(string $token, Request $request)
    {
        $action = $request->query('action');

        if (!in_array($action, ['accept', 'reject'])) {
            return response('<h2>' . __('messages.offer.invalid_link') . '</h2>', 400)
                ->header('Content-Type', 'text/html');
        }

        $offer = Offer::where('response_token', $token)->first();

        if (!$offer) {
            return $this->htmlPage(
                __('messages.offer.unavailable_title'),
                __('messages.offer.not_found'),
                '#ef4444'
            );
        }

        if ($offer->status === 'cancelled') {
            return $this->htmlPage(
                __('messages.offer.cancelled_title'),
                __('messages.offer.cancelled_msg'),
                '#f59e0b'
            );
        }

        if ($offer->status !== 'sent') {
            return $this->htmlPage(
                __('messages.offer.unavailable_title'),
                __('messages.offer.not_available'),
                '#ef4444'
            );
        }

        $clientResponse = $action === 'accept' ? 'accepted' : 'rejected';
        $offerStatus    = $action === 'accept' ? 'accepted' : 'rejected';

        $offer->update([
            'client_response'      => $clientResponse,
            'client_responded_at'  => now(),
            'status'               => $offerStatus,
        ]);

        if ($action === 'accept') {
            $offer->quoteRequest()->update(['status' => 'accepted']);
        }

        return $this->htmlPage(
            $action === 'accept' ? __('messages.offer.accepted_title') : __('messages.offer.rejected_title'),
            $action === 'accept' ? __('messages.offer.accepted_msg')   : __('messages.offer.rejected_msg'),
            $action === 'accept' ? '#22c55e' : '#ef4444'
        );
    }

    /**
     * Authenticated response from client portal
     */
    public function respondAuthenticated(Request $request, int $offerId)
    {
        $action = $request->validate(['action' => 'required|in:accept,reject'])['action'];

        $offer = Offer::with('quoteRequest')
            ->where('id', $offerId)
            ->where('status', 'sent')
            ->whereHas('quoteRequest', fn($q) => $q->where('user_id', $request->user()->id))
            ->firstOrFail();

        $clientResponse = $action === 'accept' ? 'accepted' : 'rejected';

        $offer->update([
            'client_response'     => $clientResponse,
            'client_responded_at' => now(),
            'status'              => $clientResponse,
        ]);

        if ($action === 'accept') {
            $offer->quoteRequest->update(['status' => 'accepted']);
        }

        return response()->json($offer->fresh());
    }

    private function htmlPage(string $title, string $message, string $color): \Illuminate\Http\Response
    {
        $frontendUrl = config('app.client_url', 'http://localhost:3000');
        $html = <<<HTML
<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{$title}</title>
<style>
  body { font-family: Arial, sans-serif; background: #f4f6f8; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  .card { background: white; border-radius: 12px; padding: 48px 40px; max-width: 480px; width: 90%; box-shadow: 0 2px 16px rgba(0,0,0,0.08); text-align: center; }
  .icon { font-size: 48px; margin-bottom: 16px; }
  h1 { font-size: 22px; color: #1a1a1a; margin: 0 0 12px; }
  p { color: #666; font-size: 15px; line-height: 1.6; margin: 0 0 24px; }
  a { display: inline-block; background: #ffb400; color: #1a1a1a; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; }
</style>
</head>
<body>
<div class="card">
  <div class="icon" style="color:{$color}">●</div>
  <h1>{$title}</h1>
  <p>{$message}</p>
  <a href="{$frontendUrl}/konto/moje-zapytania">Przejdź do panelu klienta</a>
</div>
</body>
</html>
HTML;
        return response($html, 200)->header('Content-Type', 'text/html; charset=utf-8');
    }
}
