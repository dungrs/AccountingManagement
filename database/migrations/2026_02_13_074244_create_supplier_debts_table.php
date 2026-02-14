<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('supplier_debts', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('supplier_id');

            // Liên kết chứng từ gốc
            $table->string('reference_type'); // purchase_receipt, payment_voucher
            $table->unsignedBigInteger('reference_id');

            // Số tiền phát sinh
            $table->decimal('debit', 18, 2)->default(0);  // tăng công nợ
            $table->decimal('credit', 18, 2)->default(0); // giảm công nợ

            $table->date('transaction_date');

            $table->timestamps();

            $table->foreign('supplier_id')
                ->references('id')
                ->on('suppliers');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_debts');
    }
};