<?php

namespace App\Repositories\Voucher;

use App\Repositories\BaseRepository;
use App\Models\ReceiptVoucher;
use Illuminate\Support\Collection;

class ReceiptVoucherRepository extends BaseRepository
{
    protected $model;

    public function __construct(ReceiptVoucher $model)
    {
        $this->model = $model;
        parent::__construct($model);
    }

    /**
     * Lấy thông tin receipt voucher với các quan hệ
     */
    public function getReceiptVoucherWithRelations(int $id): ?ReceiptVoucher
    {
        return $this->model->with(['customer'])->find($id);
    }

    /**
     * Lấy thông tin cơ bản của receipt voucher (code, note, voucher_date)
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
     * Lấy danh sách receipt voucher theo điều kiện
     */
    public function getReceiptVouchersByCondition(array $condition = []): Collection
    {
        return $this->findByCondition($condition, true);
    }

    /**
     * Kiểm tra receipt voucher có tồn tại không
     */
    public function exists(int $id): bool
    {
        return $this->model->where('id', $id)->exists();
    }
}