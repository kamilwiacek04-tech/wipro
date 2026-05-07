<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quote_request_id')->constrained('quote_requests')->cascadeOnDelete();
            $table->string('offer_number')->unique();
            $table->integer('version')->default(1);
            $table->enum('status', ['draft', 'sent', 'accepted', 'rejected'])->default('draft');
            $table->date('valid_until')->nullable();
            $table->decimal('total_price_net', 10, 2);
            $table->decimal('total_price_gross', 10, 2);
            $table->decimal('vat_rate', 5, 2)->default(23.00);
            $table->text('notes')->nullable();
            $table->string('pdf_path')->nullable();
            $table->string('docx_path')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('offers');
    }
};
