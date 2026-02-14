<?php

namespace App\Repositories\Receipt;
use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Receipt\SalesReceiptRepositoryInterface;
use App\Models\SalesReceipt;


class SalesReceiptRepository extends BaseRepository implements SalesReceiptRepositoryInterface {
    protected $model;

    public function __construct(SalesReceipt $model) {
        $this->model = $model;
    }
}