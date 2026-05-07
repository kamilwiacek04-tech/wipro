<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ElevatorResource\Pages;
use App\Filament\Resources\ElevatorResource\RelationManagers;
use App\Models\Elevator;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class ElevatorResource extends Resource
{
    protected static ?string $model = Elevator::class;

    protected static ?string $navigationIcon = 'heroicon-o-cog-8-tooth';

    protected static ?string $navigationLabel = 'Windy';

    protected static ?string $modelLabel = 'Winda';

    protected static ?string $pluralModelLabel = 'Windy';

    protected static ?string $navigationGroup = 'Baza danych';

    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Podstawowe informacje')
                    ->schema([
                        Forms\Components\TextInput::make('model')
                            ->label('Model')
                            ->required(),
                        Forms\Components\TextInput::make('manufacturer')
                            ->label('Producent')
                            ->default('WIPRO')
                            ->required(),
                        Forms\Components\TextInput::make('drive_type')
                            ->label('Typ napędu')
                            ->required(),
                        Forms\Components\TextInput::make('max_stops')
                            ->label('Maks. przystanki')
                            ->numeric()
                            ->required(),
                        Forms\Components\TextInput::make('base_price')
                            ->label('Cena bazowa (PLN)')
                            ->numeric()
                            ->suffix('PLN')
                            ->required(),
                        Forms\Components\Toggle::make('is_active')
                            ->label('Aktywna')
                            ->default(true),
                    ])->columns(3),

                Forms\Components\Section::make('Parametry techniczne')
                    ->schema([
                        Forms\Components\TextInput::make('capacity')
                            ->label('Nośność (kg)')
                            ->numeric()
                            ->suffix('kg')
                            ->required(),
                        Forms\Components\TextInput::make('persons')
                            ->label('Liczba osób')
                            ->numeric()
                            ->required(),
                        Forms\Components\TextInput::make('speed')
                            ->label('Prędkość (m/s)')
                            ->numeric()
                            ->suffix('m/s')
                            ->required(),
                    ])->columns(3),

                Forms\Components\Section::make('Wymiary kabiny (mm)')
                    ->schema([
                        Forms\Components\TextInput::make('cabin_width')
                            ->label('Szerokość')
                            ->numeric()
                            ->suffix('mm')
                            ->required(),
                        Forms\Components\TextInput::make('cabin_depth')
                            ->label('Głębokość')
                            ->numeric()
                            ->suffix('mm')
                            ->required(),
                        Forms\Components\TextInput::make('cabin_height')
                            ->label('Wysokość')
                            ->numeric()
                            ->suffix('mm')
                            ->required(),
                    ])->columns(3),

                Forms\Components\Section::make('Wymiary szybu (mm)')
                    ->schema([
                        Forms\Components\TextInput::make('shaft_width')
                            ->label('Szerokość szybu')
                            ->numeric()
                            ->suffix('mm')
                            ->required(),
                        Forms\Components\TextInput::make('shaft_depth')
                            ->label('Głębokość szybu')
                            ->numeric()
                            ->suffix('mm')
                            ->required(),
                        Forms\Components\TextInput::make('pit_depth')
                            ->label('Głębokość podszybia')
                            ->numeric()
                            ->suffix('mm')
                            ->required(),
                        Forms\Components\TextInput::make('overhead')
                            ->label('Nadszybię')
                            ->numeric()
                            ->suffix('mm')
                            ->required(),
                    ])->columns(4),

                Forms\Components\Section::make('Opis')
                    ->schema([
                        Forms\Components\Textarea::make('description')
                            ->label('Opis')
                            ->rows(3),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('model')
                    ->label('Model')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),
                Tables\Columns\TextColumn::make('manufacturer')
                    ->label('Producent'),
                Tables\Columns\TextColumn::make('capacity')
                    ->label('Nośność')
                    ->suffix(' kg')
                    ->sortable(),
                Tables\Columns\TextColumn::make('persons')
                    ->label('Osoby')
                    ->suffix(' os.'),
                Tables\Columns\TextColumn::make('drive_type')
                    ->label('Napęd'),
                Tables\Columns\TextColumn::make('speed')
                    ->label('Prędkość')
                    ->suffix(' m/s'),
                Tables\Columns\TextColumn::make('base_price')
                    ->label('Cena bazowa')
                    ->money('PLN')
                    ->sortable(),
                Tables\Columns\IconColumn::make('is_active')
                    ->label('Aktywna')
                    ->boolean(),
            ])
            ->filters([
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

    public static function getRelationManagers(): array
    {
        return [
            RelationManagers\ElementsRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListElevators::route('/'),
            'create' => Pages\CreateElevator::route('/create'),
            'edit' => Pages\EditElevator::route('/{record}/edit'),
        ];
    }
}
