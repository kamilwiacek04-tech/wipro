<?php

namespace Tests\Feature;

use App\Models\CabinColor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CabinColorDefaultTest extends TestCase
{
    use RefreshDatabase;

    public function test_default_cabin_and_default_door_are_independent(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $red = CabinColor::create([
            'name_pl' => 'Czerwony', 'name_en' => 'Red',
            'visible_for_cabin' => true, 'visible_for_door' => true,
            'is_active' => true, 'is_default_cabin' => true, 'is_default_door' => true,
        ]);
        $blue = CabinColor::create([
            'name_pl' => 'Niebieski', 'name_en' => 'Blue',
            'visible_for_cabin' => true, 'visible_for_door' => true,
            'is_active' => true,
        ]);

        $response = $this->patchJson("/api/admin/cabin-colors/{$blue->id}", ['is_default_cabin' => true]);

        $response->assertStatus(200);
        $this->assertFalse($red->fresh()->is_default_cabin);
        $this->assertTrue($red->fresh()->is_default_door);
        $this->assertTrue($blue->fresh()->is_default_cabin);
        $this->assertFalse($blue->fresh()->is_default_door);
    }

    public function test_default_cabin_requires_visible_for_cabin(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $color = CabinColor::create([
            'name_pl' => 'Zielony', 'name_en' => 'Green',
            'visible_for_cabin' => false, 'visible_for_door' => true,
            'is_active' => true,
        ]);

        $response = $this->patchJson("/api/admin/cabin-colors/{$color->id}", ['is_default_cabin' => true]);

        $response->assertStatus(422);
        $this->assertFalse($color->fresh()->is_default_cabin);
    }
}
