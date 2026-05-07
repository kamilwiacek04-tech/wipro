<?php

namespace Database\Seeders;

use App\Models\Elevator;
use App\Models\QuoteRequest;
use App\Models\User;
use Illuminate\Database\Seeder;

class QuoteRequestSeeder extends Seeder
{
    public function run(): void
    {
        $clients = User::where('role', 'client')->get();
        $elevators = Elevator::all();

        $requests = [
            [
                'investor_name' => 'Anna Nowak',
                'investor_email' => 'anna.nowak@budexpol.pl',
                'investor_company' => 'BUDEXPOL Sp. z o.o.',
                'investor_nip' => '5213456789',
                'investor_phone' => '+48 601 234 567',
                'investor_city' => 'Warszawa',
                'investment_name' => 'Apartamentowiec Wiśniowa',
                'investment_address' => 'ul. Wiśniowa 15, Warszawa',
                'floors' => 8,
                'stops' => 9,
                'lift_capacity' => 630,
                'shaft_width' => 1600,
                'shaft_depth' => 1950,
                'cabin_width' => 1100,
                'cabin_depth' => 1400,
                'cabin_height' => 2100,
                'pit_depth' => 1200,
                'overhead' => 3600,
                'drive_type' => 'elektryczny',
                'door_type' => 'Stalowe satynowe',
                'door_width' => 900,
                'door_height' => 2100,
                'handrail' => 'Chromowana prosta',
                'ceiling' => 'Stalowa satynowa',
                'lighting' => 'LED panelowe',
                'floor_material' => 'Gres porcelanowy',
                'control_panel' => 'Standardowy',
                'status' => 'offer_sent',
            ],
            [
                'investor_name' => 'Piotr Wiśniewski',
                'investor_email' => 'p.wisniewski@deweloper-premium.pl',
                'investor_company' => 'Deweloper Premium S.A.',
                'investor_phone' => '+48 602 345 678',
                'investor_city' => 'Poznań',
                'investment_name' => 'Biurowiec Premium Center',
                'investment_address' => 'ul. Centralna 8, Poznań',
                'floors' => 12,
                'stops' => 13,
                'lift_capacity' => 1000,
                'shaft_width' => 2100,
                'shaft_depth' => 1950,
                'cabin_width' => 1600,
                'cabin_depth' => 1400,
                'drive_type' => 'elektryczny',
                'door_type' => 'Szklane przejrzyste',
                'handrail' => 'Złota prosta',
                'ceiling' => 'Lustro',
                'lighting' => 'LED RGB',
                'floor_material' => 'Marmur',
                'control_panel' => 'Dotykowy LCD',
                'status' => 'accepted',
            ],
            [
                'investor_name' => 'Katarzyna Wójcik',
                'investor_email' => 'k.wojcik@archstudio.pl',
                'investor_company' => 'ArchStudio Projektowanie',
                'investor_phone' => '+48 603 456 789',
                'investor_city' => 'Kraków',
                'investment_name' => 'Osiedle Słoneczne - blok B',
                'investment_address' => 'ul. Słoneczna 22, Kraków',
                'floors' => 5,
                'stops' => 6,
                'lift_capacity' => 630,
                'drive_type' => 'elektryczny',
                'door_type' => 'Stalowe lakierowane',
                'handrail' => 'Satynowa prosta',
                'ceiling' => 'Lakierowana biała',
                'lighting' => 'LED punktowe',
                'floor_material' => 'PVC antypoślizgowa',
                'control_panel' => 'Standardowy',
                'status' => 'in_progress',
            ],
            [
                'investor_name' => 'Tomasz Kowalczyk',
                'investor_email' => 'tkowalczyk@spem.com.pl',
                'investor_company' => 'SPEM Nieruchomości',
                'investor_phone' => '+48 604 567 890',
                'investor_city' => 'Wrocław',
                'investment_name' => 'Galeria Handlowa Nowa',
                'investment_address' => 'ul. Handlowa 44, Wrocław',
                'floors' => 4,
                'stops' => 5,
                'lift_capacity' => 1000,
                'drive_type' => 'hydrauliczny',
                'status' => 'new',
            ],
            [
                'investor_name' => 'Małgorzata Kamińska',
                'investor_email' => 'mkaminska@hotelmanager.pl',
                'investor_company' => 'Hotel Manager Sp. z o.o.',
                'investor_phone' => '+48 605 678 901',
                'investor_city' => 'Gdańsk',
                'investment_name' => 'Hotel Bałtyk',
                'investment_address' => 'ul. Morska 1, Gdańsk',
                'floors' => 6,
                'stops' => 7,
                'lift_capacity' => 800,
                'drive_type' => 'elektryczny',
                'door_type' => 'Stalowe satynowe',
                'handrail' => 'Satynowa zaokrąglona',
                'ceiling' => 'Aluminiowa szczotkowana',
                'lighting' => 'LED taśmowe',
                'floor_material' => 'Granit naturalny',
                'control_panel' => 'Dotykowy TFT Premium',
                'status' => 'offer_sent',
            ],
            [
                'investor_name' => 'Andrzej Lewandowski',
                'investor_email' => 'a.lewandowski@polbud.pl',
                'investor_company' => 'POLBUD General Contractor',
                'investor_phone' => '+48 606 789 012',
                'investor_city' => 'Łódź',
                'investment_name' => 'Centrum Logistyczne Wschód',
                'floors' => 3,
                'stops' => 4,
                'lift_capacity' => 630,
                'drive_type' => 'elektryczny',
                'status' => 'rejected',
                'additional_notes' => 'Projekt anulowany z powodu zmiany planów inwestycyjnych.',
            ],
            [
                'investor_name' => 'Agnieszka Dąbrowska',
                'investor_email' => 'a.dabrowska@wm-bialystok.pl',
                'investor_company' => 'Wspólnota Mieszkaniowa Centrum',
                'investor_phone' => '+48 607 890 123',
                'investor_city' => 'Białystok',
                'investment_name' => 'Modernizacja bloku ul. Wspólna 7',
                'floors' => 10,
                'stops' => 11,
                'lift_capacity' => 630,
                'drive_type' => 'elektryczny',
                'door_type' => 'Stalowe lakierowane',
                'status' => 'new',
            ],
            [
                'investor_name' => 'Michał Zielński',
                'investor_email' => 'michal.zielinski@techbud.com',
                'investor_company' => 'TechBud Engineering',
                'investor_phone' => '+48 608 901 234',
                'investor_city' => 'Katowice',
                'investment_name' => 'Zakład Produkcyjny TechBud',
                'floors' => 4,
                'stops' => 5,
                'lift_capacity' => 800,
                'drive_type' => 'hydrauliczny',
                'status' => 'in_progress',
            ],
            // Additional requests
            [
                'investor_name' => 'Jan Kowalski',
                'investor_email' => 'jan.kowalski@example.com',
                'investor_city' => 'Lublin',
                'investment_name' => 'Dom wielorodzinny',
                'floors' => 4,
                'stops' => 5,
                'lift_capacity' => 450,
                'drive_type' => 'elektryczny',
                'status' => 'new',
            ],
            [
                'investor_name' => 'Maria Wiśniewska',
                'investor_email' => 'maria@budspol.pl',
                'investor_company' => 'BUDSPOL',
                'investor_city' => 'Szczecin',
                'investment_name' => 'Apartamenty Morskie',
                'floors' => 7,
                'stops' => 8,
                'lift_capacity' => 630,
                'drive_type' => 'elektryczny',
                'status' => 'new',
            ],
            [
                'investor_name' => 'Robert Kowalczyk',
                'investor_email' => 'robert.k@zarządca.pl',
                'investor_company' => 'Zarządca Nieruchomości Sp. z o.o.',
                'investor_city' => 'Rzeszów',
                'investment_name' => 'Rewitalizacja kamienicy',
                'floors' => 5,
                'stops' => 6,
                'lift_capacity' => 320,
                'drive_type' => 'elektryczny',
                'status' => 'in_progress',
            ],
            [
                'investor_name' => 'Elżbieta Nowakowska',
                'investor_email' => 'enowakowska@apartamenty.pl',
                'investor_company' => 'Apartamenty Premium',
                'investor_city' => 'Kraków',
                'investment_name' => 'Rezydencja Królewska',
                'floors' => 6,
                'stops' => 7,
                'lift_capacity' => 800,
                'drive_type' => 'elektryczny',
                'handrail' => 'Złota prosta',
                'ceiling' => 'Lustro',
                'floor_material' => 'Marmur',
                'control_panel' => 'Dotykowy LCD',
                'status' => 'offer_sent',
            ],
        ];

        $year = date('Y');
        $counter = 1;

        foreach ($requests as $requestData) {
            $user = $clients->firstWhere('email', $requestData['investor_email']);

            // Find matching elevator
            $elevator = null;
            if (!empty($requestData['lift_capacity'])) {
                $elevator = $elevators
                    ->filter(fn ($e) => $e->capacity >= $requestData['lift_capacity'])
                    ->sortBy('capacity')
                    ->first();
            }

            $requestNumber = sprintf('WPR-%s-%03d', $year, $counter++);

            QuoteRequest::create(array_merge($requestData, [
                'user_id' => $user?->id,
                'request_number' => $requestNumber,
                'elevator_id' => $elevator?->id,
                'raw_data' => $requestData,
            ]));
        }
    }
}
