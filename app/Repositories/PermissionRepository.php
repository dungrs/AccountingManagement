<?php

namespace App\Repositories;
use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\PermissionRepositoryInterface;
use App\Models\Permission;


class PermissionRepository extends BaseRepository implements PermissionRepositoryInterface {
    protected $model;

    public function __construct(Permission $model) {
        $this->model = $model;
    }
}