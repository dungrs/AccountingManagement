<?php

namespace App\Repositories;

use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\BankRepositoryInterface;
use App\Models\Bank;


class BankRepository extends BaseRepository implements BankRepositoryInterface
{
    protected $model;

    public function __construct(Bank $model)
    {
        $this->model = $model;
    }
}
