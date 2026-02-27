<?php

namespace App\Repositories\Product;

use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Product\ProductVariantRepositoryInterface;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;

class ProductVariantRepository extends BaseRepository implements ProductVariantRepositoryInterface
{
    protected $model;

    public function __construct(ProductVariant $model)
    {
        $this->model = $model;
        parent::__construct($model);
    }

    /**
     * Lấy thông tin sản phẩm với ngôn ngữ
     */
    public function getProductVariantWithLanguage($productVariantId, $languageId)
    {
        return DB::table('product_variants')
            ->leftJoin('products', 'products.id', '=', 'product_variants.product_id')
            ->leftJoin('product_languages', function ($join) use ($languageId) {
                $join->on('product_languages.product_id', '=', 'products.id')
                    ->where('product_languages.language_id', '=', $languageId);
            })
            ->leftJoin('product_variant_languages', function ($join) use ($languageId) {
                $join->on('product_variant_languages.product_variant_id', '=', 'product_variants.id')
                    ->where('product_variant_languages.language_id', '=', $languageId);
            })
            ->leftJoin('units', 'units.id', '=', 'product_variants.unit_id')
            ->where('product_variants.id', $productVariantId)
            ->select([
                'product_variants.id',
                'product_variants.uuid',
                'product_variants.product_id',
                'product_variants.code',
                'product_variants.sku',
                'product_variants.barcode',
                'product_variants.base_price',
                'product_variants.publish',
                'product_variants.unit_id',
                'product_variants.album',
                'product_variants.file_name',
                'product_variants.file_url',
                'product_languages.name as product_name',
                'product_variant_languages.name as variant_name',
                DB::raw("CONCAT(COALESCE(product_languages.name, ''), ' - ', COALESCE(product_variant_languages.name, '')) as full_name"),
                'units.name as unit_name',
            ])
            ->first();
    }

    /**
     * Lấy danh sách sản phẩm theo product_id
     */
    public function getVariantsByProductId(int $productId, int $languageId = 1)
    {
        return DB::table('product_variants')
            ->leftJoin('product_variant_languages', function ($join) use ($languageId) {
                $join->on('product_variant_languages.product_variant_id', '=', 'product_variants.id')
                    ->where('product_variant_languages.language_id', '=', $languageId);
            })
            ->leftJoin('units', 'units.id', '=', 'product_variants.unit_id')
            ->where('product_variants.product_id', $productId)
            ->where('product_variants.publish', 1)
            ->select([
                'product_variants.id',
                'product_variants.sku',
                'product_variants.code',
                'product_variants.barcode',
                'product_variants.base_price',
                'product_variant_languages.name as variant_name',
                'units.name as unit_name',
            ])
            ->get();
    }

    /**
     * Tìm variant theo attribute
     */
    public function findVariantByAttributeString(int $productId, string $attributeString)
    {
        return $this->findByCondition([
            ['product_id', '=', $productId],
            ['code', '=', $attributeString],
        ]);
    }
}