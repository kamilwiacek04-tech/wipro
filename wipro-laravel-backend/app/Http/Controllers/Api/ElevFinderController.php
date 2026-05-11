<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Elevator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ElevFinderController extends Controller
{
    public function find(Request $request): JsonResponse
    {
        $liftCapacity = $request->input('liftCapacity');
        $shaftLen     = $request->input('shaftLen'); // metres
        $shaftDep     = $request->input('shaftDep'); // metres

        if ($liftCapacity !== null) {
            return $this->findByCapacity((float) $liftCapacity);
        }

        if ($shaftLen !== null && $shaftDep !== null) {
            return $this->findByShaft((float) $shaftLen, (float) $shaftDep);
        }

        return response()->json([
            'status' => 0,
            'data'   => [],
            'error'  => 'Podaj udźwig lub wymiary szybu.',
        ]);
    }

    private function findByCapacity(float $kg): JsonResponse
    {
        $base = Elevator::where('is_active', true);

        // Primary: exact range ±50 % of requested capacity
        $elevators = (clone $base)
            ->whereBetween('capacity', [$kg * 0.5, $kg * 1.5])
            ->orderByRaw('ABS(capacity - ?)', [$kg])
            ->limit(8)
            ->get();

        // Fallback: absolute closest, no range limit
        if ($elevators->isEmpty()) {
            $elevators = (clone $base)
                ->orderByRaw('ABS(capacity - ?)', [$kg])
                ->limit(8)
                ->get();
        }

        if ($elevators->isEmpty()) {
            return response()->json([
                'status' => 1,
                'data'   => [],
                'info'   => 'Brak wind w bazie danych.',
            ]);
        }

        return response()->json([
            'status' => 2,
            'data'   => $this->map($elevators),
        ]);
    }

    private function findByShaft(float $lenM, float $depM): JsonResponse
    {
        $lenMm = $lenM * 1000;
        $depMm = $depM * 1000;

        $base = Elevator::where('is_active', true);

        // Primary: elevators that fit in the shaft (with 5 % tolerance)
        $elevators = (clone $base)
            ->where('shaft_width', '<=', $lenMm * 1.05)
            ->where('shaft_depth', '<=', $depMm * 1.05)
            ->orderByRaw('ABS(shaft_width - ?) + ABS(shaft_depth - ?)', [$lenMm, $depMm])
            ->limit(8)
            ->get();

        // Fallback: closest by shaft dimensions regardless of fit
        if ($elevators->isEmpty()) {
            $elevators = (clone $base)
                ->orderByRaw('ABS(shaft_width - ?) + ABS(shaft_depth - ?)', [$lenMm, $depMm])
                ->limit(8)
                ->get();
        }

        if ($elevators->isEmpty()) {
            return response()->json([
                'status' => 1,
                'data'   => [],
                'info'   => 'Brak wind w bazie danych.',
            ]);
        }

        return response()->json([
            'status' => 2,
            'data'   => $this->map($elevators),
        ]);
    }

    private function map($elevators): array
    {
        return $elevators->map(fn (Elevator $e) => [
            'id'              => $e->id,
            'udzwig'          => $e->capacity,
            'liczbaPasazerow' => (string) $e->persons,
            'model'           => $e->model,
            'manufacturer'    => $e->manufacturer,
            'opis'            => $e->description ?? '',
            'predkosc'        => number_format((float) $e->speed, 2, '.', ''),
        ])->values()->all();
    }
}
