<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quote_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('request_number')->unique();
            $table->enum('status', ['new', 'in_progress', 'offer_sent', 'accepted', 'rejected'])->default('new');
            $table->string('investor_name');
            $table->string('investor_email');
            $table->string('investor_phone')->nullable();
            $table->string('investor_company')->nullable();
            $table->string('investor_nip')->nullable();
            $table->string('investor_address')->nullable();
            $table->string('investor_city')->nullable();
            $table->string('investment_name')->nullable();
            $table->string('investment_address')->nullable();
            $table->integer('floors')->nullable();
            $table->integer('stops')->nullable();
            $table->integer('lift_capacity')->nullable();
            $table->integer('shaft_width')->nullable();
            $table->integer('shaft_depth')->nullable();
            $table->integer('cabin_width')->nullable();
            $table->integer('cabin_depth')->nullable();
            $table->integer('cabin_height')->nullable();
            $table->integer('pit_depth')->nullable();
            $table->integer('overhead')->nullable();
            $table->string('drive_type')->nullable();
            $table->string('door_type')->nullable();
            $table->integer('door_width')->nullable();
            $table->integer('door_height')->nullable();
            $table->string('handrail')->nullable();
            $table->string('ceiling')->nullable();
            $table->string('lighting')->nullable();
            $table->string('floor_material')->nullable();
            $table->string('control_panel')->nullable();
            $table->text('additional_notes')->nullable();
            $table->json('raw_data')->nullable();
            $table->foreignId('elevator_id')->nullable()->constrained('elevators')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quote_requests');
    }
};
