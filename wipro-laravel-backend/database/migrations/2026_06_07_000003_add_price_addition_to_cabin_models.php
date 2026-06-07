<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cabin_models', function (Blueprint $table) {
            $table->decimal('price_addition', 10, 2)->default(0)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('cabin_models', function (Blueprint $table) {
            $table->dropColumn('price_addition');
        });
    }
};
