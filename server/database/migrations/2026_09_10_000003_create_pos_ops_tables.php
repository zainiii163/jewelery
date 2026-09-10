<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Customer ledger entries (synced from desktop POS)
        Schema::create('ledger_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->bigInteger('ext_id');
            $table->string('customer_id')->nullable();
            $table->string('customer_name')->nullable();
            $table->date('entry_date');
            $table->string('description')->nullable();
            $table->decimal('debit', 14, 2)->default(0);
            $table->decimal('credit', 14, 2)->default(0);
            $table->decimal('balance', 14, 2)->default(0);
            $table->string('source')->nullable();
            $table->string('reference_id')->nullable();
            $table->timestamps();
            $table->unique(['shop_id', 'ext_id']);
            $table->index(['shop_id', 'customer_id']);
        });

        // Expenses (synced from desktop POS)
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->bigInteger('ext_id');
            $table->string('expense_id')->nullable();
            $table->date('expense_date');
            $table->string('category');
            $table->string('description')->nullable();
            $table->decimal('amount', 14, 2)->default(0);
            $table->string('payment_method')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['shop_id', 'ext_id']);
            $table->index(['shop_id', 'expense_date']);
        });

        // Repairs (synced from desktop POS)
        Schema::create('repairs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->bigInteger('ext_id');
            $table->string('repair_id')->nullable();
            $table->string('customer_id')->nullable();
            $table->string('customer_name')->nullable();
            $table->string('product_id')->nullable();
            $table->string('product_name')->nullable();
            $table->string('problem')->nullable();
            $table->date('received_date')->nullable();
            $table->date('expected_date')->nullable();
            $table->decimal('estimated_charges', 14, 2)->default(0);
            $table->decimal('final_charges', 14, 2)->default(0);
            $table->string('employee')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->nullable();
            $table->timestamps();
            $table->unique(['shop_id', 'ext_id']);
        });

        // Exchanges (synced from desktop POS)
        Schema::create('exchanges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->bigInteger('ext_id');
            $table->string('exchange_id')->nullable();
            $table->string('customer_id')->nullable();
            $table->string('customer_name')->nullable();
            $table->date('exchange_date');
            $table->decimal('old_total_value', 14, 2)->default(0);
            $table->decimal('new_total_value', 14, 2)->default(0);
            $table->decimal('making_charges', 14, 2)->default(0);
            $table->decimal('stone_charges', 14, 2)->default(0);
            $table->decimal('discount', 14, 2)->default(0);
            $table->decimal('net_amount', 14, 2)->default(0);
            $table->decimal('cash_received', 14, 2)->default(0);
            $table->decimal('amount_due', 14, 2)->default(0);
            $table->string('payment_method')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['shop_id', 'ext_id']);
        });

        Schema::create('exchange_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exchange_id')->constrained()->cascadeOnDelete();
            $table->bigInteger('ext_id');
            $table->string('direction')->nullable();
            $table->string('metal_type')->nullable();
            $table->string('product_id')->nullable();
            $table->string('product_name')->nullable();
            $table->decimal('gross_weight', 12, 3)->default(0);
            $table->decimal('net_weight', 12, 3)->default(0);
            $table->decimal('purity', 6, 2)->nullable();
            $table->integer('karat')->nullable();
            $table->decimal('rate', 14, 2)->default(0);
            $table->decimal('metal_value', 14, 2)->default(0);
            $table->decimal('making_charges', 14, 2)->default(0);
            $table->decimal('stone_charges', 14, 2)->default(0);
            $table->decimal('line_total', 14, 2)->default(0);
            $table->timestamps();
            $table->unique(['exchange_id', 'ext_id']);
        });

        // Inventory movements (synced from desktop POS)
        Schema::create('inventory_moves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->bigInteger('ext_id');
            $table->string('product_id')->nullable();
            $table->string('product_name')->nullable();
            $table->date('move_date');
            $table->string('type')->nullable();
            $table->string('metal_type')->nullable();
            $table->decimal('weight', 12, 3)->default(0);
            $table->decimal('quantity', 10, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['shop_id', 'ext_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_moves');
        Schema::dropIfExists('exchange_items');
        Schema::dropIfExists('exchanges');
        Schema::dropIfExists('repairs');
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('ledger_entries');
    }
};