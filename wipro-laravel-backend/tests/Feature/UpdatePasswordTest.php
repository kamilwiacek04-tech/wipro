<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UpdatePasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_change_own_password_with_correct_current_password(): void
    {
        $user = User::factory()->create(['role' => 'admin', 'password' => Hash::make('old-password')]);
        Sanctum::actingAs($user);

        $response = $this->patchJson('/api/auth/password', [
            'current_password' => 'old-password',
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ]);

        $response->assertStatus(200);
        $this->assertTrue(Hash::check('new-password-123', $user->fresh()->password));
    }

    public function test_rejects_wrong_current_password(): void
    {
        $user = User::factory()->create(['role' => 'admin', 'password' => Hash::make('old-password')]);
        Sanctum::actingAs($user);

        $response = $this->patchJson('/api/auth/password', [
            'current_password' => 'wrong-password',
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('current_password');
        $this->assertTrue(Hash::check('old-password', $user->fresh()->password));
    }

    public function test_rejects_unconfirmed_password(): void
    {
        $user = User::factory()->create(['role' => 'admin', 'password' => Hash::make('old-password')]);
        Sanctum::actingAs($user);

        $response = $this->patchJson('/api/auth/password', [
            'current_password' => 'old-password',
            'password' => 'new-password-123',
            'password_confirmation' => 'different',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('password');
    }

    public function test_rejects_short_password(): void
    {
        $user = User::factory()->create(['role' => 'admin', 'password' => Hash::make('old-password')]);
        Sanctum::actingAs($user);

        $response = $this->patchJson('/api/auth/password', [
            'current_password' => 'old-password',
            'password' => 'short',
            'password_confirmation' => 'short',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('password');
    }
}
