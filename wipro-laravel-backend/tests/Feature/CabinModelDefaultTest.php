<?php

namespace Tests\Feature;

use App\Models\CabinModel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CabinModelDefaultTest extends TestCase
{
    use RefreshDatabase;

    public function test_setting_default_on_one_model_clears_others(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $first = CabinModel::create(['name_pl' => 'A', 'name_en' => 'A', 'is_active' => true, 'is_default' => true]);
        $second = CabinModel::create(['name_pl' => 'B', 'name_en' => 'B', 'is_active' => true]);

        $response = $this->patchJson("/api/admin/cabin-models/{$second->id}", ['is_default' => true]);

        $response->assertStatus(200);
        $this->assertFalse($first->fresh()->is_default);
        $this->assertTrue($second->fresh()->is_default);
    }

    public function test_default_cannot_be_set_on_inactive_model(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $model = CabinModel::create(['name_pl' => 'A', 'name_en' => 'A', 'is_active' => false]);

        $response = $this->patchJson("/api/admin/cabin-models/{$model->id}", ['is_default' => true]);

        $response->assertStatus(422);
        $this->assertFalse($model->fresh()->is_default);
    }
}
