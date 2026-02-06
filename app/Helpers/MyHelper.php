<?php

if (!function_exists('resolveInstance')) {
    function resolveInstance(string $model = '', string $modelFolder = '', string $folder = 'Services', string $interface = 'Service') {
        $interfaceNamespace = "\\App\\$folder\\$model$interface";
        if ($modelFolder != '') {
            $interfaceNamespace = "\\App\\$folder\\$modelFolder\\$model$interface";
        }

        
        if (!class_exists($interfaceNamespace)) {
            return response()->json([
                'error' => 'Interface not found: ' . $interfaceNamespace
            ], 404);
        }
        
        return app($interfaceNamespace);
    }
}

if (!function_exists('splitStringByUpperCase')) {
    function splitStringByUpperCase($string) {
        $parts = preg_split('/(?=[A-Z])/', $string);
        $parts = array_filter($parts);
        return array_values($parts);
    }
}

if (!function_exists('convertDateTime')) {
    function convertDateTime($dateTime, $stringFormatDate = 'd/m/Y H:i:s')
    {
        return \Carbon\Carbon::parse($dateTime)->format($stringFormatDate);
    }
}

if (!function_exists('convertDateToDatabaseFormat')) {
    function convertDateToDatabaseFormat($date) {
        $dateObject = DateTime::createFromFormat('d/m/Y', $date);
        
        if ($dateObject) {
            return $dateObject->format('Y-m-d');
        } else {
            return null;
        }
    }
}

if (!function_exists('toSnakeCase')) {
    function toSnakeCase($input) {
        return strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $input));
    }
}

if (!function_exists('convertModelToField')) {
    function convertModelToField($model) {
        $temp = strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $model));
        return $temp . '_id';
    }
}

if (!function_exists('sortString')) {
    function sortString($string = '')
    {
        $extract = explode(',', $string);
        sort($extract, SORT_NUMERIC);
        $newArray = implode(',', $extract);
        return $newArray;
    }
}

if (!function_exists('parseValue')) {
    function parseValue($value = '')
    {
        return $value ? str_replace(',', '', $value) : 0;
    }
}

if (!function_exists('renderSystemInput')) {
    function renderSystemInput(string $name = '', $placeholder = '', $systems = null): string {
        $value = old($name, $systems[$name] ?? '');
        return <<<HTML
            <input type="text" name="config[$name]" value="$value" class="form-control" placeholder="$placeholder" autocomplete="off">
            HTML;
    }
}

if (!function_exists('renderSystemImage')) {
    function renderSystemImage(string $name = '', $placeholder = '', $systems = null): string {
        $value = old($name, $systems[$name] ?? '');
        return <<<HTML
            <input type="text" name="config[$name]" value="$value" class="form-control upload-image" placeholder="$placeholder" autocomplete="off">
            HTML;
    }
}

if (!function_exists('renderSystemTextarea')) {
    function renderSystemTextarea(string $name = '', $placeholder = '', $systems = null): string {
        $value = old($name, $systems[$name] ?? '');
        return <<<HTML
            <textarea name="config[$name]" class="form-control system-textarea" autocomplete="off" placeholder="$placeholder">$value</textarea>
            HTML;
    }
}

if (!function_exists('renderSystemEditor')) {
    function renderSystemEditor(string $name = '', $placeholder = '', $systems = null): string {
        $value = old($name, $systems[$name] ?? '');
        return <<<HTML
            <textarea id="$name" name="config[$name]" class="form-control ckeditor-classic" placeholder="$placeholder">$value</textarea>
            HTML;
    }
}

if (!function_exists('convert_array')) {
    function convert_array($system = null, $keyword = '', $value = '') {
        $temp = [];
        if (is_array($system)) {
            foreach($system as $key => $val) {
                $temp[$keyword] = $val[$value];
            }
        }

        if (is_object($system)) {
            foreach($system as $key => $val) {
                $temp[$val->$keyword] = $val->{$value};
            }
        }

        return $temp;
    }
}

if (!function_exists('recursive')) {
    function recursive($datas = [], $parentId = 0, $level = 1, $maxDepth = 5) {
        $result = [];
        if ($level > $maxDepth) {
            return $result;
        }

        foreach($datas as $data) {
            if ($data->parent_id == $parentId) {
                $currentItem = [
                    'item' => $data,
                    'children' => recursive($datas, $data->id, $level + 1, $maxDepth)
                ];
                $result[] = $currentItem;
            }
        }

        return $result;
    }
}

