<?php

namespace App\Repositories\Product;
use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Product\ProductVariantRepositoryInterface;
use App\Models\ProductVariant;


class ProductVariantRepository extends BaseRepository implements ProductVariantRepositoryInterface {
    protected $model;

    public function __construct(ProductVariant $model) {
        $this->model = $model;
    }
}
