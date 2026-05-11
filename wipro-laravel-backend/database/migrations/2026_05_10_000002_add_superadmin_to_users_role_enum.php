<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'client', 'superadmin') NOT NULL DEFAULT 'client'");
    }

    public function down(): void
    {
        DB::statement("UPDATE users SET role = 'admin' WHERE role = 'superadmin'");
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'client') NOT NULL DEFAULT 'client'");
    }
};
