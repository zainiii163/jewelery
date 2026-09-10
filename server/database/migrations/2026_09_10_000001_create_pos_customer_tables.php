<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Customers (synced from desktop POS)
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->bigInteger('ext_id');
            $table->string('customer_id')->nullable();
            $table->string('name');
            $table->string('father_name')->nullable();
            $table->string('cnic')->nullable();
            $table->string('mobile')->nullable();
            $table->string('whatsapp')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('email')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('total_amount', 14, 2)->default(0);
            $table->decimal('paid_amount', 14, 2)->default(0);
            $table->date('registered_date')->nullable();
            $table->timestamps();
            $table->unique(['shop_id', 'ext_id']);
        });

        // Daily gold/silver rates (synced from desktop POS)
        Schema::create('gold_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->bigInteger('ext_id');
            $table->date('rate_date');
            $table->decimal('rate24k', 14, 2)->default(0);
            $table->decimal('rate22k', 14, 2)->default(0);
            $table->decimal('rate21k', 14, 2)->default(0);
            $table->decimal('rate20k', 14, 2)->default(0);
            $table->decimal('rate18k', 14, 2)->default(0);
            $table->decimal('silver_rate', 14, 2)->default(0);
            $table->timestamps();
            $table->unique(['shop_id', 'ext_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gold_rates');
        Schema::dropIfExists('customers');
    }
};