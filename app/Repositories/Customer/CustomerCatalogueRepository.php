<?php

namespace App\Repositories\Customer;
use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Customer\CustomerCatalogueRepositoryInterface;
use App\Models\CustomerCatalogue;


class CustomerCatalogueRepository extends BaseRepository implements CustomerCatalogueRepositoryInterface {
    protected $model;

    public function __construct(CustomerCatalogue $model) {
        $this->model = $model;
    }
}