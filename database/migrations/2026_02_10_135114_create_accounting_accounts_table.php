<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('accounting_accounts', function (Blueprint $table) {
            $table->id();

            // Mã tài khoản kế toán (111, 1121, 51101...)
            $table->string('account_code', 20)->unique()->default(0);

            // Nested set
            $table->integer('parent_id')->default(0);
            $table->integer('lft')->default(0);
            $table->integer('rgt')->default(0);
            $table->integer('level')->default(0);
            $table->integer('order')->default(0);

            // Nghiệp vụ kế toán
            $table->enum('account_type', [
                'ASSET',
                'LIABILITY',
                'EQUITY',
                'REVENUE',
                'EXPENSE',
                'OTHER'
            ]);

            $table->enum('normal_balance', ['DEBIT', 'CREDIT']);
            $table->tinyInteger('publish')->default(1);

            // Phục vụ Nestedsetbie::Action()
            $table->unsignedBigInteger('user_id')->nullable();

            $table->softDeletes();
            $table->timestamps();

            // Index cho nested set
            $table->index(['lft', 'rgt']);
            $table->index('parent_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounting_accounts');
    }
};
