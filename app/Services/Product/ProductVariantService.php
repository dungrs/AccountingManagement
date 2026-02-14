<?php

namespace App\Services\Product;

use App\Services\Interfaces\Product\ProductVariantServiceInterface;

use App\Services\BaseService;

use App\Repositories\Product\ProductRepository;
use App\Repositories\Product\ProductVariantRepository;
use Illuminate\Support\Facades\DB;

class ProductVariantService extends BaseService implements ProductVariantServiceInterface
{
    protected $productRepository;
    protected $productVariantRepository;
    public function __construct(ProductRepository $productRepository, ProductVariantRepository $productVariantRepository)
    {
        $this->productRepository = $productRepository;
        $this->productVariantRepository = $productVariantRepository;
    }

    public function getProductVariant($payload, $languageId, $attributeString)
    {
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
                'product_variants.base_price',
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

    public function getListProductVariant()
    {
        $languageId = 1;

        $condition = [
            ['product_variants.publish', '=', 1]
        ]; // không cần where thêm

        $select = [
            'product_variants.id as product_variant_id',
            DB::raw("CONCAT(product_languages.name, ' - ', product_variant_languages.name) as name")
        ];

        $joins = [
            [
                'table' => 'products',
                'on' => [
                    ['products.id', 'product_variants.product_id'],
                ],
            ],
            [
                'table' => 'product_languages',
                'on' => [
                    ['product_languages.product_id', 'products.id'],
                    ['product_languages.language_id', $languageId],
                ],
            ],
            [
                'table' => 'product_variant_languages',
                'on' => [
                    ['product_variant_languages.product_variant_id', 'product_variants.id'],
                    ['product_variant_languages.language_id', $languageId],
                ],
            ],
        ];

        $groupBy = [
            'product_variants.id',
            'product_languages.name',
            'product_variant_languages.name'
        ];

        return $this->productVariantRepository->findByCondition(
            $condition,
            true,          // lấy nhiều record
            $joins,
            [],            // orderBy
            $select,
            [],            // relations
            null,          // paginate
            $groupBy
        );
    }

    /**
     * Tăng tồn kho khi nhập hàng
     */
    public function increaseStock($items)
    {
        foreach ($items as $item) {
            $productVariant = $this->productVariantRepository->findById($item->product_variant_id);

            $this->productVariantRepository->update($item->product_variant_id, [
                'quantity' => $productVariant->quantity + $item->quantity
            ]);
        }

        return true;
    }

    /**
     * Giảm tồn kho khi hủy phiếu nhập
     */
    public function decreaseStock($items)
    {
        foreach ($items as $item) {
            $productVariant = $this->productVariantRepository->findById($item->product_variant_id);

            $newQuantity = $productVariant->quantity - $item->quantity;

            if ($newQuantity < 0) {
                throw new \Exception("Số lượng tồn kho của sản phẩm {$productVariant->name} không đủ để trừ.");
            }

            $this->productVariantRepository->update($item->product_variant_id, [
                'quantity' => $newQuantity
            ]);
        }

        return true;
    }

    /**
     * Kiểm tra tồn kho có đủ không
     */
    public function checkStockAvailability($items)
    {
        foreach ($items as $item) {
            $productVariant = $this->productVariantRepository->findById($item->product_variant_id);

            if ($productVariant->quantity < $item->quantity) {
                return [
                    'available' => false,
                    'product'   => $productVariant->name,
                    'required'  => $item->quantity,
                    'current'   => $productVariant->quantity,
                ];
            }
        }

        return ['available' => true];
    }
}
