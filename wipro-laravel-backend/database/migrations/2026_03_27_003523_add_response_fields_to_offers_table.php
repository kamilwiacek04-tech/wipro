<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('offers', function (Blueprint $table) {
            $table->string('response_token')->nullable()->unique()->after('sent_at');
            $table->enum('client_response', ['accepted', 'rejected'])->nullable()->after('response_token');
            $table->timestamp('client_responded_at')->nullable()->after('client_response');
        });
    }

    public function down(): void
    {
        Schema::table('offers', function (Blueprint $table) {
            $table->dropColumn(['response_token', 'client_response', 'client_responded_at']);
        });
    }
};
