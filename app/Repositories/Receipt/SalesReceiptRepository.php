<?php

namespace App\Repositories\Receipt;

use App\Repositories\BaseRepository;
use App\Models\SalesReceipt;
use Illuminate\Support\Collection;

class SalesReceiptRepository extends BaseRepository
{
    protected $model;

    public function __construct(SalesReceipt $model)
    {
        $this->model = $model;
        parent::__construct($model);
    }

    /**
     * Lấy thông tin sales receipt với các quan hệ
     */
    public function getSalesReceiptWithRelations(int $id): ?SalesReceipt
    {
        return $this->model->with(['customer', 'items', 'createdBy'])->find($id);
    }

    /**
     * Lấy thông tin cơ bản của sales receipt (code, note, receipt_date)
     */
    public function getBasicInfo(int $id): array
    {
        $receipt = $this->findById($id, ['code', 'note', 'receipt_date']);
        
        if (!$receipt) {
            return [];
        }

        return [
            'code' => $receipt->code,
            'note' => $receipt->note,
            'receipt_date' => $receipt->receipt_date,
        ];
    }

    /**
     * Lấy danh sách sales receipt theo điều kiện
     */
    public function getSalesReceiptsByCondition(array $condition = []): Collection
    {
        return $this->findByCondition($condition, true);
    }

    /**
     * Lấy tổng tiền của sales receipt
     */
    public function getTotalAmount(int $id): float
    {
        $receipt = $this->findById($id, ['grand_total']);
        return $receipt ? (float)$receipt->grand_total : 0;
    }

    /**
     * Kiểm tra sales receipt có tồn tại không
     */
    public function exists(int $id): bool
    {
        return $this->model->where('id', $id)->exists();
    }
}