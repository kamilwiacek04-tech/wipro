<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('elevators', function (Blueprint $table) {
            $table->id();
            $table->string('model');
            $table->string('manufacturer')->default('WIPRO');
            $table->integer('capacity');
            $table->integer('persons');
            $table->integer('cabin_width');
            $table->integer('cabin_depth');
            $table->integer('cabin_height');
            $table->integer('shaft_width');
            $table->integer('shaft_depth');
            $table->integer('pit_depth');
            $table->integer('overhead');
            $table->decimal('speed', 3, 1);
            $table->string('drive_type');
            $table->integer('max_stops');
            $table->decimal('base_price', 10, 2);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('elevators');
    }
};
