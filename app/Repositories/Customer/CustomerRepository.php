<?php

namespace App\Repositories\Customer;

use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Customer\CustomerRepositoryInterface;
use App\Models\Customer;

class CustomerRepository extends BaseRepository implements CustomerRepositoryInterface
{
    protected $model;

    public function __construct(Customer $model)
    {
        $this->model = $model;
    }

    /**
     * Đếm số khách hàng đang hoạt động
     */
    public function countActiveCustomers(): int
    {
        return $this->model->where('publish', 1)->count();
    }
}