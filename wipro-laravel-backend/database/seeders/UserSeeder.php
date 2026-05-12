<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(['email' => 'admin@wipro.pl'], [
            'name' => 'Administrator WIPRO',
            'password' => Hash::make('Admin123!@#'),
            'role' => 'superadmin',
            'is_active' => true,
            'company' => 'WIPRO Wind sp. z o.o.',
            'phone' => '',
            'city' => '',
        ]);
    }
}
