<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('receipt_vouchers', function (Blueprint $table) {
            $table->id();

            $table->string('code')->unique(); // PT0001
            $table->date('voucher_date');

            $table->unsignedBigInteger('customer_id');

            $table->decimal('amount', 18, 2)->default(0);

            $table->enum('payment_method', ['cash', 'bank']);

            $table->text('note')->nullable();

            $table->enum('status', ['draft', 'confirmed'])
                ->default('draft');

            $table->timestamps();

            $table->foreign('customer_id')
                ->references('id')
                ->on('customers');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receipt_vouchers');
    }
};