<?php

namespace App\Repositories\Product;
use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Product\ProductVariantLanguageRepositoryInterface;
use App\Models\ProductVariantLanguage;


class ProductVariantLanguageRepository extends BaseRepository implements ProductVariantLanguageRepositoryInterface {
    protected $model;

    public function __construct(ProductVariantLanguage $model) {
        $this->model = $model;
    }
}
