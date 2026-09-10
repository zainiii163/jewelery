<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->string('sku')->nullable();
            $table->string('name');
            $table->foreignId('category_id')->nullable()->constrained('product_categories')->nullOnDelete();
            $table->string('metal_type')->default('gold'); // gold | silver
            $table->decimal('purity', 6, 2)->nullable();    // 91.60 etc.
            $table->smallInteger('karat')->nullable();      // 24,22,21,18
            $table->decimal('gross_weight', 12, 3)->default(0);
            $table->decimal('net_weight', 12, 3)->default(0);
            $table->decimal('stone_weight', 12, 3)->default(0);
            $table->decimal('rate', 14, 2)->nullable();
            $table->decimal('making_charges', 14, 2)->default(0);
            $table->decimal('stone_charges', 14, 2)->default(0);
            $table->decimal('sale_price', 14, 2)->default(0);
            $table->decimal('purchase_cost', 14, 2)->default(0);
            $table->string('status')->default('In Stock');
            $table->boolean('published')->default(false);
            $table->boolean('featured')->default(false);
            $table->boolean('new_arrival')->default(false);
            $table->boolean('best_seller')->default(false);
            $table->integer('stock_qty')->default(1);
            $table->text('description')->nullable();
            $table->string('seo_title')->nullable();
            $table->string('seo_description')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->unique(['shop_id', 'sku']);
            $table->index(['shop_id', 'published', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};