<?php

namespace App\Repositories;

use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\VatTaxRepositoryInterface;
use App\Models\VatTax;


class VatTaxRepository extends BaseRepository implements VatTaxRepositoryInterface
{
    protected $model;

    public function __construct(VatTax $model)
    {
        $this->model = $model;
    }
}
