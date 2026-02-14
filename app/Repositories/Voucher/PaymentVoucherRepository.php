<?php

namespace App\Repositories\Voucher;

use App\Repositories\BaseRepository;
use App\Repositories\Interfaces\Voucher\PaymentVoucherRepositoryInterface;
use App\Models\PaymentVoucher;

class PaymentVoucherRepository extends BaseRepository implements PaymentVoucherRepositoryInterface {
    protected $model;

    public function __construct(PaymentVoucher $model) {
        $this->model = $model;
    }
}
