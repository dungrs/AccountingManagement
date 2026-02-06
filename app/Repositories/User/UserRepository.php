<?php

namespace App\Repositories\User;
use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\User\UserRepositoryInterface;
use App\Models\User;


class UserRepository extends BaseRepository implements UserRepositoryInterface {
    protected $model;

    public function __construct(User $model) {
        $this->model = $model;
    }
}