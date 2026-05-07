<?php

namespace App\Filament\Resources\QuoteRequestResource\RelationManagers;

use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class OffersRelationManager extends RelationManager
{
    protected static string $relationship = 'offers';

    protected static ?string $title = 'Historia ofert';

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('offer_number')
                    ->label('Numer oferty')
                    ->disabled(),
                Forms\Components\Select::make('status')
                    ->label('Status')
                    ->options([
                        'draft' => 'Szkic',
                        'sent' => 'Wysłana',
                        'accepted' => 'Zaakceptowana',
                        'rejected' => 'Odrzucona',
                    ]),
                Forms\Components\TextInput::make('total_price_gross')
                    ->label('Wartość brutto')
                    ->numeric()
                    ->suffix('PLN'),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('offer_number')
                    ->label('Numer oferty')
                    ->weight('bold'),
                Tables\Columns\TextColumn::make('version')
                    ->label('Wer.'),
                Tables\Columns\BadgeColumn::make('status')
                    ->label('Status')
                    ->colors([
                        'gray' => 'draft',
                        'info' => 'sent',
                        'success' => 'accepted',
                        'danger' => 'rejected',
                    ])
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'draft' => 'Szkic',
                        'sent' => 'Wysłana',
                        'accepted' => 'Zaakceptowana',
                        'rejected' => 'Odrzucona',
                        default => $state,
                    }),
                Tables\Columns\TextColumn::make('total_price_net')
                    ->label('Netto')
                    ->money('PLN'),
                Tables\Columns\TextColumn::make('total_price_gross')
                    ->label('Brutto')
                    ->money('PLN'),
                Tables\Columns\TextColumn::make('valid_until')
                    ->label('Ważna do')
                    ->date('d.m.Y'),
                Tables\Columns\TextColumn::make('sent_at')
                    ->label('Wysłana')
                    ->dateTime('d.m.Y H:i')
                    ->placeholder('—'),
            ])
            ->headerActions([
                Tables\Actions\Action::make('generate_offer')
                    ->label('Generuj ofertę')
                    ->icon('heroicon-o-plus')
                    ->action(function () {
                        $service = new \App\Services\OfferService();
                        $offer = $service->generateOffer($this->getOwnerRecord());
                        $service->generatePdf($offer);

                        \Filament\Notifications\Notification::make()
                            ->title('Oferta nr ' . $offer->offer_number . ' wygenerowana')
                            ->success()
                            ->send();
                    }),
            ])
            ->actions([
                Tables\Actions\EditAction::make()->label('Edytuj'),
                Tables\Actions\DeleteAction::make()->label('Usuń'),
            ]);
    }
}
