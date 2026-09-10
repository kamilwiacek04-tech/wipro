<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ElevatorAdminCmRoundTripTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_creates_elevator_with_cm_and_reads_back_cm(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $response = $this->postJson('/api/admin/elevators', [
            'model' => 'E-500',
            'manufacturer' => 'WIPRO',
            'capacity' => 500,
            'persons' => 6,
            'cabin_width' => 110,
            'cabin_depth' => 120,
            'cabin_height' => 220,
            'shaft_width' => 140,
            'shaft_depth' => 150,
            'pit_depth' => 120,
            'overhead' => 320,
            'speed' => 1.0,
            'max_stops' => 10,
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('shaft_width', 140);
        $response->assertJsonPath('overhead', 320);

        $id = $response->json('id');
        $raw = \DB::table('elevators')->where('id', $id)->first();
        $this->assertSame(1400, $raw->shaft_width);
        $this->assertSame(3200, $raw->overhead);

        $show = $this->getJson("/api/admin/elevators/{$id}");
        $show->assertStatus(200);
        $show->assertJsonPath('shaft_width', 140);
        $show->assertJsonPath('pit_depth', 120);

        $index = $this->getJson('/api/admin/elevators');
        $index->assertStatus(200);
        $index->assertJsonFragment(['id' => $id, 'shaft_width' => 140]);
    }
}
