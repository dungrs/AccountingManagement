<?php

namespace App\Repositories\Customer;

use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Customer\CustomerRepositoryInterface;
use App\Models\Customer;
use Carbon\Carbon; // Đảm bảo Carbon được import để làm việc với thời gian

class CustomerRepository extends BaseRepository implements CustomerRepositoryInterface {
    protected $model;

    public function __construct(Customer $model) {
        $this->model = $model;
    }

    public function totalCustomer() {
        return $this->model->count();   
    }

    public function newCustomersLast7Days() {
        return $this->model->where('created_at', '>=', Carbon::now()->subDays(7))->count();
    }
}
