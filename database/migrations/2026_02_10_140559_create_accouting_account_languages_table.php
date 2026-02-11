<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('accounting_account_languages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('accounting_account_id');
            $table->unsignedBigInteger('language_id');
            // Text hiển thị
            $table->string('name');
            $table->text('description')->nullable();
            // FK
            $table->foreign('accounting_account_id')->references('id')->on('accounting_accounts')->onDelete('cascade');
            $table->foreign('language_id')->references('id')->on('languages')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounting_account_languages');
    }
};
