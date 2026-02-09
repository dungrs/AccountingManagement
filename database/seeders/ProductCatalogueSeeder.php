<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class ProductCatalogueSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $now = Carbon::now();
        
        // Lấy user đầu tiên hoặc tạo mới nếu chưa có
        $user = DB::table('users')->first();
        
        if (!$user) {
            // Tạo user mới nếu chưa có
            $userId = DB::table('users')->insertGetId([
                'name' => 'Admin',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
                'created_at' => $now,
                'updated_at' => $now
            ]);
        } else {
            $userId = $user->id;
        }

        // Lấy language đầu tiên hoặc tạo mới
        $language = DB::table('languages')->first();
        
        if (!$language) {
            // Tạo language mới nếu chưa có
            $languageId = DB::table('languages')->insertGetId([
                'name' => 'Tiếng Việt',
                'code' => 'vi',
                'created_at' => $now,
                'updated_at' => $now
            ]);
        } else {
            $languageId = $language->id;
        }

        $categories = [
            // Level 0 - Danh mục cha
            [
                'name' => 'Điện thoại & Phụ kiện',
                'children' => [
                    'Điện thoại di động',
                    'Ốp lưng & Bao da',
                    'Cáp sạc & Adapter',
                    'Tai nghe',
                    'Sạc dự phòng'
                ]
            ],
            [
                'name' => 'Laptop & Máy tính',
                'children' => [
                    'Laptop',
                    'Máy tính để bàn',
                    'Linh kiện máy tính',
                    'Màn hình máy tính'
                ]
            ],
            [
                'name' => 'Thiết bị âm thanh',
                'children' => [
                    'Loa bluetooth',
                    'Tai nghe chụp tai',
                    'Dàn âm thanh'
                ]
            ],
            [
                'name' => 'Máy ảnh & Quay phim',
                'children' => [
                    'Máy ảnh DSLR',
                    'Máy ảnh mirrorless',
                    'Action camera',
                    'Phụ kiện máy ảnh'
                ]
            ],
            [
                'name' => 'Đồng hồ thông minh',
                'children' => [
                    'Apple Watch',
                    'Samsung Galaxy Watch',
                    'Xiaomi Watch'
                ]
            ],
            [
                'name' => 'Thiết bị gia dụng',
                'children' => [
                    'Máy lọc không khí',
                    'Robot hút bụi',
                    'Nồi cơm điện'
                ]
            ]
        ];

        $catalogueId = 1;
        $lft = 1;

        foreach ($categories as $index => $category) {
            $parentLft = $lft;
            $childCount = count($category['children']);
            $parentRgt = $parentLft + ($childCount * 2) + 1;
            
            $parentId = $catalogueId;

            // Insert parent category
            DB::table('product_catalogues')->insert([
                'id' => $catalogueId,
                'parent_id' => 0,
                'lft' => $parentLft,
                'rgt' => $parentRgt,
                'level' => 0,
                'image' => 'images/categories/category_' . ($index + 1) . '.jpg',
                'icon' => 'icon-category-' . ($index + 1),
                'album' => json_encode([
                    'images/album_' . ($index + 1) . '_1.jpg',
                    'images/album_' . ($index + 1) . '_2.jpg'
                ]),
                'publish' => 1,
                'follow' => 1,
                'order' => $index + 1,
                'user_id' => $userId,
                'attribute' => json_encode([
                    'featured' => $index < 3,
                    'show_home' => true
                ]),
                'created_at' => $now,
                'updated_at' => $now
            ]);

            // Insert parent language data
            DB::table('product_catalogue_languages')->insert([
                'product_catalogue_id' => $catalogueId,
                'language_id' => $languageId,
                'name' => $category['name'],
                'description' => 'Mô tả ngắn cho danh mục ' . $category['name'],
                'content' => '<p>Nội dung chi tiết về danh mục ' . $category['name'] . '. Chúng tôi cung cấp đầy đủ các sản phẩm chất lượng cao với giá cả cạnh tranh nhất thị trường.</p>',
                'meta_title' => $category['name'] . ' - Chất lượng cao, Giá tốt nhất',
                'meta_keyword' => strtolower(str_replace(' ', ', ', $category['name'])),
                'meta_description' => 'Mua ' . $category['name'] . ' chính hãng, giá rẻ, uy tín tại cửa hàng chúng tôi',
                'canonical' => Str::slug($category['name']),
                'created_at' => $now,
                'updated_at' => $now
            ]);

            $catalogueId++;
            $childLft = $parentLft + 1;

            // Insert children categories
            foreach ($category['children'] as $childIndex => $childName) {
                $childRgt = $childLft + 1;

                DB::table('product_catalogues')->insert([
                    'id' => $catalogueId,
                    'parent_id' => $parentId, // Sửa lại đây
                    'lft' => $childLft,
                    'rgt' => $childRgt,
                    'level' => 1,
                    'image' => 'images/categories/sub_category_' . $catalogueId . '.jpg',
                    'icon' => 'icon-sub-' . $catalogueId,
                    'album' => json_encode([
                        'images/sub_album_' . $catalogueId . '_1.jpg'
                    ]),
                    'publish' => 1,
                    'follow' => 1,
                    'order' => $childIndex + 1,
                    'user_id' => $userId,
                    'attribute' => json_encode([
                        'featured' => $childIndex === 0,
                        'show_home' => $childIndex < 2
                    ]),
                    'created_at' => $now,
                    'updated_at' => $now
                ]);

                // Insert child language data
                DB::table('product_catalogue_languages')->insert([
                    'product_catalogue_id' => $catalogueId,
                    'language_id' => $languageId,
                    'name' => $childName,
                    'description' => 'Mô tả chi tiết về ' . $childName,
                    'content' => '<p>Khám phá bộ sưu tập ' . $childName . ' đa dạng với nhiều mẫu mã, thương hiệu uy tín. Giao hàng nhanh chóng, bảo hành chính hãng.</p>',
                    'meta_title' => $childName . ' chính hãng - Giá tốt nhất 2024',
                    'meta_keyword' => strtolower(str_replace(' ', ', ', $childName)) . ', chính hãng, giá rẻ',
                    'meta_description' => 'Mua ' . $childName . ' chính hãng, bảo hành 12 tháng, miễn phí vận chuyển',
                    'canonical' => Str::slug($category['name']) . '/' . Str::slug($childName),
                    'created_at' => $now,
                    'updated_at' => $now
                ]);

                $catalogueId++;
                $childLft = $childRgt + 1;
            }

            $lft = $parentRgt + 1;
        }

        $this->command->info('✅ Đã tạo thành công ' . ($catalogueId - 1) . ' product catalogues!');
    }
}