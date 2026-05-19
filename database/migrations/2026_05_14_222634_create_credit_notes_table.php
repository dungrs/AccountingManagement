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
        Schema::create('credit_notes', function (Blueprint $table) {
            $table->id();

            // Mã chứng từ
            $table->string('code')->unique(); // BC0001
            
            // Ngày lập chứng từ
            $table->date('issue_date');
            
            // Liên kết với khách hàng hoặc nhà cung cấp
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->unsignedBigInteger('supplier_id')->nullable();
            
            // Số tiền ghi có
            $table->decimal('amount', 18, 2)->default(0);
            
            // Thuế GTGT (nếu có)
            $table->decimal('vat_rate', 5, 2)->default(0);
            $table->decimal('vat_amount', 18, 2)->default(0);
            
            // Tổng tiền (bao gồm VAT)
            $table->decimal('total_amount', 18, 2)->default(0);
            
            // Lý do/ghi chú
            $table->text('reason')->nullable();
            $table->text('note')->nullable();
            
            // Loại credit note
            $table->enum('type', [
                'sales_return',      // Khách hàng trả hàng
                'discount',          // Chiết khấu thanh toán
                'price_adjustment',  // Điều chỉnh giá giảm
                'refund',            // Hoàn tiền
                'prepayment',        // Ứng trước
                'other'              // Khác
            ])->default('other');
            
            // Tham chiếu đến chứng từ gốc
            $table->string('reference_type')->nullable(); // sales_receipt, payment_voucher
            $table->unsignedBigInteger('reference_id')->nullable();
            
            // Trạng thái
            $table->enum('status', ['draft', 'confirmed', 'cancelled'])
                ->default('draft');
            
            // Người tạo
            $table->unsignedBigInteger('created_by')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Foreign keys
            $table->foreign('customer_id')
                ->references('id')
                ->on('customers')
                ->onDelete('set null');
            
            $table->foreign('supplier_id')
                ->references('id')
                ->on('suppliers')
                ->onDelete('set null');
            
            $table->foreign('created_by')
                ->references('id')
                ->on('users')
                ->onDelete('set null');
            
            // Indexes
            $table->index(['customer_id', 'supplier_id']);
            $table->index('issue_date');
            $table->index('status');
            $table->index(['reference_type', 'reference_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('credit_notes');
    }
};