<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'])) {
            DB::statement("ALTER TABLE quote_requests MODIFY object_type ENUM('residential', 'care_home', 'public_commercial') NULL DEFAULT 'public_commercial'");
        }
    }

    public function down(): void
    {
        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'])) {
            DB::statement("ALTER TABLE quote_requests MODIFY object_type ENUM('residential', 'care_home', 'public_commercial') NOT NULL DEFAULT 'public_commercial'");
        }
    }
};
