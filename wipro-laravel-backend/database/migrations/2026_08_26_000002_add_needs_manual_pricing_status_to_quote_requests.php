<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE quote_requests MODIFY status ENUM('new', 'in_progress', 'offer_sent', 'accepted', 'rejected', 'needs_manual_pricing') DEFAULT 'new'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE quote_requests MODIFY status ENUM('new', 'in_progress', 'offer_sent', 'accepted', 'rejected') DEFAULT 'new'");
    }
};
