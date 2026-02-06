<?php

namespace App\Repositories\Location;
use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Location\ProvinceRepositoryInterface;
use App\Models\Province;


class ProvinceRepository extends BaseRepository implements ProvinceRepositoryInterface {
    protected $model;

    public function __construct(Province $model) {
        $this->model = $model;
    }
}
