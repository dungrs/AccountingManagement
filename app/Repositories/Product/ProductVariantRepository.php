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
    }

    public function getProductVariant($languageId)
    {
        return $this->model
            ->select([
                'product_variants.id as product_variant_id',
                DB::raw("CONCAT(product_languages.name, ' - ', product_variant_languages.name) as name")
            ])
            ->join('products', 'products.id', '=', 'product_variants.product_id')

            ->join('product_languages', function ($join) use ($languageId) {
                $join->on('product_languages.product_id', '=', 'products.id')
                    ->where('product_languages.language_id', '=', $languageId);
            })

            ->join('product_variant_languages', function ($join) use ($languageId) {
                $join->on('product_variant_languages.product_variant_id', '=', 'product_variants.id')
                    ->where('product_variant_languages.language_id', '=', $languageId);
            })

            ->get();
    }
}
