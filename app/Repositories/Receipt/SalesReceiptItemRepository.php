<?php

namespace App\Repositories\Receipt;
use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Receipt\SalesReceiptItemRepositoryInterface;
use App\Models\SalesReceiptItem;


class SalesReceiptItemRepository extends BaseRepository implements SalesReceiptItemRepositoryInterface {
    protected $model;

    public function __construct(SalesReceiptItem $model) {
        $this->model = $model;
    }
}