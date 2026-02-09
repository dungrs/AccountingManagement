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
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->char('supplier_code', 7)->unique();
            $table->string('name', 150);
            $table->char('tax_code', 13)->unique();
            
            // Thêm thông tin địa chỉ chi tiết hơn
            $table->string('province_id', 10)->nullable();
            $table->string('ward_id', 10)->nullable();
            
            $table->string('avatar')->nullable(); // gộp image / avatar → chọn 1
            $table->char('phone', 12);
            $table->string('email', 150)->nullable();
            $table->text('description')->nullable();
            $table->string('address', 150);
            $table->char('fax', 11)->nullable();

            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            // Trạng thái hiển thị
            $table->tinyInteger('publish')->default(1);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
