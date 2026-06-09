<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cabin_colors', function (Blueprint $table) {
            $table->id();
            $table->string('name_pl');
            $table->string('name_en');
            $table->string('hex_color', 7)->nullable();
            $table->boolean('visible_for_cabin')->default(true);
            $table->boolean('visible_for_door')->default(true);
            $table->decimal('price_addition_cabin', 10, 2)->default(0);
            $table->decimal('price_addition_door', 10, 2)->default(0);
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cabin_colors');
    }
};
