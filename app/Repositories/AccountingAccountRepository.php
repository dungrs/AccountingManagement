<?php

namespace App\Repositories;

use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\AccountingAccountRepositoryInterface;
use App\Models\AccountingAccount;


class AccountingAccountRepository extends BaseRepository implements AccountingAccountRepositoryInterface
{
    protected $model;

    public function __construct(AccountingAccount $model)
    {
        $this->model = $model;
    }
}
