<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'])) {
            DB::statement("ALTER TABLE offers MODIFY COLUMN status ENUM('draft','sent','accepted','rejected','cancelled') NOT NULL DEFAULT 'draft'");
        }
    }

    public function down(): void
    {
        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'])) {
            DB::statement("ALTER TABLE offers MODIFY COLUMN status ENUM('draft','sent','accepted','rejected') NOT NULL DEFAULT 'draft'");
        }
    }
};
