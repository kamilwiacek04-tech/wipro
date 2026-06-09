<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quote_request_admin_shares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quote_request_id')->constrained('quote_requests')->cascadeOnDelete();
            $table->foreignId('admin_id')->constrained('users')->cascadeOnDelete();
            $table->unique(['quote_request_id', 'admin_id']);
            $table->timestamps();
        });

        Schema::table('quote_requests', function (Blueprint $table) {
            $table->dropForeign(['assigned_admin_id']);
            $table->dropColumn('assigned_admin_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quote_request_admin_shares');

        Schema::table('quote_requests', function (Blueprint $table) {
            $table->foreignId('assigned_admin_id')->nullable()->constrained('users')->nullOnDelete();
        });
    }
};
