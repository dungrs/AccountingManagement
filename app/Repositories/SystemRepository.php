<?php

namespace App\Repositories;

use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\SystemRepositoryInterface;
use App\Models\System;


class SystemRepository extends BaseRepository implements SystemRepositoryInterface
{
    protected $model;

    public function __construct(System $model)
    {
        $this->model = $model;
    }
}
