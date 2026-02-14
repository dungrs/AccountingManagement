<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payment_vouchers', function (Blueprint $table) {
            $table->id();

            $table->string('code')->unique(); // PC0001
            $table->date('payment_date');

            $table->unsignedBigInteger('supplier_id');

            $table->decimal('amount', 18, 2)->default(0);

            $table->enum('payment_method', ['cash', 'bank']);

            $table->text('note')->nullable();

            $table->enum('status', ['draft', 'confirmed'])
                ->default('draft');

            $table->timestamps();

            $table->foreign('supplier_id')
                ->references('id')
                ->on('suppliers');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_vouchers');
    }
};
