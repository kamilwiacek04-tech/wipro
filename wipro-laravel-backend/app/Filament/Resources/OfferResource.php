<?php

namespace App\Filament\Resources;

use App\Filament\Resources\OfferResource\Pages;
use App\Filament\Resources\OfferResource\RelationManagers;
use App\Models\Offer;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Storage;

class OfferResource extends Resource
{
    protected static ?string $model = Offer::class;

    protected static ?string $navigationIcon = 'heroicon-o-document-text';

    protected static ?string $navigationLabel = 'Oferty';

    protected static ?string $modelLabel = 'Oferta';

    protected static ?string $pluralModelLabel = 'Oferty';

    protected static ?string $navigationGroup = 'Zapytania';

    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Informacje o ofercie')
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
                            ])
                            ->required(),
                        Forms\Components\TextInput::make('version')
                            ->label('Wersja')
                            ->numeric()
                            ->disabled(),
                        Forms\Components\DatePicker::make('valid_until')
                            ->label('Ważna do'),
                    ])->columns(4),

                Forms\Components\Section::make('Wartości')
                    ->schema([
                        Forms\Components\TextInput::make('total_price_net')
                            ->label('Wartość netto (PLN)')
                            ->numeric()
                            ->suffix('PLN'),
                        Forms\Components\TextInput::make('vat_rate')
                            ->label('VAT (%)')
                            ->numeric()
                            ->suffix('%'),
                        Forms\Components\TextInput::make('total_price_gross')
                            ->label('Wartość brutto (PLN)')
                            ->numeric()
                            ->suffix('PLN'),
                    ])->columns(3),

                Forms\Components\Section::make('Uwagi')
                    ->schema([
                        Forms\Components\Textarea::make('notes')
                            ->label('Uwagi do oferty')
                            ->rows(3),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('offer_number')
                    ->label('Numer oferty')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),
                Tables\Columns\TextColumn::make('quoteRequest.investor_name')
                    ->label('Klient')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('quoteRequest.investor_company')
                    ->label('Firma')
                    ->placeholder('—'),
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
                Tables\Columns\TextColumn::make('total_price_gross')
                    ->label('Wartość brutto')
                    ->money('PLN')
                    ->sortable(),
                Tables\Columns\TextColumn::make('valid_until')
                    ->label('Ważna do')
                    ->date('d.m.Y')
                    ->sortable(),
                Tables\Columns\TextColumn::make('sent_at')
                    ->label('Wysłana')
                    ->dateTime('d.m.Y H:i')
                    ->placeholder('—'),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Utworzona')
                    ->dateTime('d.m.Y')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('Status')
                    ->options([
                        'draft' => 'Szkic',
                        'sent' => 'Wysłana',
                        'accepted' => 'Zaakceptowana',
                        'rejected' => 'Odrzucona',
                    ]),
            ])
            ->actions([
                Tables\Actions\ViewAction::make()->label('Podgląd'),
                Tables\Actions\EditAction::make()->label('Edytuj'),
                Tables\Actions\Action::make('download_pdf')
                    ->label('Pobierz PDF')
                    ->icon('heroicon-o-arrow-down-tray')
                    ->color('info')
                    ->url(fn (Offer $record): string => $record->pdf_path
                        ? Storage::url($record->pdf_path)
                        : '#'
                    )
                    ->openUrlInNewTab()
                    ->visible(fn (Offer $record): bool => !empty($record->pdf_path)),
                Tables\Actions\Action::make('generate_pdf')
                    ->label('Generuj PDF')
                    ->icon('heroicon-o-document')
                    ->color('success')
                    ->action(function (Offer $record) {
                        $service = new \App\Services\OfferService();
                        $service->generatePdf($record);

                        \Filament\Notifications\Notification::make()
                            ->title('PDF wygenerowany')
                            ->success()
                            ->send();
                    }),
                Tables\Actions\Action::make('send_offer')
                    ->label('Wyślij ofertę')
                    ->icon('heroicon-o-paper-airplane')
                    ->color('warning')
                    ->requiresConfirmation()
                    ->action(function (Offer $record) {
                        $record->update([
                            'status' => 'sent',
                            'sent_at' => now(),
                        ]);
                        $record->quoteRequest->update(['status' => 'offer_sent']);

                        \Filament\Notifications\Notification::make()
                            ->title('Oferta oznaczona jako wysłana')
                            ->success()
                            ->send();
                    }),
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
            RelationManagers\ItemsRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListOffers::route('/'),
            'create' => Pages\CreateOffer::route('/create'),
            'view' => Pages\ViewOffer::route('/{record}'),
            'edit' => Pages\EditOffer::route('/{record}/edit'),
        ];
    }
}
