<?php

namespace App\Filament\Resources\ElevatorElementResource\Pages;

use App\Filament\Resources\ElevatorElementResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditElevatorElement extends EditRecord
{
    protected static string $resource = ElevatorElementResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
