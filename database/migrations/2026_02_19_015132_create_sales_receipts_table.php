<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sales_receipts', function (Blueprint $table) {
            $table->id();

            // Thông tin chung
            $table->string('code')->unique(); // PX0001
            $table->date('receipt_date');

            // Khách hàng
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('user_id');
            
            // Bảng giá áp dụng
            $table->unsignedBigInteger('price_list_id')->nullable();

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
            $table->foreign('customer_id')
                ->references('id')
                ->on('customers');
                
            $table->foreign('user_id')
                ->references('id')
                ->on('users');
                
            $table->foreign('price_list_id')
                ->references('id')
                ->on('price_lists');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_receipts');
    }
};