<?php

namespace Tests\Feature;

use App\Models\QuoteRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuoteRequestShaftPersistenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_shaft_width_and_depth_are_stored_verbatim_in_cm(): void
    {
        $response = $this->postJson('/api/quote-requests', [
            'investor_name' => 'Jan Kowalski',
            'investor_email' => 'jan.kowalski@example.com',
            'shaft_width' => 140,
            'shaft_depth' => 150,
            'pit_depth' => 120,
            'overhead' => 320,
        ]);

        $response->assertStatus(201);

        $quoteRequest = QuoteRequest::where('request_number', $response->json('request_number'))->firstOrFail();

        $this->assertSame(140, $quoteRequest->shaft_width);
        $this->assertSame(150, $quoteRequest->shaft_depth);
        $this->assertSame(120, $quoteRequest->pit_depth);
        $this->assertSame(320, $quoteRequest->overhead);
    }
}
