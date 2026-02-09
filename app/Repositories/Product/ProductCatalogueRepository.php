<?php

namespace App\Repositories\Product;
use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Product\ProductCatalogueRepositoryInterface;
use App\Models\ProductCatalogue;


class ProductCatalogueRepository extends BaseRepository implements ProductCatalogueRepositoryInterface {
    protected $model;

    public function __construct(ProductCatalogue $model) {
        $this->model = $model;
    }
}
