<?php

namespace App\Repositories\Debt;
use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Debt\CustomerDebtRepositoryInterface;
use App\Models\CustomerDebt;


class CustomerDebtRepository extends BaseRepository implements CustomerDebtRepositoryInterface {
    protected $model;

    public function __construct(CustomerDebt $model) {
        $this->model = $model;
    }
}