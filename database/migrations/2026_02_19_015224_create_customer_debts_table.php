<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('customer_debts', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('customer_id');

            // Liên kết chứng từ gốc
            $table->string('reference_type'); // sales_receipt, receipt_voucher
            $table->unsignedBigInteger('reference_id');

            // Số tiền phát sinh
            $table->decimal('debit', 18, 2)->default(0);  // tăng công nợ (mua hàng)
            $table->decimal('credit', 18, 2)->default(0); // giảm công nợ (trả tiền)

            $table->date('transaction_date');

            $table->timestamps();

            $table->foreign('customer_id')
                ->references('id')
                ->on('customers');

            // Index để tìm kiếm nhanh
            $table->index(['customer_id', 'transaction_date']);
            $table->index(['reference_type', 'reference_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_debts');
    }
};