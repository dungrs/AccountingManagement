<?php

namespace App\Repositories\Debt;

use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Debt\SupplierDebtRepositoryInterface;
use App\Models\SupplierDebt;

class SupplierDebtRepository extends BaseRepository implements SupplierDebtRepositoryInterface {
    protected $model;

    public function __construct(SupplierDebt $model) {
        $this->model = $model;
    }
}
