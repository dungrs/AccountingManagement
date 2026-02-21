<?php

namespace App\Repositories\Receipt;

use App\Repositories\BaseRepository;
use App\Models\PurchaseReceipt;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class PurchaseReceiptRepository extends BaseRepository
{
    protected $model;

    public function __construct(PurchaseReceipt $model)
    {
        $this->model = $model;
        parent::__construct($model);
    }

    /**
     * Lấy tổng chi phí mua hàng trong khoảng thời gian
     */
    public function getTotalPurchase(Carbon $startDate, Carbon $endDate): float
    {
        return (float) $this->model
            ->whereBetween('receipt_date', [$startDate, $endDate])
            ->where('status', 'confirmed')
            ->sum('grand_total');
    }


    /**
     * Lấy thông tin purchase receipt với các quan hệ
     */
    public function getPurchaseReceiptWithRelations(int $id): ?PurchaseReceipt
    {
        return $this->model->with(['supplier', 'items', 'createdBy'])->find($id);
    }

    /**
     * Lấy thông tin cơ bản của purchase receipt (code, note, receipt_date)
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
     * Lấy danh sách purchase receipt theo điều kiện
     */
    public function getPurchaseReceiptsByCondition(array $condition = []): Collection
    {
        return $this->findByCondition($condition, true);
    }

    /**
     * Lấy tổng tiền của purchase receipt
     */
    public function getTotalAmount(int $id): float
    {
        $receipt = $this->findById($id, ['grand_total']);
        return $receipt ? (float)$receipt->grand_total : 0;
    }

    /**
     * Kiểm tra purchase receipt có tồn tại không
     */
    public function exists(int $id): bool
    {
        return $this->model->where('id', $id)->exists();
    }
}
