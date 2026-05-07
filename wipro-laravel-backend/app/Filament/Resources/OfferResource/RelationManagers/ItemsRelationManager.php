<?php

namespace App\Filament\Resources\OfferResource\RelationManagers;

use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class ItemsRelationManager extends RelationManager
{
    protected static string $relationship = 'items';

    protected static ?string $title = 'Pozycje oferty';

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('description')
                    ->label('Opis')
                    ->required()
                    ->columnSpanFull(),
                Forms\Components\TextInput::make('quantity')
                    ->label('Ilość')
                    ->numeric()
                    ->default(1)
                    ->required(),
                Forms\Components\TextInput::make('unit')
                    ->label('Jednostka')
                    ->default('szt'),
                Forms\Components\TextInput::make('unit_price_net')
                    ->label('Cena jedn. netto (PLN)')
                    ->numeric()
                    ->suffix('PLN')
                    ->required()
                    ->live()
                    ->afterStateUpdated(function ($state, Forms\Set $set, Forms\Get $get) {
                        $set('total_price_net', (float)$state * (float)($get('quantity') ?? 1));
                    }),
                Forms\Components\TextInput::make('total_price_net')
                    ->label('Wartość netto (PLN)')
                    ->numeric()
                    ->suffix('PLN')
                    ->required(),
                Forms\Components\TextInput::make('sort_order')
                    ->label('Kolejność')
                    ->numeric()
                    ->default(0),
            ])->columns(3);
    }

    public function table(Table $table): Table
    {
        return $table
            ->reorderable('sort_order')
            ->columns([
                Tables\Columns\TextColumn::make('sort_order')
                    ->label('Lp.')
                    ->sortable(),
                Tables\Columns\TextColumn::make('description')
                    ->label('Opis')
                    ->wrap(),
                Tables\Columns\TextColumn::make('quantity')
                    ->label('Ilość'),
                Tables\Columns\TextColumn::make('unit')
                    ->label('Jedn.'),
                Tables\Columns\TextColumn::make('unit_price_net')
                    ->label('Cena jedn. netto')
                    ->money('PLN'),
                Tables\Columns\TextColumn::make('total_price_net')
                    ->label('Wartość netto')
                    ->money('PLN')
                    ->weight('bold'),
            ])
            ->headerActions([
                Tables\Actions\CreateAction::make()->label('Dodaj pozycję'),
            ])
            ->actions([
                Tables\Actions\EditAction::make()->label('Edytuj'),
                Tables\Actions\DeleteAction::make()->label('Usuń'),
            ]);
    }
}
