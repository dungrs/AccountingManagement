<?php

namespace App\Repositories\Receipt;

use App\Repositories\BaseRepository;
use App\Models\SalesReceipt;
use App\Repositories\Interfaces\Receipt\SalesReceiptRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SalesReceiptRepository extends BaseRepository implements SalesReceiptRepositoryInterface
{
    protected $model;

    public function __construct(SalesReceipt $model)
    {
        $this->model = $model;
        parent::__construct($model);
    }

    /**
     * Lấy tổng doanh thu trong khoảng thời gian
     */
    public function getTotalRevenue(Carbon $startDate, Carbon $endDate): float
    {
        return (float) $this->model
            ->whereBetween('receipt_date', [$startDate, $endDate])
            ->where('status', 'confirmed')
            ->sum('grand_total');
    }

    /**
     * Lấy doanh thu theo tháng
     */
    public function getMonthlyRevenue(int $year, int $month): float
    {
        $start = Carbon::createFromDate($year, $month, 1)->startOfDay();
        $end = $start->copy()->endOfMonth();

        return $this->getTotalRevenue($start, $end);
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

    /**
     * Lấy chi tiết doanh thu theo từng phiếu xuất
     */
    public function getRevenueDetails(Carbon $startDate, Carbon $endDate): Collection
    {
        return DB::table('sales_receipts as sr')
            ->join('sales_receipt_items as sri', 'sr.id', '=', 'sri.sales_receipt_id')
            ->join('product_variants as pv', 'pv.id', '=', 'sri.product_variant_id')
            ->leftJoin('product_variant_languages as pvl', function ($join) {
                $join->on('pvl.product_variant_id', 'pv.id')
                    ->where('pvl.language_id', '=', 1);
            })
            ->leftJoin('customers as c', 'c.id', '=', 'sr.customer_id')
            ->whereBetween('sr.receipt_date', [$startDate, $endDate])
            ->where('sr.status', 'confirmed')
            ->select(
                'sr.id',
                'sr.code',
                'sr.receipt_date',
                'c.name as customer_name',
                DB::raw('SUM(sri.quantity * sri.price) as amount'),
                DB::raw('SUM(sri.discount_amount) as discount'),
                DB::raw('SUM(sri.vat_amount) as vat_amount'),
                'pvl.name as product_name'
            )
            ->groupBy('sr.id', 'sr.code', 'sr.receipt_date', 'c.name', 'pvl.name')
            ->orderBy('sr.receipt_date', 'DESC')
            ->get();
    }
}
