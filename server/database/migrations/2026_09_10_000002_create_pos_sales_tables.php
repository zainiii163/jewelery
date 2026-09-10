<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // POS sales (synced from desktop POS; distinct from online_orders)
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->bigInteger('ext_id');
            $table->string('invoice_id')->nullable();
            $table->string('customer_id')->nullable();
            $table->string('customer_name')->nullable();
            $table->date('sale_date');
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->decimal('total_discount', 14, 2)->default(0);
            $table->decimal('tax', 14, 2)->default(0);
            $table->decimal('total', 14, 2)->default(0);
            $table->decimal('paid', 14, 2)->default(0);
            $table->decimal('remaining', 14, 2)->default(0);
            $table->string('payment_method')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['shop_id', 'ext_id']);
            $table->index(['shop_id', 'sale_date']);
        });

        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->bigInteger('ext_id');
            $table->string('product_id')->nullable();
            $table->string('product_name');
            $table->decimal('gross_weight', 12, 3)->default(0);
            $table->decimal('net_weight', 12, 3)->default(0);
            $table->decimal('purity', 6, 2)->nullable();
            $table->integer('karat')->nullable();
            $table->decimal('gold_rate', 14, 2)->default(0);
            $table->decimal('metal_value', 14, 2)->default(0);
            $table->decimal('making_charges', 14, 2)->default(0);
            $table->decimal('stone_charges', 14, 2)->default(0);
            $table->decimal('discount', 14, 2)->default(0);
            $table->decimal('line_total', 14, 2)->default(0);
            $table->integer('quantity')->default(1);
            $table->timestamps();
            $table->unique(['sale_id', 'ext_id']);
        });

        // Purchases (synced from desktop POS)
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->bigInteger('ext_id');
            $table->string('purchase_id')->nullable();
            $table->string('supplier_id')->nullable();
            $table->string('supplier_name')->nullable();
            $table->string('product_id')->nullable();
            $table->string('product_name')->nullable();
            $table->date('purchase_date');
            $table->decimal('gross_weight', 12, 3)->default(0);
            $table->decimal('net_weight', 12, 3)->default(0);
            $table->decimal('purity', 6, 2)->nullable();
            $table->integer('karat')->nullable();
            $table->decimal('rate', 14, 2)->default(0);
            $table->decimal('making_charges', 14, 2)->default(0);
            $table->decimal('total_cost', 14, 2)->default(0);
            $table->decimal('paid', 14, 2)->default(0);
            $table->decimal('remaining', 14, 2)->default(0);
            $table->string('payment_method')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['shop_id', 'ext_id']);
            $table->index(['shop_id', 'purchase_date']);
        });

        // Customer payments (synced from desktop POS)
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->bigInteger('ext_id');
            $table->string('payment_id')->nullable();
            $table->string('customer_id')->nullable();
            $table->string('customer_name')->nullable();
            $table->date('payment_date');
            $table->decimal('amount', 14, 2)->default(0);
            $table->string('method')->nullable();
            $table->string('type')->nullable();
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['shop_id', 'ext_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('purchases');
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
    }
};