<?php

namespace App\Filament\Widgets;

use App\Models\QuoteRequest;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Carbon;

class QuoteRequestsChartWidget extends ChartWidget
{
    protected static ?string $heading = 'Zapytania ofertowe - ostatnie 6 miesięcy';

    protected static ?int $sort = 2;

    protected function getData(): array
    {
        $data = [];
        $labels = [];

        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $labels[] = $date->translatedFormat('M Y');
            $data[] = QuoteRequest::whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->count();
        }

        return [
            'datasets' => [
                [
                    'label' => 'Zapytania',
                    'data' => $data,
                    'backgroundColor' => 'rgba(255, 180, 0, 0.2)',
                    'borderColor' => '#ffb400',
                    'borderWidth' => 2,
                    'fill' => true,
                ],
            ],
            'labels' => $labels,
        ];
    }

    protected function getType(): string
    {
        return 'bar';
    }
}
