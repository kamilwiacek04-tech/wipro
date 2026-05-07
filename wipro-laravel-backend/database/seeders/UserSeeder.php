<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin users
        User::create([
            'name' => 'Administrator WIPRO',
            'email' => 'admin@wipro-wind.pl',
            'password' => Hash::make('Admin@2024!'),
            'role' => 'admin',
            'is_active' => true,
            'company' => 'WIPRO Wind sp. z o.o.',
            'phone' => '+48 123 456 789',
            'city' => 'Warszawa',
        ]);

        User::create([
            'name' => 'Marek Kowalski',
            'email' => 'marek.kowalski@wipro-wind.pl',
            'password' => Hash::make('Admin@2024!'),
            'role' => 'admin',
            'is_active' => true,
            'company' => 'WIPRO Wind sp. z o.o.',
            'phone' => '+48 987 654 321',
            'city' => 'Warszawa',
        ]);

        // Client users with Polish companies
        $clients = [
            [
                'name' => 'Anna Nowak',
                'email' => 'anna.nowak@budexpol.pl',
                'company' => 'BUDEXPOL Sp. z o.o.',
                'nip' => '5213456789',
                'phone' => '+48 601 234 567',
                'address' => 'ul. Budowlana 12',
                'city' => 'Warszawa',
            ],
            [
                'name' => 'Piotr Wiśniewski',
                'email' => 'p.wisniewski@deweloper-premium.pl',
                'company' => 'Deweloper Premium S.A.',
                'nip' => '7811234567',
                'phone' => '+48 602 345 678',
                'address' => 'ul. Inwestycyjna 5',
                'city' => 'Poznań',
            ],
            [
                'name' => 'Katarzyna Wójcik',
                'email' => 'k.wojcik@archstudio.pl',
                'company' => 'ArchStudio Projektowanie',
                'nip' => '6471234567',
                'phone' => '+48 603 456 789',
                'address' => 'ul. Architektów 8',
                'city' => 'Kraków',
            ],
            [
                'name' => 'Tomasz Kowalczyk',
                'email' => 'tkowalczyk@spem.com.pl',
                'company' => 'SPEM Nieruchomości',
                'nip' => '9511234567',
                'phone' => '+48 604 567 890',
                'address' => 'ul. Handlowa 22',
                'city' => 'Wrocław',
            ],
            [
                'name' => 'Małgorzata Kamińska',
                'email' => 'mkaminska@hotelmanager.pl',
                'company' => 'Hotel Manager Sp. z o.o.',
                'nip' => '5271234567',
                'phone' => '+48 605 678 901',
                'address' => 'ul. Hotelowa 1',
                'city' => 'Gdańsk',
            ],
            [
                'name' => 'Andrzej Lewandowski',
                'email' => 'a.lewandowski@polbud.pl',
                'company' => 'POLBUD General Contractor',
                'nip' => '7221234567',
                'phone' => '+48 606 789 012',
                'address' => 'ul. Generalna 44',
                'city' => 'Łódź',
            ],
            [
                'name' => 'Agnieszka Dąbrowska',
                'email' => 'a.dabrowska@wm-bialystok.pl',
                'company' => 'Wspólnota Mieszkaniowa Centrum',
                'nip' => '5421234567',
                'phone' => '+48 607 890 123',
                'address' => 'ul. Wspólna 7',
                'city' => 'Białystok',
            ],
            [
                'name' => 'Michał Zielński',
                'email' => 'michal.zielinski@techbud.com',
                'company' => 'TechBud Engineering',
                'nip' => '7771234567',
                'phone' => '+48 608 901 234',
                'address' => 'ul. Techniczna 33',
                'city' => 'Katowice',
            ],
        ];

        foreach ($clients as $client) {
            User::create(array_merge($client, [
                'password' => Hash::make('Klient@2024!'),
                'role' => 'client',
                'is_active' => true,
            ]));
        }
    }
}
