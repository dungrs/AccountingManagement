<?php

namespace App\Repositories\Product;
use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Product\ProductVariantAttributeRepositoryInterface;
use App\Models\ProductVariantAttribute;


class ProductVariantAttributeRepository extends BaseRepository implements ProductVariantAttributeRepositoryInterface {
    protected $model;

    public function __construct(ProductVariantAttribute $model) {
        $this->model = $model;
    }
}
