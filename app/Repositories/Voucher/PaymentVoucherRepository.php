<?php

namespace App\Repositories\Voucher;

use App\Repositories\BaseRepository;
use App\Models\PaymentVoucher;
use Illuminate\Support\Collection;

class PaymentVoucherRepository extends BaseRepository
{
    protected $model;

    public function __construct(PaymentVoucher $model)
    {
        $this->model = $model;
        parent::__construct($model);
    }

    /**
     * Lấy thông tin payment voucher với các quan hệ
     */
    public function getPaymentVoucherWithRelations(int $id): ?PaymentVoucher
    {
        return $this->model->with(['supplier'])->find($id);
    }

    /**
     * Lấy thông tin cơ bản của payment voucher (code, note, voucher_date)
     */
    public function getBasicInfo(int $id): array
    {
        $voucher = $this->findById($id, ['code', 'note', 'voucher_date']);
        
        if (!$voucher) {
            return [];
        }

        return [
            'code' => $voucher->code,
            'note' => $voucher->note,
            'voucher_date' => $voucher->voucher_date,
        ];
    }

    /**
     * Lấy danh sách payment voucher theo điều kiện
     */
    public function getPaymentVouchersByCondition(array $condition = []): Collection
    {
        return $this->findByCondition($condition, true);
    }

    /**
     * Kiểm tra payment voucher có tồn tại không
     */
    public function exists(int $id): bool
    {
        return $this->model->where('id', $id)->exists();
    }
}