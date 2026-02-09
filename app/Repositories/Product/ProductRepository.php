<?php

namespace App\Repositories\Product;
use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Product\ProductRepositoryInterface;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class ProductRepository extends BaseRepository implements ProductRepositoryInterface {
    protected $model;

    public function __construct(Product $model) {
        $this->model = $model;
    }

    public function filterProductByCondition($filters) {
        $productQuery = $this->model
            ->join('product_languages as pl', 'pl.product_id', '=', 'products.id')
            ->join('product_catalogue_products as pcp', 'pcp.product_id', '=', 'products.id')
            ->leftJoin('product_variants as pv', 'pv.product_id', '=', 'products.id')
            ->leftJoin('product_variant_languages as pvl', 'pvl.product_variant_id', '=', 'pv.id')
            ->join('product_variant_attributes as pva', 'pva.product_variant_id', '=', 'pv.id')
            ->leftJoin('reviews', function ($join) {
                $join->on('reviews.reviewable_id', '=', 'products.id')
                    ->where('reviews.reviewable_type', '=', 'App\\Models\\Product');
            })
            ->select([
                'products.id',
                'products.image',
                'pl.name',
                'pl.canonical',
                'pv.sku',
                'pv.uuid',
                'pv.price',
                'pv.id as product_variant_id',
                'pv.album',
                'pvl.name as variant_name',
                'pva.attribute_id',
                DB::raw('AVG(reviews.score) as average_rating'),
                DB::raw('COUNT(reviews.id) as review_count'),
            ])
            ->whereRaw(
                'pcp.product_catalogue_id IN (
                    SELECT id
                    FROM product_catalogues
                    WHERE lft >= (SELECT lft FROM product_catalogues WHERE id = ?)
                    AND rgt <= (SELECT rgt FROM product_catalogues WHERE id = ?)
                )',
                [$filters['catId'], $filters['catId']]
            )
            ->groupBy('pl.canonical');
    
        if (!empty($filters['attributeArray'])) {
            $productQuery->whereIn('pva.attribute_id', $filters['attributeArray']);
        }
    
        if (!empty($filters['finalCondition'])) {
            $productQuery->havingRaw($filters['finalCondition'], $filters['bindings']);
        }
    
        $products = $productQuery->paginate($filters['perpage']);
    
    
        $filteredProducts = $products->filter(function ($item) {
            return $item !== null;
        });
    
        $paginatedResults = new \Illuminate\Pagination\LengthAwarePaginator(
            $filteredProducts->values(),
            $products->total(),
            $products->perPage(),
            $products->currentPage(),
            [
                'path' => $products->path(),
            ]
        );
    
        return $paginatedResults;
    }

    public function getAllProducts(array $condition = [], array $attributeArray = []) {
        $query = Product::select(
                'products.id',
                'products.product_catalogue_id',
                'products.made_in',
                'products.publish', 
                'products.image', 
                'products.follow', 
                'pl.name', 
                'pl.canonical',
                'pl.language_id',)
        ->join('product_languages as pl', 'pl.product_id', '=', 'products.id')
        ->leftJoin('product_variants as pv', 'pv.product_id', '=', 'products.id')
        ->with(['product_variants', 'reviews'])
        ->whereNull('products.deleted_at')
        ->groupBy(
                'products.id',
                'products.product_catalogue_id',
                'products.publish',
                'products.made_in',
                'products.image',
                'products.follow',
                'pl.name',
                'pl.canonical',
                'pl.language_id'
        );

        foreach ($condition as $cond) {
            if (is_array($cond[1])) {
                $query->whereIn($cond[0], $cond[1]);
            } else {
                $query->where($cond[0], $cond[1], $cond[2] ?? null);
            }
        }

        // Lọc theo thuộc tính (nếu có)
        if (!empty($attributeArray)) {
            foreach ($attributeArray as $attrId) {
                $query->whereRaw("FIND_IN_SET('$attrId', REPLACE(pv.code, ' ', ''))");
            }
        }

        return $query->get();
    }
}
