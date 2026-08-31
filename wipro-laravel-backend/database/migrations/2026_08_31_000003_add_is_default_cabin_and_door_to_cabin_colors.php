<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cabin_colors', function (Blueprint $table) {
            $table->boolean('is_default_cabin')->default(false)->after('is_active');
            $table->boolean('is_default_door')->default(false)->after('is_default_cabin');
        });
    }

    public function down(): void
    {
        Schema::table('cabin_colors', function (Blueprint $table) {
            $table->dropColumn(['is_default_cabin', 'is_default_door']);
        });
    }
};
