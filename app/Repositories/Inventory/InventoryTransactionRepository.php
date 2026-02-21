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

    /**
     * Lấy chi tiết giá vốn theo từng phiếu xuất
     */
    public function getCOGSDetails(Carbon $startDate, Carbon $endDate)
    {
        return DB::table('inventory_transactions as it')
            ->join('product_variants as pv', 'pv.id', '=', 'it.product_variant_id')
            ->leftJoin('product_variant_languages as pvl', function ($join) {
                $join->on('pvl.product_variant_id', 'pv.id')
                    ->where('pvl.language_id', '=', 1);
            })
            ->join('sales_receipts as sr', function ($join) {
                $join->on('sr.id', '=', 'it.reference_id')
                    ->where('it.reference_type', '=', 'sales_receipt');
            })
            ->whereBetween('it.transaction_date', [$startDate, $endDate])
            ->where('it.transaction_type', 'outbound')
            ->select(
                'sr.id',
                'sr.code',
                'sr.receipt_date',
                'it.product_variant_id',
                'pvl.name as product_name',
                DB::raw('SUM(it.quantity) as quantity'),
                DB::raw('AVG(it.unit_cost) as unit_cost'),
                DB::raw('SUM(it.total_cost) as total_cost')
            )
            ->groupBy('sr.id', 'sr.code', 'sr.receipt_date', 'it.product_variant_id', 'pvl.name')
            ->orderBy('sr.receipt_date', 'DESC')
            ->get();
    }

    /**
     * Lấy tổng giá vốn theo sản phẩm
     */
    public function getTotalCOGSByProduct(int $productVariantId, Carbon $startDate, Carbon $endDate): float
    {
        $result = DB::table('inventory_transactions')
            ->where('product_variant_id', $productVariantId)
            ->where('reference_type', 'sales_receipt')
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->where('transaction_type', 'outbound')
            ->select(DB::raw('COALESCE(SUM(total_cost), 0) as total_cogs'))
            ->first();

        return (float)($result->total_cogs ?? 0);
    }
}