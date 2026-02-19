<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sales_receipt_items', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('sales_receipt_id');
            $table->unsignedBigInteger('product_variant_id');
            $table->foreign('product_variant_id')->references('id')->on('product_variants')->cascadeOnDelete();

            $table->decimal('quantity', 18, 2)->default(0);
            $table->decimal('price', 18, 2)->default(0); // giá bán thực tế

            // Giá từ bảng giá (lưu lại để đối chiếu)
            $table->decimal('discount_amount', 18, 2)->default(0); // chiết khấu nếu có
            $table->decimal('discount_percent', 5, 2)->default(0); // % chiết khấu

            // Thuế đầu ra
            $table->unsignedBigInteger('output_tax_id')->nullable();
            $table->foreign('output_tax_id')->references('id')->on('vat_taxes')->nullOnDelete();

            $table->decimal('vat_amount', 18, 2)->default(0);
            $table->decimal('subtotal', 18, 2)->default(0);

            $table->timestamps();

            // Foreign keys
            $table->foreign('sales_receipt_id')
                ->references('id')
                ->on('sales_receipts')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_receipt_items');
    }
};