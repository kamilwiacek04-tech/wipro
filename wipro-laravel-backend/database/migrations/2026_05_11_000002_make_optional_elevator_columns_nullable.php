<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('elevators', function (Blueprint $table) {
            $table->integer('shaft_width')->nullable()->change();
            $table->integer('shaft_depth')->nullable()->change();
            $table->integer('pit_depth')->nullable()->change();
            $table->integer('overhead')->nullable()->change();
            $table->string('drive_type')->nullable()->change();
            $table->decimal('base_price', 10, 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('elevators', function (Blueprint $table) {
            $table->integer('shaft_width')->nullable(false)->change();
            $table->integer('shaft_depth')->nullable(false)->change();
            $table->integer('pit_depth')->nullable(false)->change();
            $table->integer('overhead')->nullable(false)->change();
            $table->string('drive_type')->nullable(false)->change();
            $table->decimal('base_price', 10, 2)->nullable(false)->change();
        });
    }
};
