<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UserCatalogueSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Thêm dữ liệu mẫu vào bảng user_catalogues
        DB::table('user_catalogues')->insert([
            [
                'id' => 13,
                'name' => 'Phòng Nghiên Cứu Thị Trường',
                'description' => 'Nhóm phân tích thị trường, hành vi khách hàng và xu hướng ngành nhằm hỗ trợ chiến lược kinh doanh.',
                'phone' => '0913000001',
                'email' => 'market_research@example.com',
                'publish' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 14,
                'name' => 'Phòng Đảm Bảo Chất Lượng (QA)',
                'description' => 'Nhóm kiểm soát chất lượng sản phẩm, quy trình và đảm bảo tiêu chuẩn trước khi đưa ra thị trường.',
                'phone' => '0913000002',
                'email' => 'qa@example.com',
                'publish' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 15,
                'name' => 'Phòng Kiểm Soát Nội Bộ',
                'description' => 'Nhóm giám sát tuân thủ quy trình nội bộ, kiểm soát rủi ro và phòng chống sai phạm.',
                'phone' => '0913000003',
                'email' => 'internal_control@example.com',
                'publish' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 16,
                'name' => 'Phòng Mua Hàng',
                'description' => 'Nhóm phụ trách tìm kiếm nhà cung cấp, đàm phán và mua sắm nguyên vật liệu, dịch vụ.',
                'phone' => '0913000004',
                'email' => 'procurement@example.com',
                'publish' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 17,
                'name' => 'Phòng Quản Lý Dự Án',
                'description' => 'Nhóm lập kế hoạch, theo dõi tiến độ và điều phối các dự án trong doanh nghiệp.',
                'phone' => '0913000005',
                'email' => 'pm@example.com',
                'publish' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 18,
                'name' => 'Phòng Pháp Chế Doanh Nghiệp',
                'description' => 'Nhóm hỗ trợ pháp lý nội bộ, tư vấn rủi ro pháp luật trong hoạt động kinh doanh.',
                'phone' => '0913000006',
                'email' => 'corporate_legal@example.com',
                'publish' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 19,
                'name' => 'Phòng Phân Tích Dữ Liệu',
                'description' => 'Nhóm thu thập, xử lý và phân tích dữ liệu nhằm hỗ trợ ra quyết định.',
                'phone' => '0913000007',
                'email' => 'data_analytics@example.com',
                'publish' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 20,
                'name' => 'Phòng An Ninh Thông Tin',
                'description' => 'Nhóm đảm bảo an toàn dữ liệu, bảo mật hệ thống và phòng chống tấn công mạng.',
                'phone' => '0913000008',
                'email' => 'security@example.com',
                'publish' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 21,
                'name' => 'Phòng Đào Tạo Nội Bộ',
                'description' => 'Nhóm tổ chức đào tạo, nâng cao kỹ năng và phát triển năng lực nhân sự.',
                'phone' => '0913000009',
                'email' => 'training@example.com',
                'publish' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 22,
                'name' => 'Phòng Quan Hệ Đối Tác',
                'description' => 'Nhóm xây dựng và duy trì mối quan hệ hợp tác với đối tác chiến lược.',
                'phone' => '0913000010',
                'email' => 'partnership@example.com',
                'publish' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 23,
                'name' => 'Phòng Vận Hành',
                'description' => 'Nhóm quản lý hoạt động vận hành hàng ngày, đảm bảo hệ thống hoạt động ổn định.',
                'phone' => '0913000011',
                'email' => 'operations@example.com',
                'publish' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 24,
                'name' => 'Phòng Quản Lý Tài Sản',
                'description' => 'Nhóm quản lý tài sản cố định, trang thiết bị và cơ sở vật chất.',
                'phone' => '0913000012',
                'email' => 'asset_management@example.com',
                'publish' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 25,
                'name' => 'Phòng Trải Nghiệm Khách Hàng',
                'description' => 'Nhóm tối ưu hành trình và trải nghiệm khách hàng trên mọi điểm chạm.',
                'phone' => '0913000013',
                'email' => 'customer_experience@example.com',
                'publish' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 26,
                'name' => 'Phòng Phát Triển Kinh Doanh',
                'description' => 'Nhóm tìm kiếm cơ hội kinh doanh mới, mở rộng thị trường và sản phẩm.',
                'phone' => '0913000014',
                'email' => 'business_dev@example.com',
                'publish' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 27,
                'name' => 'Phòng Chiến Lược & Đổi Mới',
                'description' => 'Nhóm nghiên cứu chiến lược dài hạn, đổi mới sáng tạo và cải tiến mô hình kinh doanh.',
                'phone' => '0913000015',
                'email' => 'strategy@example.com',
                'publish' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

        ]);
    }
}
