<?php

namespace Tests\Unit;

use App\Models\Elevator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ElevatorUnitConversionTest extends TestCase
{
    use RefreshDatabase;

    private function baseAttrs(): array
    {
        return [
            'model' => 'E-400',
            'manufacturer' => 'WIPRO',
            'capacity' => 400,
            'persons' => 5,
            'cabin_width' => 100,
            'cabin_depth' => 100,
            'cabin_height' => 210,
            'speed' => 1.0,
            'max_stops' => 8,
        ];
    }

    public function test_dimensions_are_stored_as_mm_but_exposed_as_cm(): void
    {
        $elevator = Elevator::create($this->baseAttrs() + [
            'shaft_width' => 125,
            'shaft_depth' => 135,
            'pit_depth' => 110,
            'overhead' => 340,
            'door_width' => 80,
            'door_height' => 200,
        ]);

        $this->assertSame(125, $elevator->shaft_width);
        $this->assertSame(135, $elevator->shaft_depth);
        $this->assertSame(110, $elevator->pit_depth);
        $this->assertSame(340, $elevator->overhead);
        $this->assertSame(100, $elevator->cabin_width);
        $this->assertSame(100, $elevator->cabin_depth);
        $this->assertSame(210, $elevator->cabin_height);
        $this->assertSame(80, $elevator->door_width);
        $this->assertSame(200, $elevator->door_height);

        $rawMm = \DB::table('elevators')->where('id', $elevator->id)->first();
        $this->assertSame(1250, $rawMm->shaft_width);
        $this->assertSame(1350, $rawMm->shaft_depth);
        $this->assertSame(1100, $rawMm->pit_depth);
        $this->assertSame(3400, $rawMm->overhead);
        $this->assertSame(1000, $rawMm->cabin_width);
        $this->assertSame(800, $rawMm->door_width);
        $this->assertSame(2000, $rawMm->door_height);
    }

    public function test_null_dimensions_stay_null_through_the_conversion(): void
    {
        $elevator = Elevator::create($this->baseAttrs());

        $this->assertNull($elevator->shaft_width);
        $this->assertNull($elevator->pit_depth);
        $this->assertNull($elevator->overhead);
    }

    public function test_legacy_mm_row_reads_back_as_cm(): void
    {
        $id = \DB::table('elevators')->insertGetId(array_merge($this->baseAttrs(), [
            'shaft_width' => 1250,
            'shaft_depth' => 1350,
            'pit_depth' => 1100,
            'overhead' => 3400,
            'cabin_width' => 780,
            'cabin_depth' => 1000,
            'cabin_height' => 2100,
            'created_at' => now(),
            'updated_at' => now(),
        ]));

        $elevator = Elevator::find($id);

        $this->assertSame(125, $elevator->shaft_width);
        $this->assertSame(340, $elevator->overhead);
        $this->assertSame(78, $elevator->cabin_width);
    }
}
