<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cabin_types', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('name_pl');
            $table->string('name_en');
            $table->string('image_right_url')->nullable();
            $table->string('image_left_url')->nullable();
            $table->decimal('price', 10, 2)->default(0);
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cabin_types');
    }
};
