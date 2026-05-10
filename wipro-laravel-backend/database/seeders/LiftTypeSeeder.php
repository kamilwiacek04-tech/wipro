<?php

namespace Database\Seeders;

use App\Models\LiftType;
use App\Models\Setting;
use Illuminate\Database\Seeder;

class LiftTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['key' => 'PASSENGER',         'name_pl' => 'Osobowa',           'name_en' => 'Passenger',            'sort_order' => 1],
            ['key' => 'FREIGHT_PASSENGER',  'name_pl' => 'Towarowo-osobowa',  'name_en' => 'Freight and passenger', 'sort_order' => 2],
            ['key' => 'HOSPITAL',           'name_pl' => 'Szpitalna',         'name_en' => 'Hospital',             'sort_order' => 3],
            ['key' => 'FIRE',               'name_pl' => 'Pożarowa',          'name_en' => 'Firefighting',         'sort_order' => 4],
        ];

        foreach ($types as $type) {
            LiftType::updateOrCreate(['key' => $type['key']], array_merge($type, ['is_active' => true]));
        }

        Setting::set('max_stops', '16');
    }
}
