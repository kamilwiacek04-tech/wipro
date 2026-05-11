<?php

namespace Database\Seeders;

use App\Models\CabinAccessory;
use Illuminate\Database\Seeder;

class CabinAccessorySeeder extends Seeder
{
    public function run(): void
    {
        $extras = [
            ['name_pl' => 'System odzysku energii',    'name_en' => 'Energy Recovery System'],
            ['name_pl' => 'Systemy antywibracyjne',     'name_en' => 'Anti-Vibration Systems'],
            ['name_pl' => 'System monitorowania kabiny', 'name_en' => 'Cabin Monitoring System'],
            ['name_pl' => 'Oświetlenie szybu',          'name_en' => 'Shaft Lighting'],
            ['name_pl' => 'Zwiększenie prędkości',      'name_en' => 'Increase Speed'],
        ];

        foreach ($extras as $i => $extra) {
            CabinAccessory::firstOrCreate(
                ['category' => 'EXTRA', 'name_pl' => $extra['name_pl']],
                [
                    'name_en'    => $extra['name_en'],
                    'sort_order' => $i + 1,
                    'is_active'  => true,
                ]
            );
        }
    }
}
