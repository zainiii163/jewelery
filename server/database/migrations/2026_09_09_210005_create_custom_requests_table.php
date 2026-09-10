<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('custom_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('jewellery_type')->nullable();
            $table->string('metal')->nullable(); // gold | silver
            $table->smallInteger('karat')->nullable();
            $table->decimal('budget', 14, 2)->nullable();
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->string('status')->default('New'); // New|Contacted|Quoted|Accepted|Declined
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_requests');
    }
};