<?php

namespace Tests\Feature;

use App\Models\CabinAccessory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CabinAccessoryDefaultTest extends TestCase
{
    use RefreshDatabase;

    public function test_setting_default_clears_others_in_same_category_only(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $panelA = CabinAccessory::create(['category' => 'PANEL', 'name_pl' => 'A', 'name_en' => 'A', 'is_active' => true, 'is_default' => true]);
        $panelB = CabinAccessory::create(['category' => 'PANEL', 'name_pl' => 'B', 'name_en' => 'B', 'is_active' => true]);
        $signalA = CabinAccessory::create(['category' => 'SIGNAL', 'name_pl' => 'C', 'name_en' => 'C', 'is_active' => true, 'is_default' => true]);

        $response = $this->patchJson("/api/admin/cabin-accessories/{$panelB->id}", ['is_default' => true]);

        $response->assertStatus(200);
        $this->assertFalse($panelA->fresh()->is_default);
        $this->assertTrue($panelB->fresh()->is_default);
        $this->assertTrue($signalA->fresh()->is_default);
    }

    public function test_default_cannot_be_set_on_inactive_accessory(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $accessory = CabinAccessory::create(['category' => 'MIRROR', 'name_pl' => 'A', 'name_en' => 'A', 'is_active' => false]);

        $response = $this->patchJson("/api/admin/cabin-accessories/{$accessory->id}", ['is_default' => true]);

        $response->assertStatus(422);
        $this->assertFalse($accessory->fresh()->is_default);
    }
}