if (!function_exists('backendRecursiveMenu')) {
    function backendRecursiveMenu($datas, $menuCatalogue,  $level = 1) {
        if (empty($datas)) {
            return '';
        }

        $html = '<ol class="dd-list">';
        foreach($datas as $menuNode) {
            $menu = $menuNode['item'];

            $route = route('menu.children', ['parent_id' => $menu->id, 'menu_catalogue_id' => $menuCatalogue->id]);
            $menuHtml = <<<HTML
                <li class="dd-item dd-item-primary" data-id="{$menu->id}">
                    <div class="dd-handle bg-soft-info">
                        <div class="d-flex align-items-center justify-content-between">
                            <div>
                                <i class="mdi mdi-drag-vertical text-primary me-2"></i>
                                <span class="fw-medium">{$menu->name}</span>
                            </div>
                            <div>
                                <a href="{$route}" class="btn btn-sm btn-outline-success">
                                    <i class="mdi mdi-plus me-1"></i> Quản lý menu con
                                </a>
                            </div>
                        </div>
                    </div>
            HTML;
            if (!empty($menuNode['children'])) {
                $menuHtml .= backendRecursiveMenu($menuNode['children'], $menuCatalogue, $level + 1);
            }
            $menu .= '</li>';
            $html .= $menuHtml;
        }

        $html .= '</ol>';
        return $html;
    }
}

if (!function_exists('writeUrl')) {
    function writeUrl(string $canonical, bool $fullDomain = true, $suffix = false): string {
        if (filter_var($canonical, FILTER_VALIDATE_URL)) {
            return $canonical;
        }

        $baseUrl = $fullDomain ? rtrim(config('app.url'), '/') : '';
        $url = $baseUrl . '/' . ltrim($canonical, '/');

        if ($suffix !== false) {
            $url .= ($suffix === true) ? config('apps.general.suffix') : $suffix;
        }
        
        if ($canonical == '/') {
            $url = config('app.url');
        }

        return $url;
    }
}

if (!function_exists('groupTranslationsByLanguage')) {
    function groupTranslationsByLanguage($menus, $languages)
    {
        $result = [];
    
        foreach ($languages as $language) {
            $result[$language->id] = [];
        }
    
        $baseMenus = [];
        foreach ($menus as $menu) {
            $baseMenus[] = [
                'menu_id' => $menu->id,
                'name' => null,
                'canonical' => null
            ];
        }
    
        foreach ($languages as $language) {
            $langId = $language->id;
            
            $result[$langId] = $baseMenus;
            
            foreach ($menus as $index => $menu) {
                if (!empty($menu->translations)) {
                    $translation = $menu->translations->firstWhere('language_id', $langId);
                    
                    if ($translation) {
                        $result[$langId][$index] = [
                            'menu_id' => $menu->id,
                            'name' => $translation->name ?? null,
                            'canonical' => $translation->canonical ?? null
                        ];
                    }
                }
            }
        }
    
        return $result;
    }
}

if (!function_exists('convertArray')) {
    function convertArray(array $feilds = [], $data) : array {
        $temp = [];
        foreach ($data as $key => $val) {
            foreach ($feilds as $feild) {
                $temp[$feild][] = $val[$feild];
            }
        }
        return $temp;
    }
}

if (!function_exists('formatDateTime')) {
    function formatDateTime($datetime) {
        if (empty($datetime)) return '';
        return \Carbon\Carbon::parse($datetime)->format('d/m/Y H:i:s');
    }
}

if (!function_exists('writeUrl')) {
    function writeUrl(string $canonical, bool $fullDomain = true, $suffix = false): string {
        if (filter_var($canonical, FILTER_VALIDATE_URL)) {
            return $canonical;
        }

        $fileUrl = ($fullDomain ? config('app.url') : '') . $canonical;

        if ($suffix !== false) {
            $fileUrl .= $suffix === true ? config('apps.general.suffix') : '';
        }

        return $fileUrl;
    }
}

if (!function_exists('image')) {
    function image(string $image = '')
    {
        return $image;
    }
}

if (!function_exists('getDiscount')) {
    function getDiscountType($promotion)
    {
        $discount = [
            'type' => $promotion['discountType'] === 'percent' ? '%' : 'đ',
            'value' => number_format($promotion['discountValue']),
            'old_price' => number_format($promotion['product_price']),
            'sale_price' => number_format($promotion['product_price'] - $promotion['finalDiscount'])
        ];
        return $discount;
    }
}

