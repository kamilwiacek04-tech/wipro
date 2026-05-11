<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quote_requests', function (Blueprint $table) {
            $table->unsignedBigInteger('assigned_admin_id')->nullable()->after('user_id');
            $table->foreign('assigned_admin_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('quote_requests', function (Blueprint $table) {
            $table->dropForeign(['assigned_admin_id']);
            $table->dropColumn('assigned_admin_id');
        });
    }
};
