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
        Schema::create('banks', function (Blueprint $table) {
            $table->id();
            $table->char('bank_code', 10)->unique();      // mã nội bộ hệ thống (VCB, BIDV,...)
            $table->string('name', 255);             // tên đầy đủ
            $table->string('short_name', 50)->nullable(); // viết tắt (VCB, ACB...)
            $table->string('swift_code', 20)->nullable(); // mã swift
            $table->string('bin_code', 10)->nullable();   // mã BIN thẻ
            $table->string('logo')->nullable();           // logo url/path
            $table->tinyInteger('publish')->default(1);

            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('banks');
    }
};
