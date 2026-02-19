<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Classes\Nestedsetbie;
use Illuminate\Support\Facades\Auth;

class AccountingAccountSeeder extends Seeder
{
    protected $nestedset;

    public function __construct()
    {
        $this->nestedset = new Nestedsetbie([
            'table' => 'accounting_accounts',
            'foreignkey' => 'accounting_account_id',
            'language_id' => 1, // Giả sử language_id mặc định là 1
            'customLanguageTable' => true,
            'languageTableName' => 'accounting_account_languages',
            'hasOrderColumn' => true
        ]);
    }

    public function run(): void
    {
        // Xóa dữ liệu cũ nếu có
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('accounting_account_languages')->truncate();
        DB::table('accounting_accounts')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Danh sách tài khoản theo Thông tư 200
        $accounts = [
            // ==================== LOẠI 1: TÀI SẢN NGẮN HẠN ====================
            [
                'account_code' => '1',
                'name' => 'Loại 1 - Tài sản ngắn hạn',
                'account_type' => 'ASSET',
                'normal_balance' => 'DEBIT',
                'parent_id' => 0,
                'level' => 1,
                'children' => [
                    [
                        'account_code' => '11',
                        'name' => 'Tiền và các khoản tương đương tiền',
                        'account_type' => 'ASSET',
                        'normal_balance' => 'DEBIT',
                        'parent_id' => 0,
                        'level' => 2,
                        'children' => [
                            [
                                'account_code' => '111',
                                'name' => 'Tiền mặt',
                                'account_type' => 'ASSET',
                                'normal_balance' => 'DEBIT',
                                'parent_id' => 0,
                                'level' => 3,
                                'children' => [
                                    ['account_code' => '1111', 'name' => 'Tiền Việt Nam', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                                    ['account_code' => '1112', 'name' => 'Ngoại tệ', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                                    ['account_code' => '1113', 'name' => 'Vàng, bạc, kim khí quý, đá quý', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                                ]
                            ],
                            [
                                'account_code' => '112',
                                'name' => 'Tiền gửi ngân hàng',
                                'account_type' => 'ASSET',
                                'normal_balance' => 'DEBIT',
                                'parent_id' => 0,
                                'level' => 3,
                                'children' => [
                                    ['account_code' => '1121', 'name' => 'Tiền Việt Nam', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                                    ['account_code' => '1122', 'name' => 'Ngoại tệ', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                                    ['account_code' => '1123', 'name' => 'Vàng, bạc, kim khí quý, đá quý', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                                ]
                            ],
                            [
                                'account_code' => '113',
                                'name' => 'Tiền đang chuyển',
                                'account_type' => 'ASSET',
                                'normal_balance' => 'DEBIT',
                                'children' => [
                                    ['account_code' => '1131', 'name' => 'Tiền Việt Nam', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                                    ['account_code' => '1132', 'name' => 'Ngoại tệ', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                                ]
                            ],
                        ]
                    ],
                    [
                        'account_code' => '12',
                        'name' => 'Đầu tư tài chính ngắn hạn',
                        'account_type' => 'ASSET',
                        'normal_balance' => 'DEBIT',
                        'level' => 2,
                        'children' => [
                            ['account_code' => '121', 'name' => 'Chứng khoán kinh doanh', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '122', 'name' => 'Đầu tư nắm giữ đến ngày đáo hạn', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '123', 'name' => 'Đầu tư góp vốn vào đơn vị khác', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '124', 'name' => 'Dự phòng giảm giá đầu tư ngắn hạn', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                        ]
                    ],
                    [
                        'account_code' => '13',
                        'name' => 'Các khoản phải thu ngắn hạn',
                        'account_type' => 'ASSET',
                        'normal_balance' => 'DEBIT',
                        'level' => 2,
                        'children' => [
                            ['account_code' => '131', 'name' => 'Phải thu của khách hàng', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '132', 'name' => 'Phải thu nội bộ ngắn hạn', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            [
                                'account_code' => '133',
                                'name' => 'Thuế GTGT được khấu trừ',
                                'account_type' => 'ASSET',
                                'normal_balance' => 'DEBIT',
                                'children' => [
                                    ['account_code' => '1331', 'name' => 'Thuế GTGT được khấu trừ của hàng hóa, dịch vụ', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                                    ['account_code' => '1332', 'name' => 'Thuế GTGT được khấu trừ của TSCĐ', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                                ]
                            ],
                            ['account_code' => '134', 'name' => 'Thuế và các khoản khác phải thu Nhà nước', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '135', 'name' => 'Giao dịch mua bán lại trái phiếu chính phủ', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '136', 'name' => 'Phải thu nội bộ', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '137', 'name' => 'Dự phòng phải thu ngắn hạn khó đòi', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            [
                                'account_code' => '138',
                                'name' => 'Phải thu khác',
                                'account_type' => 'ASSET',
                                'normal_balance' => 'DEBIT',
                                'children' => [
                                    ['account_code' => '1381', 'name' => 'Tài sản thiếu chờ xử lý', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                                    ['account_code' => '1382', 'name' => 'Phải thu bồi thường', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                                    ['account_code' => '1385', 'name' => 'Phải thu về cổ phần hóa', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                                    ['account_code' => '1388', 'name' => 'Phải thu khác', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                                ]
                            ],
                            ['account_code' => '139', 'name' => 'Dự phòng phải thu khó đòi', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                        ]
                    ],
                    [
                        'account_code' => '14',
                        'name' => 'Hàng tồn kho',
                        'account_type' => 'ASSET',
                        'normal_balance' => 'DEBIT',
                        'level' => 2,
                        'children' => [
                            ['account_code' => '141', 'name' => 'Hàng mua đang đi đường', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '142', 'name' => 'Nguyên liệu, vật liệu', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '143', 'name' => 'Công cụ, dụng cụ', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '144', 'name' => 'Chi phí sản xuất, kinh doanh dở dang', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '145', 'name' => 'Thành phẩm', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '146', 'name' => 'Hàng hóa', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '147', 'name' => 'Hàng gửi bán', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '149', 'name' => 'Dự phòng giảm giá hàng tồn kho', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                        ]
                    ],
                    [
                        'account_code' => '15',
                        'name' => 'Chi phí trả trước ngắn hạn',
                        'account_type' => 'ASSET',
                        'normal_balance' => 'DEBIT',
                        'level' => 2,
                        'children' => [
                            ['account_code' => '151', 'name' => 'Chi phí trả trước ngắn hạn', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                        ]
                    ],
                    [
                        'account_code' => '16',
                        'name' => 'Tài sản ngắn hạn khác',
                        'account_type' => 'ASSET',
                        'normal_balance' => 'DEBIT',
                        'level' => 2,
                        'children' => [
                            ['account_code' => '161', 'name' => 'Chi phí trả trước ngắn hạn', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '162', 'name' => 'Thuế GTGT được khấu trừ', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '163', 'name' => 'Tài sản ngắn hạn khác', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                        ]
                    ],
                ]
            ],

            // ==================== LOẠI 2: TÀI SẢN DÀI HẠN ====================
            [
                'account_code' => '2',
                'name' => 'Loại 2 - Tài sản dài hạn',
                'account_type' => 'ASSET',
                'normal_balance' => 'DEBIT',
                'parent_id' => 0,
                'level' => 1,
                'children' => [
                    [
                        'account_code' => '21',
                        'name' => 'Các khoản phải thu dài hạn',
                        'account_type' => 'ASSET',
                        'normal_balance' => 'DEBIT',
                        'level' => 2,
                        'children' => [
                            ['account_code' => '211', 'name' => 'Phải thu dài hạn của khách hàng', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '212', 'name' => 'Phải thu nội bộ dài hạn', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '213', 'name' => 'Phải thu dài hạn khác', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '214', 'name' => 'Dự phòng phải thu dài hạn khó đòi', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                        ]
                    ],
                    [
                        'account_code' => '22',
                        'name' => 'Tài sản cố định',
                        'account_type' => 'ASSET',
                        'normal_balance' => 'DEBIT',
                        'level' => 2,
                        'children' => [
                            [
                                'account_code' => '221',
                                'name' => 'Tài sản cố định hữu hình',
                                'account_type' => 'ASSET',
                                'normal_balance' => 'DEBIT',
                                'children' => [
                                    ['account_code' => '2211', 'name' => 'Nhà cửa, vật kiến trúc', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                                    ['account_code' => '2212', 'name' => 'Máy móc, thiết bị', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                                    ['account_code' => '2213', 'name' => 'Phương tiện vận tải, truyền dẫn', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                                    ['account_code' => '2214', 'name' => 'Thiết bị, dụng cụ quản lý', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                                    ['account_code' => '2215', 'name' => 'Cây lâu năm, súc vật làm việc và cho sản phẩm', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                                    ['account_code' => '2218', 'name' => 'TSCĐ hữu hình khác', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                                ]
                            ],
                            ['account_code' => '222', 'name' => 'Tài sản cố định thuê tài chính', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            [
                                'account_code' => '223',
                                'name' => 'Tài sản cố định vô hình',
                                'account_type' => 'ASSET',
                                'normal_balance' => 'DEBIT',
                                'children' => [
                                    ['account_code' => '2231', 'name' => 'Quyền sử dụng đất', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                                    ['account_code' => '2232', 'name' => 'Quyền phát hành', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                                    ['account_code' => '2233', 'name' => 'Bản quyền, bằng sáng chế', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                                    ['account_code' => '2234', 'name' => 'Nhãn hiệu hàng hóa', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                                    ['account_code' => '2235', 'name' => 'Phần mềm máy tính', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                                    ['account_code' => '2238', 'name' => 'TSCĐ vô hình khác', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                                ]
                            ],
                        ]
                    ],
                    [
                        'account_code' => '23',
                        'name' => 'Bất động sản đầu tư',
                        'account_type' => 'ASSET',
                        'normal_balance' => 'DEBIT',
                        'level' => 2,
                        'children' => [
                            ['account_code' => '231', 'name' => 'Bất động sản đầu tư', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '232', 'name' => 'Chi phí đầu tư BĐS dở dang', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '233', 'name' => 'Hao mòn bất động sản đầu tư', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                        ]
                    ],
                    [
                        'account_code' => '24',
                        'name' => 'Đầu tư tài chính dài hạn',
                        'account_type' => 'ASSET',
                        'normal_balance' => 'DEBIT',
                        'level' => 2,
                        'children' => [
                            ['account_code' => '241', 'name' => 'Đầu tư vào công ty con', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '242', 'name' => 'Đầu tư vào công ty liên doanh, liên kết', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '243', 'name' => 'Đầu tư góp vốn vào đơn vị khác', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '244', 'name' => 'Dự phòng đầu tư tài chính dài hạn', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '245', 'name' => 'Đầu tư nắm giữ đến ngày đáo hạn', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                        ]
                    ],
                    [
                        'account_code' => '25',
                        'name' => 'Tài sản dài hạn khác',
                        'account_type' => 'ASSET',
                        'normal_balance' => 'DEBIT',
                        'level' => 2,
                        'children' => [
                            ['account_code' => '251', 'name' => 'Chi phí trả trước dài hạn', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '252', 'name' => 'Tài sản thuế thu nhập hoãn lại', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '253', 'name' => 'Ký quỹ, ký cược dài hạn', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '254', 'name' => 'Tài sản dài hạn khác', 'account_type' => 'ASSET', 'normal_balance' => 'DEBIT'],
                        ]
                    ],
                ]
            ],

            // ==================== LOẠI 3: NỢ PHẢI TRẢ ====================
            [
                'account_code' => '3',
                'name' => 'Loại 3 - Nợ phải trả',
                'account_type' => 'LIABILITY',
                'normal_balance' => 'CREDIT',
                'parent_id' => 0,
                'level' => 1,
                'children' => [
                    [
                        'account_code' => '31',
                        'name' => 'Nợ ngắn hạn',
                        'account_type' => 'LIABILITY',
                        'normal_balance' => 'CREDIT',
                        'level' => 2,
                        'children' => [
                            ['account_code' => '311', 'name' => 'Vay và nợ thuê tài chính ngắn hạn', 'account_type' => 'LIABILITY', 'normal_balance' => 'CREDIT'],
                            ['account_code' => '312', 'name' => 'Phải trả người bán ngắn hạn', 'account_type' => 'LIABILITY', 'normal_balance' => 'CREDIT'],
                            [
                                'account_code' => '313',
                                'name' => 'Thuế và các khoản phải nộp Nhà nước',
                                'account_type' => 'LIABILITY',
                                'normal_balance' => 'CREDIT',
                                'children' => [
                                    ['account_code' => '3131', 'name' => 'Thuế GTGT phải nộp', 'account_type' => 'LIABILITY', 'normal_balance' => 'CREDIT'],
                                    ['account_code' => '3132', 'name' => 'Thuế tiêu thụ đặc biệt', 'account_type' => 'LIABILITY', 'normal_balance' => 'CREDIT'],
                                    ['account_code' => '3133', 'name' => 'Thuế xuất, nhập khẩu', 'account_type' => 'LIABILITY', 'normal_balance' => 'CREDIT'],
                                    ['account_code' => '3134', 'name' => 'Thuế thu nhập doanh nghiệp', 'account_type' => 'LIABILITY', 'normal_balance' => 'CREDIT'],
                                    ['account_code' => '3135', 'name' => 'Thuế thu nhập cá nhân', 'account_type' => 'LIABILITY', 'normal_balance' => 'CREDIT'],
                                    ['account_code' => '3138', 'name' => 'Các loại thuế khác', 'account_type' => 'LIABILITY', 'normal_balance' => 'CREDIT'],
                                ]
                            ],
                            ['account_code' => '314', 'name' => 'Phải trả người lao động', 'account_type' => 'LIABILITY', 'normal_balance' => 'CREDIT'],
                            ['account_code' => '315', 'name' => 'Chi phí phải trả ngắn hạn', 'account_type' => 'LIABILITY', 'normal_balance' => 'CREDIT'],
                            ['account_code' => '316', 'name' => 'Phải trả nội bộ ngắn hạn', 'account_type' => 'LIABILITY', 'normal_balance' => 'CREDIT'],
                            ['account_code' => '317', 'name' => 'Doanh thu chưa thực hiện ngắn hạn', 'account_type' => 'LIABILITY', 'normal_balance' => 'CREDIT'],
                            ['account_code' => '318', 'name' => 'Phải trả ngắn hạn khác', 'account_type' => 'LIABILITY', 'normal_balance' => 'CREDIT'],
                            ['account_code' => '319', 'name' => 'Dự phòng phải trả ngắn hạn', 'account_type' => 'LIABILITY', 'normal_balance' => 'CREDIT'],
                        ]
                    ],
                    [
                        'account_code' => '32',
                        'name' => 'Nợ dài hạn',
                        'account_type' => 'LIABILITY',
                        'normal_balance' => 'CREDIT',
                        'level' => 2,
                        'children' => [
                            ['account_code' => '321', 'name' => 'Phải trả dài hạn người bán', 'account_type' => 'LIABILITY', 'normal_balance' => 'CREDIT'],
                            ['account_code' => '322', 'name' => 'Phải trả nội bộ dài hạn', 'account_type' => 'LIABILITY', 'normal_balance' => 'CREDIT'],
                            ['account_code' => '323', 'name' => 'Doanh thu chưa thực hiện dài hạn', 'account_type' => 'LIABILITY', 'normal_balance' => 'CREDIT'],
                            ['account_code' => '324', 'name' => 'Chi phí phải trả dài hạn', 'account_type' => 'LIABILITY', 'normal_balance' => 'CREDIT'],
                            ['account_code' => '325', 'name' => 'Vay và nợ thuê tài chính dài hạn', 'account_type' => 'LIABILITY', 'normal_balance' => 'CREDIT'],
                            ['account_code' => '326', 'name' => 'Trái phiếu phát hành', 'account_type' => 'LIABILITY', 'normal_balance' => 'CREDIT'],
                            ['account_code' => '327', 'name' => 'Thuế thu nhập hoãn lại phải trả', 'account_type' => 'LIABILITY', 'normal_balance' => 'CREDIT'],
                            ['account_code' => '328', 'name' => 'Nhận ký quỹ, ký cược dài hạn', 'account_type' => 'LIABILITY', 'normal_balance' => 'CREDIT'],
                            ['account_code' => '329', 'name' => 'Dự phòng phải trả dài hạn', 'account_type' => 'LIABILITY', 'normal_balance' => 'CREDIT'],
                        ]
                    ],
                ]
            ],

            // ==================== LOẠI 4: VỐN CHỦ SỞ HỮU ====================
            [
                'account_code' => '4',
                'name' => 'Loại 4 - Vốn chủ sở hữu',
                'account_type' => 'EQUITY',
                'normal_balance' => 'CREDIT',
                'parent_id' => 0,
                'level' => 1,
                'children' => [
                    [
                        'account_code' => '411',
                        'name' => 'Vốn đầu tư của chủ sở hữu',
                        'account_type' => 'EQUITY',
                        'normal_balance' => 'CREDIT',
                        'children' => [
                            ['account_code' => '4111', 'name' => 'Vốn góp của chủ sở hữu', 'account_type' => 'EQUITY', 'normal_balance' => 'CREDIT'],
                            ['account_code' => '4112', 'name' => 'Thặng dư vốn cổ phần', 'account_type' => 'EQUITY', 'normal_balance' => 'CREDIT'],
                            ['account_code' => '4113', 'name' => 'Vốn khác của chủ sở hữu', 'account_type' => 'EQUITY', 'normal_balance' => 'CREDIT'],
                            ['account_code' => '4118', 'name' => 'Vốn đầu tư của chủ sở hữu khác', 'account_type' => 'EQUITY', 'normal_balance' => 'CREDIT'],
                        ]
                    ],
                    ['account_code' => '412', 'name' => 'Chênh lệch đánh giá lại tài sản', 'account_type' => 'EQUITY', 'normal_balance' => 'CREDIT'],
                    ['account_code' => '413', 'name' => 'Chênh lệch tỷ giá hối đoái', 'account_type' => 'EQUITY', 'normal_balance' => 'CREDIT'],
                    ['account_code' => '414', 'name' => 'Quỹ đầu tư phát triển', 'account_type' => 'EQUITY', 'normal_balance' => 'CREDIT'],
                    ['account_code' => '415', 'name' => 'Quỹ dự phòng tài chính', 'account_type' => 'EQUITY', 'normal_balance' => 'CREDIT'],
                    ['account_code' => '416', 'name' => 'Quỹ khác thuộc vốn chủ sở hữu', 'account_type' => 'EQUITY', 'normal_balance' => 'CREDIT'],
                    ['account_code' => '417', 'name' => 'Quỹ khen thưởng, phúc lợi', 'account_type' => 'EQUITY', 'normal_balance' => 'CREDIT'],
                    ['account_code' => '418', 'name' => 'Lợi nhuận sau thuế chưa phân phối', 'account_type' => 'EQUITY', 'normal_balance' => 'CREDIT'],
                    ['account_code' => '419', 'name' => 'Cổ phiếu quỹ', 'account_type' => 'EQUITY', 'normal_balance' => 'DEBIT'],
                ]
            ],

            // ==================== LOẠI 5: DOANH THU ====================
            [
                'account_code' => '5',
                'name' => 'Loại 5 - Doanh thu',
                'account_type' => 'REVENUE',
                'normal_balance' => 'CREDIT',
                'parent_id' => 0,
                'level' => 1,
                'children' => [
                    [
                        'account_code' => '511',
                        'name' => 'Doanh thu bán hàng và cung cấp dịch vụ',
                        'account_type' => 'REVENUE',
                        'normal_balance' => 'CREDIT',
                        'children' => [
                            ['account_code' => '5111', 'name' => 'Doanh thu bán hàng hóa', 'account_type' => 'REVENUE', 'normal_balance' => 'CREDIT'],
                            ['account_code' => '5112', 'name' => 'Doanh thu bán thành phẩm', 'account_type' => 'REVENUE', 'normal_balance' => 'CREDIT'],
                            ['account_code' => '5113', 'name' => 'Doanh thu cung cấp dịch vụ', 'account_type' => 'REVENUE', 'normal_balance' => 'CREDIT'],
                            ['account_code' => '5114', 'name' => 'Doanh thu trợ cấp, trợ giá', 'account_type' => 'REVENUE', 'normal_balance' => 'CREDIT'],
                            ['account_code' => '5117', 'name' => 'Doanh thu kinh doanh bất động sản đầu tư', 'account_type' => 'REVENUE', 'normal_balance' => 'CREDIT'],
                            ['account_code' => '5118', 'name' => 'Doanh thu khác', 'account_type' => 'REVENUE', 'normal_balance' => 'CREDIT'],
                        ]
                    ],
                    ['account_code' => '512', 'name' => 'Doanh thu bán hàng nội bộ', 'account_type' => 'REVENUE', 'normal_balance' => 'CREDIT'],
                    ['account_code' => '515', 'name' => 'Doanh thu hoạt động tài chính', 'account_type' => 'REVENUE', 'normal_balance' => 'CREDIT'],
                    [
                        'account_code' => '521',
                        'name' => 'Các khoản giảm trừ doanh thu',
                        'account_type' => 'REVENUE',
                        'normal_balance' => 'DEBIT',
                        'children' => [
                            ['account_code' => '5211', 'name' => 'Chiết khấu thương mại', 'account_type' => 'REVENUE', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '5212', 'name' => 'Hàng bán bị trả lại', 'account_type' => 'REVENUE', 'normal_balance' => 'DEBIT'],
                            ['account_code' => '5213', 'name' => 'Giảm giá hàng bán', 'account_type' => 'REVENUE', 'normal_balance' => 'DEBIT'],
                        ]
                    ],
                ]
            ],

            // ==================== LOẠI 6: CHI PHÍ SẢN XUẤT, KINH DOANH ====================
            [
                'account_code' => '6',
                'name' => 'Loại 6 - Chi phí sản xuất, kinh doanh',
                'account_type' => 'EXPENSE',
                'normal_balance' => 'DEBIT',
                'parent_id' => 0,
                'level' => 1,
                'children' => [
                    ['account_code' => '611', 'name' => 'Chi phí nguyên liệu, vật liệu trực tiếp', 'account_type' => 'EXPENSE', 'normal_balance' => 'DEBIT'],
                    ['account_code' => '612', 'name' => 'Chi phí nhân công trực tiếp', 'account_type' => 'EXPENSE', 'normal_balance' => 'DEBIT'],
                    ['account_code' => '613', 'name' => 'Chi phí sản xuất chung', 'account_type' => 'EXPENSE', 'normal_balance' => 'DEBIT'],
                    ['account_code' => '614', 'name' => 'Chi phí bán hàng', 'account_type' => 'EXPENSE', 'normal_balance' => 'DEBIT'],
                    ['account_code' => '615', 'name' => 'Chi phí quản lý doanh nghiệp', 'account_type' => 'EXPENSE', 'normal_balance' => 'DEBIT'],
                    ['account_code' => '616', 'name' => 'Chi phí tài chính', 'account_type' => 'EXPENSE', 'normal_balance' => 'DEBIT'],
                    ['account_code' => '617', 'name' => 'Chi phí khác', 'account_type' => 'EXPENSE', 'normal_balance' => 'DEBIT'],
                ]
            ],

            // ==================== LOẠI 7: THU NHẬP KHÁC ====================
            [
                'account_code' => '7',
                'name' => 'Loại 7 - Thu nhập khác',
                'account_type' => 'REVENUE',
                'normal_balance' => 'CREDIT',
                'parent_id' => 0,
                'level' => 1,
                'children' => [
                    ['account_code' => '711', 'name' => 'Thu nhập khác', 'account_type' => 'REVENUE', 'normal_balance' => 'CREDIT'],
                ]
            ],

            // ==================== LOẠI 8: CHI PHÍ KHÁC ====================
            [
                'account_code' => '8',
                'name' => 'Loại 8 - Chi phí khác',
                'account_type' => 'EXPENSE',
                'normal_balance' => 'DEBIT',
                'parent_id' => 0,
                'level' => 1,
                'children' => [
                    ['account_code' => '811', 'name' => 'Chi phí khác', 'account_type' => 'EXPENSE', 'normal_balance' => 'DEBIT'],
                ]
            ],

            // ==================== LOẠI 9: XÁC ĐỊNH KẾT QUẢ KINH DOANH ====================
            [
                'account_code' => '9',
                'name' => 'Loại 9 - Xác định kết quả kinh doanh',
                'account_type' => 'OTHER',
                'normal_balance' => 'DEBIT',
                'parent_id' => 0,
                'level' => 1,
                'children' => [
                    ['account_code' => '911', 'name' => 'Xác định kết quả kinh doanh', 'account_type' => 'OTHER', 'normal_balance' => 'DEBIT'],
                ]
            ],
        ];

        // Gọi hàm đệ quy để insert dữ liệu
        $this->insertAccounts($accounts);

        // Cập nhật nested set
        $this->nestedset->Get();
        $arr = $this->nestedset->Set();
        $this->nestedset->Recursive(0, $arr);
        $this->nestedset->Action();
    }

    /**
     * Hàm đệ quy để insert tài khoản và các tài khoản con
     */
    private function insertAccounts($accounts, $parentId = 0)
    {
        foreach ($accounts as $account) {
            // Tách dữ liệu tài khoản chính
            $accountData = [
                'account_code' => $account['account_code'],
                'account_type' => $account['account_type'],
                'normal_balance' => $account['normal_balance'],
                'parent_id' => $parentId,
                'publish' => 1,
                'user_id' => 1, // Mặc định user_id = 1
                'created_at' => now(),
                'updated_at' => now(),
            ];

            // Thêm level nếu có
            if (isset($account['level'])) {
                $accountData['level'] = $account['level'];
            }

            // Insert tài khoản chính
            $accountId = DB::table('accounting_accounts')->insertGetId($accountData);

            // Insert ngôn ngữ cho tài khoản
            DB::table('accounting_account_languages')->insert([
                'accounting_account_id' => $accountId,
                'language_id' => 1, // Mặc định language_id = 1
                'name' => $account['name'],
                'description' => $account['name'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Nếu có tài khoản con, gọi đệ quy
            if (isset($account['children']) && is_array($account['children']) && count($account['children']) > 0) {
                $this->insertAccounts($account['children'], $accountId);
            }
        }
    }
}