<?php

namespace App\Repositories;

use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\SupplierRepositoryInterface;
use App\Models\Supplier;

class SupplierRepository extends BaseRepository implements SupplierRepositoryInterface
{
    protected $model;

    public function __construct(Supplier $model)
    {
        $this->model = $model;
    }

    /**
     * Đếm số nhà cung cấp đang hoạt động
     */
    public function countActiveSuppliers(): int
    {
        return $this->model->where('publish', 1)->count();
    }
}