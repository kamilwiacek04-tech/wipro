<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CabinTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['key' => 'FRONT',      'name_pl' => 'Frontowe',    'name_en' => 'Front',      'sort_order' => 1],
            ['key' => 'THROUGHT',   'name_pl' => 'Przelotowe',  'name_en' => 'Throughway', 'sort_order' => 2],
            ['key' => 'CORNER',     'name_pl' => 'Kątowe',      'name_en' => 'Corner',     'sort_order' => 3],
            ['key' => 'TRIPARTITE', 'name_pl' => 'Trójstronne', 'name_en' => 'Tripartite', 'sort_order' => 4],
        ];

        foreach ($types as $type) {
            DB::table('cabin_types')->updateOrInsert(
                ['key' => $type['key']],
                array_merge($type, ['is_active' => true, 'price' => 0, 'created_at' => now(), 'updated_at' => now()])
            );
        }
    }
}
