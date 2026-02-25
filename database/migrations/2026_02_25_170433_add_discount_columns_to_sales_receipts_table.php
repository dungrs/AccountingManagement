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
        Schema::table('sales_receipts', function (Blueprint $table) {
            // Thêm cột loại chiết khấu
            if (!Schema::hasColumn('sales_receipts', 'discount_type')) {
                $table->enum('discount_type', ['percentage', 'fixed'])
                    ->nullable()
                    ->after('price_list_id');
            }

            // Thêm cột giá trị chiết khấu
            if (!Schema::hasColumn('sales_receipts', 'discount_value')) {
                $table->decimal('discount_value', 18, 2)
                    ->default(0)
                    ->after('discount_type');
            }

            // Thêm cột số tiền chiết khấu đã tính
            if (!Schema::hasColumn('sales_receipts', 'discount_amount')) {
                $table->decimal('discount_amount', 18, 2)
                    ->default(0)
                    ->after('discount_value');
            }

            // Thêm cột tổng tiền chiết khấu
            if (!Schema::hasColumn('sales_receipts', 'discount_total')) {
                $table->decimal('discount_total', 18, 2)
                    ->default(0)
                    ->after('discount_amount');
            }

            // Thêm cột ghi chú chiết khấu
            if (!Schema::hasColumn('sales_receipts', 'discount_note')) {
                $table->string('discount_note', 255)
                    ->nullable()
                    ->after('discount_total');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_receipts', function (Blueprint $table) {
            $columns = [
                'discount_type',
                'discount_value',
                'discount_amount',
                'discount_total',
                'discount_note'
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('sales_receipts', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};