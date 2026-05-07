<?php

namespace App\Filament\Resources\UserResource\RelationManagers;

use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class QuoteRequestsRelationManager extends RelationManager
{
    protected static string $relationship = 'quoteRequests';

    protected static ?string $title = 'Zapytania ofertowe';

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('request_number')
                    ->label('Numer zapytania')
                    ->disabled(),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('request_number')
                    ->label('Nr zapytania')
                    ->weight('bold'),
                Tables\Columns\TextColumn::make('investment_name')
                    ->label('Inwestycja')
                    ->placeholder('—'),
                Tables\Columns\TextColumn::make('lift_capacity')
                    ->label('Nośność')
                    ->suffix(' kg')
                    ->placeholder('—'),
                Tables\Columns\BadgeColumn::make('status')
                    ->label('Status')
                    ->colors([
                        'gray' => 'new',
                        'warning' => 'in_progress',
                        'info' => 'offer_sent',
                        'success' => 'accepted',
                        'danger' => 'rejected',
                    ])
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'new' => 'Nowe',
                        'in_progress' => 'W trakcie',
                        'offer_sent' => 'Oferta wysłana',
                        'accepted' => 'Zaakceptowane',
                        'rejected' => 'Odrzucone',
                        default => $state,
                    }),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Data')
                    ->dateTime('d.m.Y'),
            ])
            ->actions([
                Tables\Actions\ViewAction::make()->label('Podgląd')
                    ->url(fn ($record) => route('filament.admin.resources.quote-requests.view', $record)),
            ]);
    }
}
