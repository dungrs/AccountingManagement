<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('purchase_receipts', function (Blueprint $table) {
            $table->id();

            // Thông tin chung
            $table->string('code')->unique(); // PN0001
            $table->date('receipt_date');

            // Nhà cung cấp
            $table->unsignedBigInteger('supplier_id');
            $table->unsignedBigInteger('user_id');

            // Tổng tiền
            $table->decimal('total_amount', 18, 2)->default(0); // tiền hàng
            $table->decimal('vat_amount', 18, 2)->default(0);   // tiền VAT
            $table->decimal('grand_total', 18, 2)->default(0);  // tổng thanh toán

            // Trạng thái
            $table->enum('status', ['draft', 'confirmed', 'cancelled'])
                ->default('draft');

            $table->text('note')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Foreign key
            $table->foreign('supplier_id')
                ->references('id')
                ->on('suppliers');
                
            $table->foreign('user_id')
                ->references('id')
                ->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_receipts');
    }
};
