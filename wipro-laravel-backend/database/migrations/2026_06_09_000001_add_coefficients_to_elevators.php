<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('elevators', function (Blueprint $table) {
            $table->decimal('coeff_stops', 10, 4)->nullable()->after('drawing_throughway_doc');
            $table->decimal('coeff_cabin_model', 10, 4)->nullable()->after('coeff_stops');
            $table->decimal('coeff_cabin_throughway', 10, 4)->nullable()->after('coeff_cabin_model');
            $table->decimal('coeff_cabin_doors', 10, 4)->nullable()->after('coeff_cabin_throughway');
            $table->decimal('coeff_landing_doors', 10, 4)->nullable()->after('coeff_cabin_doors');
            $table->decimal('coeff_ei30', 10, 4)->nullable()->after('coeff_landing_doors');
            $table->decimal('coeff_ei60', 10, 4)->nullable()->after('coeff_ei30');
        });
    }

    public function down(): void
    {
        Schema::table('elevators', function (Blueprint $table) {
            $table->dropColumn([
                'coeff_stops', 'coeff_cabin_model', 'coeff_cabin_throughway',
                'coeff_cabin_doors', 'coeff_landing_doors', 'coeff_ei30', 'coeff_ei60',
            ]);
        });
    }
};
