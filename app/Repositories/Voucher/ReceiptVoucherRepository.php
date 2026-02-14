<?php

namespace App\Repositories\Voucher;
use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Voucher\ReceiptVoucherRepositoryInterface;
use App\Models\ReceiptVoucher;


class ReceiptVoucherRepository extends BaseRepository implements ReceiptVoucherRepositoryInterface {
    protected $model;

    public function __construct(ReceiptVoucher $model) {
        $this->model = $model;
    }
}