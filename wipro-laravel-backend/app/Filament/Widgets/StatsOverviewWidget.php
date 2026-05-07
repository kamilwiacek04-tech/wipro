<?php

namespace App\Filament\Widgets;

use App\Models\Offer;
use App\Models\QuoteRequest;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsOverviewWidget extends BaseWidget
{
    protected function getStats(): array
    {
        $totalThisMonth = QuoteRequest::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $pending = QuoteRequest::whereIn('status', ['new', 'in_progress'])->count();

        $offersSent = Offer::where('status', 'sent')
            ->orWhere('status', 'accepted')
            ->count();

        $accepted = QuoteRequest::where('status', 'accepted')->count();

        return [
            Stat::make('Zapytania w tym miesiącu', $totalThisMonth)
                ->description('Nowe zapytania')
                ->descriptionIcon('heroicon-m-arrow-trending-up')
                ->color('warning'),

            Stat::make('Oczekujące zapytania', $pending)
                ->description('Do obsłużenia')
                ->descriptionIcon('heroicon-m-clock')
                ->color('warning'),

            Stat::make('Wysłane oferty', $offersSent)
                ->description('Łącznie')
                ->descriptionIcon('heroicon-m-document-text')
                ->color('info'),

            Stat::make('Zaakceptowane', $accepted)
                ->description('Zamknięte pozytywnie')
                ->descriptionIcon('heroicon-m-check-circle')
                ->color('success'),
        ];
    }
}
