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
        Schema::create('user_catalogue_permissions', function (Blueprint $table) {
            $table->unsignedBigInteger("user_catalogue_id");
            $table->unsignedBigInteger("permission_id");
            $table->foreign('user_catalogue_id')->references('id')->on('user_catalogues')->cascadeOnDelete();
            $table->foreign('permission_id')->references('id')->on('permissions')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('user_catalogue_permissions');
    }
};