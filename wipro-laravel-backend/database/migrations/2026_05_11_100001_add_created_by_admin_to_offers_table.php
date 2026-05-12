<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('offers', function (Blueprint $table) {
            $table->foreignId('created_by_admin_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
        });

        // Make quote_request_id nullable for standalone offers
        Schema::table('offers', function (Blueprint $table) {
            $table->dropForeign(['quote_request_id']);
        });
        DB::statement('ALTER TABLE offers MODIFY COLUMN quote_request_id BIGINT UNSIGNED NULL');
        Schema::table('offers', function (Blueprint $table) {
            $table->foreign('quote_request_id')->references('id')->on('quote_requests')->nullOnDelete();
        });

        // Add client fields for standalone offers
        Schema::table('offers', function (Blueprint $table) {
            $table->string('client_name')->nullable()->after('notes');
            $table->string('client_email')->nullable()->after('client_name');
        });
    }

    public function down(): void
    {
        Schema::table('offers', function (Blueprint $table) {
            $table->dropForeign(['created_by_admin_id']);
            $table->dropColumn(['created_by_admin_id', 'client_name', 'client_email']);
        });

        // Restore quote_request_id as not nullable
        Schema::table('offers', function (Blueprint $table) {
            $table->dropForeign(['quote_request_id']);
        });
        DB::statement('ALTER TABLE offers MODIFY COLUMN quote_request_id BIGINT UNSIGNED NOT NULL');
        Schema::table('offers', function (Blueprint $table) {
            $table->foreign('quote_request_id')->references('id')->on('quote_requests')->cascadeOnDelete();
        });
    }
};
