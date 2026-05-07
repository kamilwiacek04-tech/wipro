<?php

namespace App\Filament\Resources\ElevatorResource\Pages;

use App\Filament\Resources\ElevatorResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListElevators extends ListRecords
{
    protected static string $resource = ElevatorResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
