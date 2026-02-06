<?php

namespace App\Repositories\Location;
use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Location\WardRepositoryInterface;
use App\Models\Ward;


class WardRepository extends BaseRepository implements WardRepositoryInterface {
    protected $model;

    public function __construct(Ward $model) {
        $this->model = $model;
    }
}