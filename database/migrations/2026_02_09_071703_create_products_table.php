<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->integer('product_catalogue_id')->default(0);
            $table->text('image')->nullable();
            $table->string('icon')->nullable();
            $table->text('album')->nullable();
            $table->string('made_in')->nullable();
            $table->tinyInteger('publish')->default(1);
            $table->tinyInteger('follow')->default(1);
            $table->integer('order')->default(0);
            $table->text('attributeCatalogue')->nullable();
            $table->text('attribute')->nullable();
            $table->text('variant')->nullable();
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('products');
    }
};