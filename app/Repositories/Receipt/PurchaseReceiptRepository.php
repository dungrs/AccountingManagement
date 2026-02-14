<?php

namespace App\Repositories\Receipt;

use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Receipt\PurchaseReceiptRepositoryInterface;
use App\Models\PurchaseReceipt;

class PurchaseReceiptRepository extends BaseRepository implements PurchaseReceiptRepositoryInterface {
    protected $model;

    public function __construct(PurchaseReceipt $model) {
        $this->model = $model;
    }
}
