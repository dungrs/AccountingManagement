<?php

namespace App\Repositories\Receipt;

use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Receipt\PurchaseReceiptItemRepositoryInterface;
use App\Models\PurchaseReceiptItem;

class PurchaseReceiptItemRepository extends BaseRepository implements PurchaseReceiptItemRepositoryInterface {
    protected $model;

    public function __construct(PurchaseReceiptItem $model) {
        $this->model = $model;
    }
}
