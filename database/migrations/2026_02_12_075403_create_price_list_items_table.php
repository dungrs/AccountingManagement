<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('price_list_items', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('price_list_id');
            $table->foreign('price_list_id')->references('id')->on('price_lists')->cascadeOnDelete();

            $table->unsignedBigInteger('product_variant_id');
            $table->foreign('product_variant_id')->references('id')->on('product_variants')->cascadeOnDelete();

            $table->decimal('sale_price', 15, 2)->default(0);

            // Thuế đầu ra
            $table->unsignedBigInteger('output_tax_id')->nullable();
            $table->foreign('output_tax_id')->references('id')->on('vat_taxes')->nullOnDelete();

            $table->tinyInteger('publish')->default(1);
            $table->timestamps();

            $table->unique(['price_list_id', 'product_variant_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('price_list_items');
    }
};
