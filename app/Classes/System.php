<?php 
namespace App\Classes;

class System {
    public function __construct() {
        //
    }

    public function config() {
        return [
            'homepage' => $this->buildSectionConfig('homepage', [
                'company' => 'text',
                'brand' => 'text',
                'slogan' => 'text',
                'logo' => 'image',
                'favicon' => 'image',
                'short_info' => 'editor',
            ], '01'),
            
            'contact' => $this->buildSectionConfig('contact', [
                'office' => 'text',
                'address' => 'text',
                'hotline' => 'text',
                'technical_phone' => 'text',
                'sell_phone' => 'text',
                'phone' => 'text',
                'fax' => 'text',
                'email' => 'text',
                'website' => 'text',
                'map' => 'textarea',
            ], '02', [
                'map' => [
                    'link' => [
                        'text' => trans('system.contact.value.map.link.text'),
                        'href' => 'https://manhan.vn/hoc-website-nang-cao/huong-dan-nhung-ban-do-vao-website/',
                        'target' => '_blank'
                    ]
                ]
            ]),
            
            'seo' => $this->buildSectionConfig('seo', [
                'meta_title' => 'text',
                'meta_keyword' => 'text',
                'meta_description' => 'text',
                'meta_image' => 'image',
            ], '03'),
            
            'socical' => $this->buildSectionConfig('socical', [
                'facebook' => 'text',
                'youtube' => 'text',
                'twitter' => 'text',
                'tiktok' => 'text',
                'instagram' => 'text',
            ], '04'),
        ];
    }

    protected function buildSectionConfig(string $section, array $fields, string $index, array $extraAttributes = []): array
    {
        $config = [
            'index' => $index,
            'label' => trans("system.{$section}.label"),
            'description' => trans("system.{$section}.description"),
            'value' => [],
        ];

        foreach ($fields as $field => $type) {
            $fieldConfig = [
                'type' => $type,
                'label' => trans("system.{$section}.value.{$field}.label"),
                'placeholder' => trans("system.{$section}.value.{$field}.placeholder"),
            ];

            if (isset($extraAttributes[$field])) {
                $fieldConfig = array_merge($fieldConfig, $extraAttributes[$field]);
            }

            $config['value'][$field] = $fieldConfig;
        }

        return $config;
    }
}