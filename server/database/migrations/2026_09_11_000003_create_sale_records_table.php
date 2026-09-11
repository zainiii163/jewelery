<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sale_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('invoice_no')->nullable();
            $table->string('customer_name')->nullable();
            $table->string('customer_phone')->nullable();
            $table->date('sale_date');
            $table->decimal('sale_price', 14, 2)->default(0);
            $table->decimal('discount', 14, 2)->default(0);
            $table->decimal('final_price', 14, 2)->default(0);
            $table->decimal('amount_paid', 14, 2)->default(0);
            $table->decimal('amount_remaining', 14, 2)->default(0);
            $table->string('payment_method')->nullable();
            $table->text('notes')->nullable();
            $table->json('photos')->nullable();
            $table->timestamps();
            $table->index(['shop_id', 'sale_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_records');
    }
};
