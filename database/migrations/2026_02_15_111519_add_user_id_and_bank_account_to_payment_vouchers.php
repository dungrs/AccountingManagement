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
        Schema::table('payment_vouchers', function (Blueprint $table) {

            $table->unsignedBigInteger('user_id')
                ->default(1)   // 👈 default = 1
                ->after('id');

            $table->unsignedBigInteger('supplier_bank_account_id')
                ->nullable()
                ->after('supplier_id');

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();   // 👈 dùng cascade cho chắc

            $table->foreign('supplier_bank_account_id')
                ->references('id')
                ->on('supplier_bank_accounts')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_vouchers', function (Blueprint $table) {
            //
        });
    }
};
