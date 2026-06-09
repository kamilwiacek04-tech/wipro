<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cabin_accessories', function (Blueprint $table) {
            $table->boolean('multiply_by_access_count')->default(false)->after('price_addition');
        });
    }

    public function down(): void
    {
        Schema::table('cabin_accessories', function (Blueprint $table) {
            $table->dropColumn('multiply_by_access_count');
        });
    }
};
