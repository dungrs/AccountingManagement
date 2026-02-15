<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('payment_vouchers', function (Blueprint $table) {
            $table->renameColumn('payment_date', 'voucher_date');
        });
    }

    public function down(): void
    {
        Schema::table('payment_vouchers', function (Blueprint $table) {
            $table->renameColumn('voucher_date', 'payment_date');
        });
    }
};
