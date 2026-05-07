<?php

namespace Database\Seeders;

use App\Models\ElevatorElement;
use Illuminate\Database\Seeder;

class ElevatorElementSeeder extends Seeder
{
    public function run(): void
    {
        $elements = [
            // Poręcze
            ['category' => 'porecze', 'name' => 'Chromowana prosta', 'price' => 800.00, 'description' => 'Poręcz chromowana, prosta, standard'],
            ['category' => 'porecze', 'name' => 'Satynowa prosta', 'price' => 950.00, 'description' => 'Poręcz satynowa, prosta, elegancka'],
            ['category' => 'porecze', 'name' => 'Złota prosta', 'price' => 1200.00, 'description' => 'Poręcz złota, prosta, luksusowa'],
            ['category' => 'porecze', 'name' => 'Chromowana zaokrąglona', 'price' => 1100.00, 'description' => 'Poręcz chromowana, zaokrąglona, komfortowa'],
            ['category' => 'porecze', 'name' => 'Satynowa zaokrąglona', 'price' => 1300.00, 'description' => 'Poręcz satynowa, zaokrąglona, premium'],

            // Podsufitki
            ['category' => 'podsufitki', 'name' => 'Lakierowana biała', 'price' => 600.00, 'description' => 'Podsufitka lakierowana na biało, standardowa'],
            ['category' => 'podsufitki', 'name' => 'Stalowa satynowa', 'price' => 750.00, 'description' => 'Podsufitka stalowa satynowa, nowoczesna'],
            ['category' => 'podsufitki', 'name' => 'Lustro', 'price' => 900.00, 'description' => 'Podsufitka lustrzana, efekt powiększenia przestrzeni'],
            ['category' => 'podsufitki', 'name' => 'Drewnopodobna', 'price' => 850.00, 'description' => 'Podsufitka z okładziną drewnopodobną, ciepły wygląd'],
            ['category' => 'podsufitki', 'name' => 'Aluminiowa szczotkowana', 'price' => 780.00, 'description' => 'Podsufitka aluminiowa szczotkowana'],

            // Oświetlenie
            ['category' => 'oswietlenie', 'name' => 'LED panelowe', 'price' => 400.00, 'description' => 'Oświetlenie LED panelowe, równomierne światło'],
            ['category' => 'oswietlenie', 'name' => 'LED punktowe', 'price' => 550.00, 'description' => 'Oświetlenie LED punktowe, efektowe'],
            ['category' => 'oswietlenie', 'name' => 'LED RGB', 'price' => 800.00, 'description' => 'Oświetlenie LED RGB z możliwością zmiany kolorów'],
            ['category' => 'oswietlenie', 'name' => 'LED taśmowe', 'price' => 450.00, 'description' => 'Oświetlenie LED taśmowe, dekoracyjne'],

            // Podłogi
            ['category' => 'podlogi', 'name' => 'PVC antypoślizgowa', 'price' => 300.00, 'description' => 'Podłoga PVC antypoślizgowa, standard'],
            ['category' => 'podlogi', 'name' => 'Granit naturalny', 'price' => 1500.00, 'description' => 'Podłoga z granitu naturalnego, luksusowa'],
            ['category' => 'podlogi', 'name' => 'Marmur', 'price' => 2000.00, 'description' => 'Podłoga marmurowa, ekskluzywna'],
            ['category' => 'podlogi', 'name' => 'Gres porcelanowy', 'price' => 800.00, 'description' => 'Podłoga z gresu porcelanowego, trwała'],
            ['category' => 'podlogi', 'name' => 'Drewniana', 'price' => 1200.00, 'description' => 'Podłoga drewniana, klasyczna'],

            // Drzwi
            ['category' => 'drzwi', 'name' => 'Stalowe lakierowane', 'price' => 1200.00, 'description' => 'Drzwi stalowe lakierowane, standardowe'],
            ['category' => 'drzwi', 'name' => 'Stalowe satynowe', 'price' => 1500.00, 'description' => 'Drzwi stalowe satynowe, nowoczesne'],
            ['category' => 'drzwi', 'name' => 'Szklane przejrzyste', 'price' => 2500.00, 'description' => 'Drzwi szklane przejrzyste, panoramiczne'],
            ['category' => 'drzwi', 'name' => 'Szklane matowe', 'price' => 2200.00, 'description' => 'Drzwi szklane matowe, eleganckie'],

            // Panel sterowania
            ['category' => 'panel_sterowania', 'name' => 'Standardowy', 'price' => 600.00, 'description' => 'Panel sterowania standardowy z przyciskami'],
            ['category' => 'panel_sterowania', 'name' => 'Dotykowy LCD', 'price' => 1800.00, 'description' => 'Panel sterowania dotykowy LCD, nowoczesny'],
            ['category' => 'panel_sterowania', 'name' => 'Wandaloodporny', 'price' => 900.00, 'description' => 'Panel sterowania wandaloodporny, wzmocniony'],
            ['category' => 'panel_sterowania', 'name' => 'Dotykowy TFT Premium', 'price' => 2400.00, 'description' => 'Panel sterowania dotykowy TFT Premium, ekran kolorowy'],
        ];

        foreach ($elements as $element) {
            ElevatorElement::create(array_merge($element, [
                'elevator_id' => null,
                'unit' => 'szt',
                'is_active' => true,
            ]));
        }
    }
}
