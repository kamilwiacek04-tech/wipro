<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('elevators', function (Blueprint $table) {
            // Technical description fields
            $table->string('standards')->nullable()->after('description');
            $table->string('machine_room')->nullable()->after('standards');
            $table->decimal('lifting_height', 4, 2)->nullable()->after('machine_room');
            $table->integer('door_width')->nullable()->after('lifting_height');
            $table->integer('door_height')->nullable()->after('door_width');
            $table->string('door_fire_class')->nullable()->after('door_height');
            $table->string('shaft_construction')->nullable()->after('door_fire_class');
            $table->string('shaft_ventilation')->nullable()->after('shaft_construction');
            $table->string('shaft_temperature')->nullable()->after('shaft_ventilation');
            $table->string('installation_type')->nullable()->after('shaft_temperature');
            $table->string('cabin_finish')->nullable()->after('installation_type');
            $table->string('cabin_door_finish')->nullable()->after('cabin_finish');
            $table->string('landing_door_finish')->nullable()->after('cabin_door_finish');
            $table->text('equipment')->nullable()->after('landing_door_finish');
            // Drawing file paths
            $table->string('drawing_standard_pdf')->nullable()->after('equipment');
            $table->string('drawing_standard_dwg')->nullable()->after('drawing_standard_pdf');
            $table->string('drawing_standard_bim')->nullable()->after('drawing_standard_dwg');
            $table->text('drawing_standard_doc')->nullable()->after('drawing_standard_bim');
            $table->string('drawing_throughway_pdf')->nullable()->after('drawing_standard_doc');
            $table->string('drawing_throughway_dwg')->nullable()->after('drawing_throughway_pdf');
            $table->string('drawing_throughway_bim')->nullable()->after('drawing_throughway_dwg');
            $table->text('drawing_throughway_doc')->nullable()->after('drawing_throughway_bim');
        });
    }

    public function down(): void
    {
        Schema::table('elevators', function (Blueprint $table) {
            $table->dropColumn([
                'standards', 'machine_room', 'lifting_height', 'door_width', 'door_height',
                'door_fire_class', 'shaft_construction', 'shaft_ventilation', 'shaft_temperature',
                'installation_type', 'cabin_finish', 'cabin_door_finish', 'landing_door_finish',
                'equipment', 'drawing_standard_pdf', 'drawing_standard_dwg', 'drawing_standard_bim',
                'drawing_standard_doc', 'drawing_throughway_pdf', 'drawing_throughway_dwg',
                'drawing_throughway_bim', 'drawing_throughway_doc',
            ]);
        });
    }
};
