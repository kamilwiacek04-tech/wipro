<?php

namespace App\Filament\Widgets;

use App\Models\QuoteRequest;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class RecentRequestsWidget extends BaseWidget
{
    protected static ?string $heading = 'Ostatnie zapytania';

    protected static ?int $sort = 3;

    protected int | string | array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->query(
                QuoteRequest::query()->latest()->limit(5)
            )
            ->columns([
                Tables\Columns\TextColumn::make('request_number')
                    ->label('Nr zapytania')
                    ->weight('bold'),
                Tables\Columns\TextColumn::make('investor_name')
                    ->label('Inwestor'),
                Tables\Columns\TextColumn::make('investor_company')
                    ->label('Firma')
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
                    ->dateTime('d.m.Y H:i'),
            ]);
    }
}
