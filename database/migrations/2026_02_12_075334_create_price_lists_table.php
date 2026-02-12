<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('price_lists', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // tên bảng giá
            $table->date('start_date')->nullable(); // ngày bắt đầu áp dụng
            $table->date('end_date')->nullable(); // ngày kết thúc (nếu có)
            $table->tinyInteger('publish')->default(1);
            $table->text('description')->nullable();

            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();

            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('price_lists');
    }
};