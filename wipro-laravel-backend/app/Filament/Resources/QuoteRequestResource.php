<?php

namespace App\Filament\Resources;

use App\Filament\Resources\QuoteRequestResource\Pages;
use App\Filament\Resources\QuoteRequestResource\RelationManagers;
use App\Models\Elevator;
use App\Models\QuoteRequest;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class QuoteRequestResource extends Resource
{
    protected static ?string $model = QuoteRequest::class;

    protected static ?string $navigationIcon = 'heroicon-o-inbox';

    protected static ?string $navigationLabel = 'Zapytania ofertowe';

    protected static ?string $modelLabel = 'Zapytanie';

    protected static ?string $pluralModelLabel = 'Zapytania ofertowe';

    protected static ?string $navigationGroup = 'Zapytania';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Informacje o zapytaniu')
                    ->schema([
                        Forms\Components\TextInput::make('request_number')
                            ->label('Numer zapytania')
                            ->disabled(),
                        Forms\Components\Select::make('status')
                            ->label('Status')
                            ->options([
                                'new' => 'Nowe',
                                'in_progress' => 'W trakcie',
                                'offer_sent' => 'Oferta wysłana',
                                'accepted' => 'Zaakceptowane',
                                'rejected' => 'Odrzucone',
                            ])
                            ->required(),
                        Forms\Components\Select::make('elevator_id')
                            ->label('Dopasowana winda')
                            ->options(Elevator::where('is_active', true)->pluck('model', 'id'))
                            ->searchable()
                            ->nullable(),
                    ])->columns(3),

                Forms\Components\Section::make('Dane inwestora')
                    ->schema([
                        Forms\Components\TextInput::make('investor_name')
                            ->label('Imię i nazwisko')
                            ->required(),
                        Forms\Components\TextInput::make('investor_email')
                            ->label('Email')
                            ->email()
                            ->required(),
                        Forms\Components\TextInput::make('investor_phone')
                            ->label('Telefon')
                            ->tel(),
                        Forms\Components\TextInput::make('investor_company')
                            ->label('Firma'),
                        Forms\Components\TextInput::make('investor_nip')
                            ->label('NIP'),
                        Forms\Components\TextInput::make('investor_address')
                            ->label('Adres'),
                        Forms\Components\TextInput::make('investor_city')
                            ->label('Miasto'),
                    ])->columns(2),

                Forms\Components\Section::make('Dane inwestycji')
                    ->schema([
                        Forms\Components\TextInput::make('investment_name')
                            ->label('Nazwa inwestycji'),
                        Forms\Components\TextInput::make('investment_address')
                            ->label('Adres inwestycji'),
                        Forms\Components\TextInput::make('floors')
                            ->label('Liczba kondygnacji')
                            ->numeric(),
                        Forms\Components\TextInput::make('stops')
                            ->label('Liczba przystanków')
                            ->numeric(),
                    ])->columns(2),

                Forms\Components\Section::make('Parametry szybu')
                    ->schema([
                        Forms\Components\TextInput::make('lift_capacity')
                            ->label('Nośność (kg)')
                            ->numeric()
                            ->suffix('kg'),
                        Forms\Components\TextInput::make('drive_type')
                            ->label('Rodzaj napędu'),
                        Forms\Components\TextInput::make('shaft_width')
                            ->label('Szerokość szybu (mm)')
                            ->numeric()
                            ->suffix('mm'),
                        Forms\Components\TextInput::make('shaft_depth')
                            ->label('Głębokość szybu (mm)')
                            ->numeric()
                            ->suffix('mm'),
                        Forms\Components\TextInput::make('cabin_width')
                            ->label('Szerokość kabiny (mm)')
                            ->numeric()
                            ->suffix('mm'),
                        Forms\Components\TextInput::make('cabin_depth')
                            ->label('Głębokość kabiny (mm)')
                            ->numeric()
                            ->suffix('mm'),
                        Forms\Components\TextInput::make('cabin_height')
                            ->label('Wysokość kabiny (mm)')
                            ->numeric()
                            ->suffix('mm'),
                        Forms\Components\TextInput::make('pit_depth')
                            ->label('Głębokość podszybia (mm)')
                            ->numeric()
                            ->suffix('mm'),
                        Forms\Components\TextInput::make('overhead')
                            ->label('Nadszybię (mm)')
                            ->numeric()
                            ->suffix('mm'),
                    ])->columns(3),

                Forms\Components\Section::make('Drzwi')
                    ->schema([
                        Forms\Components\TextInput::make('door_type')
                            ->label('Typ drzwi'),
                        Forms\Components\TextInput::make('door_width')
                            ->label('Szerokość drzwi (mm)')
                            ->numeric()
                            ->suffix('mm'),
                        Forms\Components\TextInput::make('door_height')
                            ->label('Wysokość drzwi (mm)')
                            ->numeric()
                            ->suffix('mm'),
                    ])->columns(3),

                Forms\Components\Section::make('Wykończenia')
                    ->schema([
                        Forms\Components\TextInput::make('handrail')
                            ->label('Poręcze'),
                        Forms\Components\TextInput::make('ceiling')
                            ->label('Podsufitka'),
                        Forms\Components\TextInput::make('lighting')
                            ->label('Oświetlenie'),
                        Forms\Components\TextInput::make('floor_material')
                            ->label('Podłoga'),
                        Forms\Components\TextInput::make('control_panel')
                            ->label('Panel sterowania'),
                    ])->columns(2),

                Forms\Components\Section::make('Uwagi')
                    ->schema([
                        Forms\Components\Textarea::make('additional_notes')
                            ->label('Dodatkowe uwagi')
                            ->rows(4),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('request_number')
                    ->label('Nr zapytania')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),
                Tables\Columns\TextColumn::make('investor_name')
                    ->label('Inwestor')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('investor_company')
                    ->label('Firma')
                    ->searchable()
                    ->placeholder('—'),
                Tables\Columns\TextColumn::make('investor_email')
                    ->label('Email')
                    ->searchable(),
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
                    ->label('Data złożenia')
                    ->dateTime('d.m.Y H:i')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('Status')
                    ->options([
                        'new' => 'Nowe',
                        'in_progress' => 'W trakcie',
                        'offer_sent' => 'Oferta wysłana',
                        'accepted' => 'Zaakceptowane',
                        'rejected' => 'Odrzucone',
                    ]),
                Tables\Filters\Filter::make('created_at')
                    ->form([
                        Forms\Components\DatePicker::make('created_from')->label('Od'),
                        Forms\Components\DatePicker::make('created_until')->label('Do'),
                    ])
                    ->query(function ($query, array $data) {
                        return $query
                            ->when($data['created_from'], fn ($q) => $q->whereDate('created_at', '>=', $data['created_from']))
                            ->when($data['created_until'], fn ($q) => $q->whereDate('created_at', '<=', $data['created_until']));
                    }),
            ])
            ->actions([
                Tables\Actions\ViewAction::make()->label('Podgląd'),
                Tables\Actions\EditAction::make()->label('Edytuj'),
                Tables\Actions\Action::make('generate_offer')
                    ->label('Generuj ofertę')
                    ->icon('heroicon-o-document-text')
                    ->color('success')
                    ->requiresConfirmation()
                    ->action(function (QuoteRequest $record) {
                        $service = new \App\Services\OfferService();
                        $offer = $service->generateOffer($record);
                        $service->generatePdf($offer);
                        $record->update(['status' => 'in_progress']);

                        \Filament\Notifications\Notification::make()
                            ->title('Oferta wygenerowana')
                            ->body('Oferta nr ' . $offer->offer_number . ' została utworzona.')
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
            RelationManagers\OffersRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListQuoteRequests::route('/'),
            'create' => Pages\CreateQuoteRequest::route('/create'),
            'view' => Pages\ViewQuoteRequest::route('/{record}'),
            'edit' => Pages\EditQuoteRequest::route('/{record}/edit'),
        ];
    }
}
