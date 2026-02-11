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
        Schema::create('supplier_bank_accounts', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->char('supplier_code', 7);
            $table->char('bank_code', 10);

            $table->string('account_number', 30);

            $table->timestamps();

            // FK
            $table->foreign('supplier_code')
                ->references('supplier_code')
                ->on('suppliers')
                ->onDelete('cascade');

            $table->foreign('bank_code')
                ->references('bank_code')
                ->on('banks')
                ->onDelete('cascade');

            // tránh trùng 1 supplier + bank + stk
            $table->unique(
                ['supplier_code', 'bank_code', 'account_number'],
                'uq_supplier_bank_account'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplier_bank_accounts');
    }
};
