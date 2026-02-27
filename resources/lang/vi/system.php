<?php

return [
    'homepage' => [
        'label' => 'Thông tin chung',
        'description' => 'Thiết lập đầy đủ các thông tin cơ bản của website như tên công ty, thương hiệu, logo, favicon, v.v.',
        'value' => [
            'company' => [
                'label' => 'Tên công ty',
                'placeholder' => 'Nhập tên công ty...',
            ],
            'brand' => [
                'label' => 'Tên thương hiệu',
                'placeholder' => 'Nhập tên thương hiệu...',
            ],
            'slogan' => [
                'label' => 'Khẩu hiệu (Slogan)',
                'placeholder' => 'Nhập khẩu hiệu của công ty...',
            ],
            'logo' => [
                'label' => 'Logo Website',
                'placeholder' => 'Nhấn vào ô bên dưới để tải lên Logo của website',
            ],
            'favicon' => [
                'label' => 'Favicon',
                'placeholder' => 'Nhấn vào ô bên dưới để tải lên biểu tượng Favicon (hiển thị trên tab trình duyệt)',
            ],
            'short_info' => [
                'label' => 'Giới thiệu ngắn',
                'placeholder' => 'Nhập đoạn giới thiệu ngắn gọn về công ty hoặc website...',
            ],
        ],
    ],

    'contact' => [
        'label' => 'Thông tin liên hệ',
        'description' => 'Cài đặt đầy đủ các thông tin liên hệ của website, bao gồm địa chỉ công ty, văn phòng giao dịch, số điện thoại, email, bản đồ, v.v.',
        'value' => [
            'office' => [
                'label' => 'Địa chỉ công ty',
                'placeholder' => 'Nhập địa chỉ chính của công ty...',
            ],
            'address' => [
                'label' => 'Văn phòng giao dịch',
                'placeholder' => 'Nhập địa chỉ văn phòng giao dịch...',
            ],
            'hotline' => [
                'label' => 'Hotline chung',
                'placeholder' => 'Nhập số điện thoại hotline chính...',
            ],
            'technical_phone' => [
                'label' => 'Hotline kỹ thuật',
                'placeholder' => 'Nhập số hotline hỗ trợ kỹ thuật...',
            ],
            'sell_phone' => [
                'label' => 'Hotline kinh doanh',
                'placeholder' => 'Nhập số hotline tư vấn kinh doanh...',
            ],
            'phone' => [
                'label' => 'Số điện thoại cố định',
                'placeholder' => 'Nhập số điện thoại cố định...',
            ],
            'fax' => [
                'label' => 'Mã số thuế',
                'placeholder' => 'Nhập mã số thuế doanh nghiệp...',
            ],
            'email' => [
                'label' => 'Email liên hệ',
                'placeholder' => 'Nhập địa chỉ email liên hệ...',
            ],
            'website' => [
                'label' => 'Website',
                'placeholder' => 'Nhập đường dẫn website chính thức...',
            ],
            'map' => [
                'label' => 'Bản đồ',
                'placeholder' => 'Nhúng mã iframe bản đồ từ Google Maps...',
            ],
            'map_link_text' => 'Hướng dẫn thiết lập bản đồ',
        ],
    ],

    'seo' => [
        'label' => 'Cấu hình SEO cho trang chủ',
        'description' => 'Thiết lập đầy đủ thông tin SEO cho trang chủ của website, bao gồm Tiêu đề SEO, Từ khóa SEO, Mô tả SEO và Ảnh hiển thị (Meta Image).',
        'value' => [
            'meta_title' => [
                'label' => 'Tiêu đề SEO',
                'placeholder' => 'Nhập tiêu đề SEO cho trang chủ...',
            ],
            'meta_keyword' => [
                'label' => 'Từ khóa SEO',
                'placeholder' => 'Nhập các từ khóa liên quan đến trang chủ...',
            ],
            'meta_description' => [
                'label' => 'Mô tả SEO',
                'placeholder' => 'Nhập đoạn mô tả ngắn cho nội dung trang chủ...',
            ],
            'meta_image' => [
                'label' => 'Ảnh SEO (Meta Image)',
                'placeholder' => 'Chọn hình ảnh đại diện khi chia sẻ trang chủ...',
            ],
        ],
    ],

    'socical' => [
        'label' => 'Cấu hình Mạng xã hội cho trang chủ',
        'description' => 'Thiết lập các liên kết đến các nền tảng mạng xã hội của website để hiển thị tại trang chủ như Facebook, YouTube, Twitter, v.v.',
        'value' => [
            'facebook' => [
                'label' => 'Facebook',
                'placeholder' => 'Nhập đường dẫn đến trang Facebook của bạn...',
            ],
            'youtube' => [
                'label' => 'YouTube',
                'placeholder' => 'Nhập đường dẫn đến kênh YouTube của bạn...',
            ],
            'twitter' => [
                'label' => 'Twitter',
                'placeholder' => 'Nhập đường dẫn đến trang Twitter của bạn...',
            ],
            'tiktok' => [
                'label' => 'TikTok',
                'placeholder' => 'Nhập đường dẫn đến tài khoản TikTok của bạn...',
            ],
            'instagram' => [
                'label' => 'Instagram',
                'placeholder' => 'Nhập đường dẫn đến trang Instagram của bạn...',
            ],
        ],
    ],
];