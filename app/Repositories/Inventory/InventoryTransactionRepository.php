<?php

namespace App\Repositories\Inventory;

use App\Repositories\BaseRepository;
use App\Models\InventoryTransaction;
use App\Repositories\Interfaces\Inventory\InventoryTransactionRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class InventoryTransactionRepository extends BaseRepository implements InventoryTransactionRepositoryInterface
{
    protected $model;

    public function __construct(InventoryTransaction $model)
    {
        $this->model = $model;
        parent::__construct($model);
    }

    /**
     * Lấy tổng hợp số lượng và giá trị theo sản phẩm
     */
    public function getAggregatedByProduct(
        int $productVariantId, 
        ?Carbon $fromDate = null, 
        ?Carbon $toDate = null,
        ?string $transactionType = null
    ): array {
        $query = $this->model
            ->where('product_variant_id', $productVariantId);
        
        if ($fromDate) {
            $query->where('transaction_date', '>=', $fromDate);
        }
        
        if ($toDate) {
            $query->where('transaction_date', '<=', $toDate);
        }
        
        if ($transactionType) {
            $query->where('transaction_type', $transactionType);
        }
        
        $result = $query->select(
            DB::raw('COALESCE(SUM(quantity), 0) as total_quantity'),
            DB::raw('COALESCE(SUM(total_cost), 0) as total_value')
        )->first();
        
        return [
            'total_quantity' => (float)$result->total_quantity,
            'total_value' => (float)$result->total_value,
        ];
    }

    /**
     * Lấy lịch sử giao dịch theo reference
     */
    public function getByReference(string $referenceType, int $referenceId)
    {
        return $this->findByCondition([
            ['reference_type', '=', $referenceType],
            ['reference_id', '=', $referenceId],
        ], true);
    }

    /**
     * Xóa giao dịch theo reference
     */
    public function deleteByReference(string $referenceType, int $referenceId)
    {
        return $this->deleteByCondition([
            ['reference_type', '=', $referenceType],
            ['reference_id', '=', $referenceId],
        ]);
    }
}