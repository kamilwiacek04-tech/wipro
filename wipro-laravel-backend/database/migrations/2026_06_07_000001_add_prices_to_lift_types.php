<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lift_types', function (Blueprint $table) {
            $table->decimal('base_price', 10, 2)->nullable()->after('is_active');
            $table->decimal('price_per_stop', 10, 2)->nullable()->after('base_price');
        });
    }

    public function down(): void
    {
        Schema::table('lift_types', function (Blueprint $table) {
            $table->dropColumn(['base_price', 'price_per_stop']);
        });
    }
};
