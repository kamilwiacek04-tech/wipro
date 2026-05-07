<?php

namespace App\Filament\Resources\ElevatorElementResource\Pages;

use App\Filament\Resources\ElevatorElementResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListElevatorElements extends ListRecords
{
    protected static string $resource = ElevatorElementResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
