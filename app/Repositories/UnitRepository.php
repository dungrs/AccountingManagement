<?php

namespace App\Repositories;

use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\UnitRepositoryInterface;
use App\Models\Unit;


class UnitRepository extends BaseRepository implements UnitRepositoryInterface
{
    protected $model;

    public function __construct(Unit $model)
    {
        $this->model = $model;
    }
}
