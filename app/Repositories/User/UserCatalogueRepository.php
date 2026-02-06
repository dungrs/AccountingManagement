<?php

namespace App\Repositories\User;
use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\User\UserCatalogueRepositoryInterface;
use App\Models\UserCatalogue;


class UserCatalogueRepository extends BaseRepository implements UserCatalogueRepositoryInterface {
    protected $model;

    public function __construct(UserCatalogue $model) {
        $this->model = $model;
    }
}