// NOTE
if (!function_exists('seo')) {
    function seo($model, $page = 1)
    {       
        $canonical = ($page > 1) ? writeUrl($model->canonical, true, false) . '/trang-' . $page . config('apps.general.suffix') : writeUrl($model->canonical, true, true);
        return [
            'meta_title' => (!empty($model->meta_title)) ? $model->meta_title : $model->name,
            'meta_keyword' => (!empty($model->meta_keyword)) ? $model->meta_keyword : $model->keyword,
            'meta_description' => (!empty($model->meta_description)) ? $model->meta_description : cutStringAndDecode($model->description, 168),
            'meta_image' => $model->image,
            'canonical' => $canonical,
        ];
    }
}

if (!function_exists('cutStringAndDecode')) {
    function cutStringAndDecode($str = null, $n = 200)
    {
        $str = html_entity_decode($str);
        $str = strip_tags($str);
        $str = cutnchar($str, $n);
        return $str;
    }
}

if (!function_exists('cutnchar')) {
    function cutnchar($str = null, $n = 200)
    {
        if (strlen($str) < $n) return $str;
        $html = substr($str, 0, $n);
        $html = substr($html, 0, strrpos($html, '' ));
        return $str;
    }
}

if (!function_exists('sortAttributeId')) {
    function sortAttributeId($attributeId = [])
    {
        sort($attributeId);
        $attributeString = implode(', ', array_map('trim', $attributeId));
        return $attributeString;
    }
}

if (!function_exists('convert_price')) {
    function convert_price($price, $convertString = false)
    {
        if ($convertString && is_string($price)) {
            $price = str_replace(',', '', $price);

            if (!is_numeric($price)) {
                return 0;
            }

            return (float)$price;
        }

        $price = is_numeric($price) ? $price : 0;

        return number_format($price, 0, '.', ',') . ' ₫';
    }
}

if (!function_exists('momoConfig')) {
    function momoConfig()
    {
        return [
            'partnerCode' => 'MOMOBKUN20180529',
            'accessKey' => 'klm05TvNBzhg7h7j',
            'secretKey' => 'at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa',
        ];
    }
}

if (!function_exists('vnpayConfig')) {
    function vnpayConfig()
    {
        return [
            'vnp_Url' => "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
            'vnp_Returnurl' => writeUrl('return/vnpay', true, true),
            'vnp_TmnCode' => "G6L716W4",
            'vnp_HashSecret' => "M74X8D7R90ZISXHP2J2HYY6TZ8D9MJ52",
            'vnp_apiUrl' => "https://sandbox.vnpayment.vn/merchant_webapi/merchant.html",
            'apiUrl' => "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
        ];
    }
}

if (!function_exists('execPostRequest')) {
    function execPostRequest($url, $data)
    {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                'Content-Type: application/json',
                'Content-Length: ' . strlen($data))
        );
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
        $result = curl_exec($ch);
        curl_close($ch);
        return $result;
    }
}

if (!function_exists('generateStar')) {
    function generateStar($rating)
    {
        $rating = max(0, min(5, (float)$rating));
        
        $fullStars = floor($rating);
        $hasHalfStar = ($rating - $fullStars) >= 0.5;
        $emptyStars = 5 - $fullStars - ($hasHalfStar ? 1 : 0);
        
        $output = '';
        
        for ($i = 0; $i < $fullStars; $i++) {
            $output .= '<i class="me-1 fas fa-star text-warning"></i>';
        }
        
        if ($hasHalfStar) {
            $output .= '<i class="me-1 fas fa-star-half-alt text-warning"></i>';
        }
        
        for ($i = 0; $i < $emptyStars; $i++) {
            $output .= '<i class="me-1 far fa-star text-warning"></i>';
        }
        
        return $output;
    }
}

if (!function_exists('growth')) {
    function growth($currentValue, $previousValue) {
        $division = ($previousValue == 0 ) ? 1 : $previousValue;
        $grow = ($currentValue - $previousValue) / $division * 100;
        return number_format($grow, 1);
    }
}

if (!function_exists('growthRevenue')) {
    function growthRevenue($currentRevenueValue, $previousRevenueValue) {
        if ($previousRevenueValue > 0) {
            $growth = (($currentRevenueValue - $previousRevenueValue) / $previousRevenueValue) * 100;
        }
        return number_format($growth ?? 0, 1);
    }
}

if (!function_exists('convertRevenueChartData')) {
    function convertRevenueChartData($chartData, $data = 'monthly_revenue', $label = 'month', $text = null) {
        $text = $text ?? __('messages.month') . ' ';

        $revenueLabelList = [
            'data' => [],
            'label' => []
        ];

        if (!is_null($chartData) && count($chartData) > 0) {
            foreach ($chartData as $val) {
                $revenueLabelList['data'][] = $val->{$data};
                $revenueLabelList['label'][] = $text . $val->{$label};
            }
        }

        return $revenueLabelList;
    }
}
