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
        Schema::create('vat_taxes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique(); // R10, V8...
            $table->string('name');
            $table->decimal('rate', 5, 2); // 0, 5, 8, 10
            $table->string('direction', 10); // input | output (optional)
            $table->text('description')->nullable();
            $table->tinyInteger('publish')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vat_taxes');
    }
};
