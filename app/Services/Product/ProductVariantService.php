<?php

namespace App\Services\Product;
use App\Services\Interfaces\Product\ProductVariantServiceInterface;

use App\Services\BaseService;

use App\Repositories\Product\ProductRepository;
use App\Repositories\Product\ProductVariantRepository;

class ProductVariantService extends BaseService implements ProductVariantServiceInterface
{   
    protected $productRepository;
    protected $productVariantRepository;
    public function __construct(ProductRepository $productRepository, ProductVariantRepository $productVariantRepository) {
        $this->productRepository = $productRepository;
        $this->productVariantRepository = $productVariantRepository;
    }

    public function getProductVariant($payload, $languageId, $attributeString) {
        $variants = $this->productVariantRepository->findByCondition(
            [
                ['pvl.language_id', '=', $languageId],
                ['product_variants.product_id', '=', $payload['product_id']]
            ],
            true,
            [
                [
                    'table' => 'product_variant_languages as pvl',
                    'on' => [['pvl.product_variant_id', 'product_variants.id']]
                ]
            ],
            ['product_variants.id' => 'ASC'],
            [
                'product_variants.id',
                'product_variants.quantity',
                'product_variants.sku',
                'product_variants.code',
                'product_variants.price',
                'product_variants.uuid',
                'pvl.*',
            ]
        );
        
        foreach ($variants as $variant) {
            $dbAttributeId = explode(',', $variant->code);
            $dbAttributeString = sortAttributeId($dbAttributeId); 
    
            if ($dbAttributeString == $attributeString) {
                return $variant;
            }
        }
    }
}
