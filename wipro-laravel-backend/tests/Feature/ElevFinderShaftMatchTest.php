<?php

namespace Tests\Feature;

use App\Models\Elevator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ElevFinderShaftMatchTest extends TestCase
{
    use RefreshDatabase;

    private function makeElevator(int $shaftWidthCm, int $shaftDepthCm, string $model = 'E-TEST'): Elevator
    {
        return Elevator::create([
            'model' => $model,
            'manufacturer' => 'WIPRO',
            'capacity' => 400,
            'persons' => 5,
            'cabin_width' => 100,
            'cabin_depth' => 100,
            'cabin_height' => 210,
            'shaft_width' => $shaftWidthCm,
            'shaft_depth' => $shaftDepthCm,
            'speed' => 1.0,
            'max_stops' => 8,
            'is_active' => true,
        ]);
    }

    public function test_matches_elevator_that_fits_in_requested_shaft_cm(): void
    {
        $fits = $this->makeElevator(125, 135, 'FITS');

        $response = $this->postJson('/api/elevFinder', ['shaftLen' => 130, 'shaftDep' => 140]);

        $response->assertStatus(200);
        $response->assertJsonPath('status', 2);
        $response->assertJsonPath('data.0.id', $fits->id);
    }

    public function test_does_not_suggest_elevator_too_large_for_the_shaft(): void
    {
        $this->makeElevator(200, 200, 'TOO-BIG');

        $response = $this->postJson('/api/elevFinder', ['shaftLen' => 130, 'shaftDep' => 140]);

        $response->assertStatus(200);
        $response->assertJsonPath('status', 1);
        $response->assertJsonPath('data', []);
    }
}
