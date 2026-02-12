<?php

namespace App\Repositories\Price;
use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Price\PriceListRepositoryInterface;
use App\Models\PriceList;


class PriceListRepository extends BaseRepository implements PriceListRepositoryInterface {
    protected $model;

    public function __construct(PriceList $model) {
        $this->model = $model;
    }
}