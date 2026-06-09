<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cabin_colors', function (Blueprint $table) {
            $table->text('image_url')->nullable()->after('name_en');
            $table->dropColumn('hex_color');
        });
    }

    public function down(): void
    {
        Schema::table('cabin_colors', function (Blueprint $table) {
            $table->string('hex_color', 7)->nullable()->after('name_en');
            $table->dropColumn('image_url');
        });
    }
};
