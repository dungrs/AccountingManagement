<?php
// database/seeders/WarehouseSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class WarehouseSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('warehouses')->insert([
            [
                'code' => 'WH001',
                'name' => 'Kho chính',
                'address' => 'Số 1, Đường ABC, Quận 1, TP.HCM',
                'phone' => '02812345678',
                'manager' => 'Nguyễn Văn A',
                'publish' => 1,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'code' => 'WH002',
                'name' => 'Kho phụ',
                'address' => 'Số 2, Đường XYZ, Quận 2, TP.HCM',
                'phone' => '02887654321',
                'manager' => 'Trần Thị B',
                'publish' => 1,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ]);
    }
}