<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ElevatorElementResource\Pages;
use App\Models\Elevator;
use App\Models\ElevatorElement;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class ElevatorElementResource extends Resource
{
    protected static ?string $model = ElevatorElement::class;

    protected static ?string $navigationIcon = 'heroicon-o-squares-2x2';

    protected static ?string $navigationLabel = 'Elementy wykończeń';

    protected static ?string $modelLabel = 'Element';

    protected static ?string $pluralModelLabel = 'Elementy wykończeń';

    protected static ?string $navigationGroup = 'Baza danych';

    protected static ?int $navigationSort = 3;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Select::make('elevator_id')
                    ->label('Winda (opcjonalnie)')
                    ->options(Elevator::all()->pluck('model', 'id'))
                    ->nullable()
                    ->placeholder('Dotyczy wszystkich wind'),
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
                Forms\Components\Textarea::make('description')
                    ->label('Opis')
                    ->rows(2),
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

    public static function table(Table $table): Table
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
                    ->badge()
                    ->sortable(),
                Tables\Columns\TextColumn::make('name')
                    ->label('Nazwa')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),
                Tables\Columns\TextColumn::make('elevator.model')
                    ->label('Winda')
                    ->placeholder('Wszystkie'),
                Tables\Columns\TextColumn::make('price')
                    ->label('Cena')
                    ->money('PLN')
                    ->sortable(),
                Tables\Columns\TextColumn::make('unit')
                    ->label('Jedn.'),
                Tables\Columns\IconColumn::make('is_active')
                    ->label('Aktywny')
                    ->boolean(),
            ])
            ->defaultSort('category')
            ->filters([
                Tables\Filters\SelectFilter::make('category')
                    ->label('Kategoria')
                    ->options([
                        'porecze' => 'Poręcze',
                        'podsufitki' => 'Podsufitki',
                        'oswietlenie' => 'Oświetlenie',
                        'podlogi' => 'Podłogi',
                        'drzwi' => 'Drzwi',
                        'panel_sterowania' => 'Panel sterowania',
                    ]),
                Tables\Filters\TernaryFilter::make('is_active')->label('Aktywne'),
            ])
            ->actions([
                Tables\Actions\EditAction::make()->label('Edytuj'),
                Tables\Actions\DeleteAction::make()->label('Usuń'),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListElevatorElements::route('/'),
            'create' => Pages\CreateElevatorElement::route('/create'),
            'edit' => Pages\EditElevatorElement::route('/{record}/edit'),
        ];
    }
}
