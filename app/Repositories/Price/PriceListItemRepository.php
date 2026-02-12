<?php

namespace App\Repositories\Price;

use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Price\PriceListItemRepositoryInterface;
use App\Models\PriceListItem;

class PriceListItemRepository extends BaseRepository implements PriceListItemRepositoryInterface {
    protected $model;

    public function __construct(PriceListItem $model) {
        $this->model = $model;
    }
}
