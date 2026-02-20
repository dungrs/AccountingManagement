<?php
// database/migrations/xxxx_xx_xx_create_inventory_tables.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Bảng giao dịch tồn kho
        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_variant_id');
            $table->enum('transaction_type', ['inbound', 'outbound']);
            $table->decimal('quantity', 18, 2);
            $table->decimal('unit_cost', 18, 2);
            $table->decimal('total_cost', 18, 2);
            
            $table->string('reference_type');
            $table->unsignedBigInteger('reference_id');
            
            $table->date('transaction_date');
            
            $table->decimal('before_quantity', 18, 2)->nullable();
            $table->decimal('before_value', 18, 2)->nullable();
            $table->decimal('after_quantity', 18, 2)->nullable();
            $table->decimal('after_value', 18, 2)->nullable();
            
            $table->text('note')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->foreign('product_variant_id')
                ->references('id')
                ->on('product_variants');
                
            $table->index(['reference_type', 'reference_id']);
            $table->index('transaction_date');
        });

        // Bảng tồn kho theo ngày
        Schema::create('inventory_balances', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_variant_id');
            $table->date('balance_date');
            $table->decimal('quantity', 18, 2);
            $table->decimal('value', 18, 2);
            $table->decimal('average_cost', 18, 2);
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->foreign('product_variant_id')
                ->references('id')
                ->on('product_variants');
                
            $table->unique(['product_variant_id', 'balance_date'], 'inventory_balance_unique');
        });
    }

    public function down()
    {
        Schema::dropIfExists('inventory_balances');
        Schema::dropIfExists('inventory_transactions');
    }
};