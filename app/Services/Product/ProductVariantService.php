<?php

namespace App\Services\Product;

use App\Services\Interfaces\Product\ProductVariantServiceInterface;
use App\Services\BaseService;
use App\Repositories\Product\ProductRepository;
use App\Repositories\Product\ProductVariantRepository;
use App\Repositories\Inventory\InventoryTransactionRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ProductVariantService extends BaseService implements ProductVariantServiceInterface
{
    protected $productRepository;
    protected $productVariantRepository;
    protected $inventoryTransactionRepository;

    public function __construct(
        ProductRepository $productRepository,
        ProductVariantRepository $productVariantRepository,
        InventoryTransactionRepository $inventoryTransactionRepository,
    ) {
        $this->productRepository = $productRepository;
        $this->productVariantRepository = $productVariantRepository;
        $this->inventoryTransactionRepository = $inventoryTransactionRepository;
    }

    public function update($request)
    {
        return DB::transaction(function () use ($request) {
            $productVariantId = $request->input('id');
            $flag = $this->updateProductVariant($request, $productVariantId);

            if (!$flag) {
                throw new \Exception("Cập nhật nhóm thành viên thất bại.");
            }

            return true;
        });
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

    private function updateProductVariant($request, $id)
    {
        $payload = $request->only($this->payload());
        return $this->productVariantRepository->update($id, $payload);
    }

    private function payload()
    {
        return ['barcode', 'sku', 'quantity'];
    }

    public function getListProductVariant()
    {
        $languageId = 1;

        $condition = [
            ['product_variants.publish', '=', 1]
        ];

        $select = [
            'product_variants.id as product_variant_id',
            DB::raw("CONCAT(product_languages.name, ' - ', product_variant_languages.name) as name"),
            'product_variants.quantity',
            'product_variants.base_price',
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
            'product_variant_languages.name',
            'product_variants.quantity',
            'product_variants.base_price',
        ];

        $variants = $this->productVariantRepository->findByCondition(
            $condition,
            true,
            $joins,
            [],
            $select,
            [],
            null,
            $groupBy
        );

        return $variants;
    }


    /**
     * Hàm riêng để lấy tên product variant sử dụng BaseRepository
     */
    public function getProductNameByVariant($productVariantId, $languageId)
    {
        try {
            $result = $this->productVariantRepository->findByCondition(
                [
                    ['product_variants.id', '=', $productVariantId]
                ],
                false, // lấy 1 record
                [ // joins
                    [
                        'table' => 'products',
                        'on' => [
                            ['products.id', 'product_variants.product_id']
                        ],
                        'type' => 'inner'
                    ],
                    [
                        'table' => 'product_languages',
                        'on' => [
                            ['product_languages.product_id', 'products.id'],
                        ],
                        'type' => 'left'
                    ],
                ],
                [], // orderBy
                [ // select
                    'product_variants.id as product_variant_id',
                    'product_languages.name'
                ]
            );

            if ($result && $result->name) {
                return $result->name;
            }
        } catch (\Exception $e) {
            Log::error('Error in getProductVariantName: ' . $e->getMessage());
        }

        // Fallback: lấy từ productVariant relation
        if (isset($this->productVariant)) {
            return $this->productVariant->sku ?? 'N/A';
        }

        return 'N/A';
    }
}
