<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RollbackProductCatalogueSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Xóa theo thứ tự ngược lại (vì có foreign key)
        DB::table('product_catalogue_languages')->truncate();
        DB::table('product_catalogues')->truncate();

        $this->command->info('✅ Đã xóa tất cả product catalogues!');
    }
}