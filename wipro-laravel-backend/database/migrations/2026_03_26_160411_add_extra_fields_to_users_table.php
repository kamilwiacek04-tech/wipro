<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->string('company')->nullable()->after('phone');
            $table->string('nip')->nullable()->after('company');
            $table->string('address')->nullable()->after('nip');
            $table->string('city')->nullable()->after('address');
            $table->enum('role', ['admin', 'client'])->default('client')->after('city');
            $table->boolean('is_active')->default(true)->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'company', 'nip', 'address', 'city', 'role', 'is_active']);
        });
    }
};
