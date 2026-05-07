<?php

namespace App\Filament\Resources\ElevatorResource\RelationManagers;

use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class ElementsRelationManager extends RelationManager
{
    protected static string $relationship = 'elements';

    protected static ?string $title = 'Elementy wykończeń';

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Select::make('category')
                    ->label('Kategoria')
                    ->options([
                        'porecze' => 'Poręcze',
                        'podsufitki' => 'Podsufitki',
                        'oswietlenie' => 'Oświetlenie',
                        'podlogi' => 'Podłogi',
                        'drzwi' => 'Drzwi',
                        'panel_sterowania' => 'Panel sterowania',
                    ])
                    ->required(),
                Forms\Components\TextInput::make('name')
                    ->label('Nazwa')
                    ->required(),
                Forms\Components\TextInput::make('price')
                    ->label('Cena (PLN)')
                    ->numeric()
                    ->suffix('PLN')
                    ->required(),
                Forms\Components\TextInput::make('unit')
                    ->label('Jednostka')
                    ->default('szt'),
                Forms\Components\Toggle::make('is_active')
                    ->label('Aktywny')
                    ->default(true),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('category')
                    ->label('Kategoria')
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'porecze' => 'Poręcze',
                        'podsufitki' => 'Podsufitki',
                        'oswietlenie' => 'Oświetlenie',
                        'podlogi' => 'Podłogi',
                        'drzwi' => 'Drzwi',
                        'panel_sterowania' => 'Panel sterowania',
                        default => $state,
                    })
                    ->badge(),
                Tables\Columns\TextColumn::make('name')
                    ->label('Nazwa')
                    ->searchable(),
                Tables\Columns\TextColumn::make('price')
                    ->label('Cena')
                    ->money('PLN'),
                Tables\Columns\IconColumn::make('is_active')
                    ->label('Aktywny')
                    ->boolean(),
            ])
            ->headerActions([
                Tables\Actions\CreateAction::make()->label('Dodaj element'),
            ])
            ->actions([
                Tables\Actions\EditAction::make()->label('Edytuj'),
                Tables\Actions\DeleteAction::make()->label('Usuń'),
            ]);
    }
}
