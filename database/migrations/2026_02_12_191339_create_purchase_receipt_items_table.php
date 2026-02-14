<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('purchase_receipt_items', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('purchase_receipt_id');
            $table->unsignedBigInteger('product_variant_id');
            $table->foreign('product_variant_id')->references('id')->on('product_variants')->cascadeOnDelete();

            $table->decimal('quantity', 18, 2)->default(0);
            $table->decimal('price', 18, 2)->default(0);

            // Thuế đầu vào
            $table->unsignedBigInteger('input_tax_id')->nullable();
            $table->foreign('input_tax_id')->references('id')->on('vat_taxes')->nullOnDelete();

            $table->decimal('vat_amount', 18, 2)->default(0);
            $table->decimal('subtotal', 18, 2)->default(0);

            $table->timestamps();

            // Foreign keys
            $table->foreign('purchase_receipt_id')
                ->references('id')
                ->on('purchase_receipts')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_receipt_items');
    }
};