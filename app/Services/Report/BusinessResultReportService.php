<?php

namespace App\Services\Report;

use App\Services\BaseService;
use App\Repositories\Receipt\SalesReceiptRepository;
use App\Repositories\Receipt\SalesReceiptItemRepository;
use App\Repositories\Journal\JournalEntryDetailRepository;
use App\Repositories\Product\ProductVariantRepository;
use App\Services\Interfaces\Report\BusinessResultReportServiceInterface;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BusinessResultReportService extends BaseService implements BusinessResultReportServiceInterface
{
    protected $salesReceiptRepository;
    protected $salesReceiptItemRepository;
    protected $journalEntryDetailRepository;
    protected $productVariantRepository;

    // Mã tài khoản
    const ACCOUNT_REVENUE = '5111';      // Doanh thu bán hàng
    const ACCOUNT_REVENUE_REDUCTION = '521'; // Các khoản giảm trừ doanh thu
    const ACCOUNT_COGS = '632';         // Giá vốn hàng bán
    const ACCOUNT_SELLING_EXPENSE = '641'; // Chi phí bán hàng
    const ACCOUNT_ADMIN_EXPENSE = '642';   // Chi phí quản lý
    const ACCOUNT_OTHER_INCOME = '711';    // Thu nhập khác
    const ACCOUNT_OTHER_EXPENSE = '811';   // Chi phí khác
    const ACCOUNT_VAT_OUTPUT = '3331';     // Thuế VAT đầu ra

    public function __construct(
        SalesReceiptRepository $salesReceiptRepository,
        SalesReceiptItemRepository $salesReceiptItemRepository,
        JournalEntryDetailRepository $journalEntryDetailRepository,
        ProductVariantRepository $productVariantRepository
    ) {
        $this->salesReceiptRepository = $salesReceiptRepository;
        $this->salesReceiptItemRepository = $salesReceiptItemRepository;
        $this->journalEntryDetailRepository = $journalEntryDetailRepository;
        $this->productVariantRepository = $productVariantRepository;
    }

    /**
     * Lấy báo cáo kết quả kinh doanh
     */
    public function getBusinessResultReport(Request $request): array
    {
        $periodData = $this->preparePeriodData($request);
        $previousPeriodData = $this->getPreviousPeriodData($periodData);

        // Lấy dữ liệu doanh thu
        $revenue = $this->getRevenueData($periodData['start_date'], $periodData['end_date']);
        
        // Lấy dữ liệu giá vốn
        $cogs = $this->getCOGSData($periodData['start_date'], $periodData['end_date']);
        
        // Lấy dữ liệu chi phí
        $expenses = $this->getExpenseData($periodData['start_date'], $periodData['end_date']);
        
        // Lấy dữ liệu thu nhập khác
        $otherIncome = $this->getOtherIncomeData($periodData['start_date'], $periodData['end_date']);
        
        // Lấy dữ liệu chi phí khác
        $otherExpense = $this->getOtherExpenseData($periodData['start_date'], $periodData['end_date']);

        // Tính toán các chỉ tiêu
        $netRevenue = $revenue['total'] - $revenue['reductions'];
        $grossProfit = $netRevenue - $cogs['total'];
        $operatingProfit = $grossProfit - ($expenses['selling'] + $expenses['admin']);
        $profitBeforeTax = $operatingProfit + ($otherIncome['total'] - $otherExpense['total']);
        $incomeTax = $profitBeforeTax * 0.2; // Thuế suất 20%
        $profitAfterTax = $profitBeforeTax - $incomeTax;

        // Lấy dữ liệu chi tiết theo mặt hàng
        $productDetails = $this->getProductDetails($periodData['start_date'], $periodData['end_date']);

        return [
            'period' => $periodData['period'],
            'previous_period' => $previousPeriodData['period'],
            
            // I. Doanh thu
            'revenue' => [
                'total' => $revenue['total'],
                'details' => $revenue['details'],
                'reductions' => $revenue['reductions'],
                'reduction_details' => $revenue['reduction_details'],
                'net' => $netRevenue,
            ],
            
            // II. Giá vốn
            'cogs' => [
                'total' => $cogs['total'],
                'details' => $cogs['details'],
            ],
            
            // III. Lợi nhuận gộp
            'gross_profit' => $grossProfit,
            
            // IV. Chi phí
            'expenses' => [
                'selling' => $expenses['selling'],
                'selling_details' => $expenses['selling_details'],
                'admin' => $expenses['admin'],
                'admin_details' => $expenses['admin_details'],
                'total' => $expenses['selling'] + $expenses['admin'],
            ],
            
            // V. Lợi nhuận từ HĐKD
            'operating_profit' => $operatingProfit,
            
            // VI. Thu nhập khác
            'other_income' => [
                'total' => $otherIncome['total'],
                'details' => $otherIncome['details'],
            ],
            
            // VII. Chi phí khác
            'other_expense' => [
                'total' => $otherExpense['total'],
                'details' => $otherExpense['details'],
            ],
            
            // VIII. Lợi nhuận trước thuế
            'profit_before_tax' => $profitBeforeTax,
            
            // IX. Thuế TNDN
            'income_tax' => $incomeTax,
            
            // X. Lợi nhuận sau thuế
            'profit_after_tax' => $profitAfterTax,
            
            // Chi tiết theo mặt hàng
            'product_details' => $productDetails,
            
            // So sánh với kỳ trước
            'comparison' => $this->calculateComparison([
                'revenue' => $netRevenue,
                'gross_profit' => $grossProfit,
                'profit_before_tax' => $profitBeforeTax,
                'profit_after_tax' => $profitAfterTax,
            ], $previousPeriodData),
        ];
    }

    /**
     * Lấy dữ liệu doanh thu
     */
    protected function getRevenueData(Carbon $startDate, Carbon $endDate): array
    {
        // Lấy doanh thu từ tài khoản 511
        $revenue = DB::table('journal_entry_details as jed')
            ->join('journal_entries as je', 'je.id', '=', 'jed.journal_entry_id')
            ->join('accounting_accounts as aa', 'aa.id', '=', 'jed.account_id')
            ->where('aa.account_code', self::ACCOUNT_REVENUE)
            ->whereBetween('je.entry_date', [$startDate, $endDate])
            ->select(
                DB::raw('COALESCE(SUM(jed.credit), 0) as total_revenue')
            )
            ->first();

        // Lấy chi tiết doanh thu theo từng phiếu xuất
        $details = DB::table('sales_receipts as sr')
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

        // Lấy các khoản giảm trừ doanh thu (chiết khấu, trả lại...)
        $reductions = DB::table('journal_entry_details as jed')
            ->join('journal_entries as je', 'je.id', '=', 'jed.journal_entry_id')
            ->join('accounting_accounts as aa', 'aa.id', '=', 'jed.account_id')
            ->where('aa.account_code', self::ACCOUNT_REVENUE_REDUCTION)
            ->whereBetween('je.entry_date', [$startDate, $endDate])
            ->select(
                DB::raw('COALESCE(SUM(jed.debit), 0) as total_reductions')
            )
            ->first();

        return [
            'total' => (float)($revenue->total_revenue ?? 0),
            'details' => $details,
            'reductions' => (float)($reductions->total_reductions ?? 0),
            'reduction_details' => [], // Có thể chi tiết sau
        ];
    }

    /**
     * Lấy dữ liệu giá vốn
     */
    protected function getCOGSData(Carbon $startDate, Carbon $endDate): array
    {
        // Lấy giá vốn từ tài khoản 632
        $cogs = DB::table('journal_entry_details as jed')
            ->join('journal_entries as je', 'je.id', '=', 'jed.journal_entry_id')
            ->join('accounting_accounts as aa', 'aa.id', '=', 'jed.account_id')
            ->where('aa.account_code', self::ACCOUNT_COGS)
            ->whereBetween('je.entry_date', [$startDate, $endDate])
            ->select(
                DB::raw('COALESCE(SUM(jed.debit), 0) as total_cogs')
            )
            ->first();

        // Lấy chi tiết giá vốn theo từng phiếu xuất
        $details = DB::table('inventory_transactions as it')
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

        return [
            'total' => (float)($cogs->total_cogs ?? 0),
            'details' => $details,
        ];
    }

    /**
     * Lấy dữ liệu chi phí
     */
    protected function getExpenseData(Carbon $startDate, Carbon $endDate): array
    {
        // Chi phí bán hàng (641)
        $selling = DB::table('journal_entry_details as jed')
            ->join('journal_entries as je', 'je.id', '=', 'jed.journal_entry_id')
            ->join('accounting_accounts as aa', 'aa.id', '=', 'jed.account_id')
            ->where('aa.account_code', self::ACCOUNT_SELLING_EXPENSE)
            ->whereBetween('je.entry_date', [$startDate, $endDate])
            ->select(
                DB::raw('COALESCE(SUM(jed.debit), 0) as total')
            )
            ->first();

        // Chi phí quản lý (642)
        $admin = DB::table('journal_entry_details as jed')
            ->join('journal_entries as je', 'je.id', '=', 'jed.journal_entry_id')
            ->join('accounting_accounts as aa', 'aa.id', '=', 'jed.account_id')
            ->where('aa.account_code', self::ACCOUNT_ADMIN_EXPENSE)
            ->whereBetween('je.entry_date', [$startDate, $endDate])
            ->select(
                DB::raw('COALESCE(SUM(jed.debit), 0) as total')
            )
            ->first();

        return [
            'selling' => (float)($selling->total ?? 0),
            'selling_details' => [],
            'admin' => (float)($admin->total ?? 0),
            'admin_details' => [],
        ];
    }

    /**
     * Lấy dữ liệu thu nhập khác
     */
    protected function getOtherIncomeData(Carbon $startDate, Carbon $endDate): array
    {
        $income = DB::table('journal_entry_details as jed')
            ->join('journal_entries as je', 'je.id', '=', 'jed.journal_entry_id')
            ->join('accounting_accounts as aa', 'aa.id', '=', 'jed.account_id')
            ->where('aa.account_code', self::ACCOUNT_OTHER_INCOME)
            ->whereBetween('je.entry_date', [$startDate, $endDate])
            ->select(
                DB::raw('COALESCE(SUM(jed.credit), 0) as total')
            )
            ->first();

        return [
            'total' => (float)($income->total ?? 0),
            'details' => [],
        ];
    }

    /**
     * Lấy dữ liệu chi phí khác
     */
    protected function getOtherExpenseData(Carbon $startDate, Carbon $endDate): array
    {
        $expense = DB::table('journal_entry_details as jed')
            ->join('journal_entries as je', 'je.id', '=', 'jed.journal_entry_id')
            ->join('accounting_accounts as aa', 'aa.id', '=', 'jed.account_id')
            ->where('aa.account_code', self::ACCOUNT_OTHER_EXPENSE)
            ->whereBetween('je.entry_date', [$startDate, $endDate])
            ->select(
                DB::raw('COALESCE(SUM(jed.debit), 0) as total')
            )
            ->first();

        return [
            'total' => (float)($expense->total ?? 0),
            'details' => [],
        ];
    }

    /**
     * Lấy chi tiết theo mặt hàng
     */
    protected function getProductDetails(Carbon $startDate, Carbon $endDate): array
    {
        $details = DB::table('sales_receipt_items as sri')
            ->join('sales_receipts as sr', 'sr.id', '=', 'sri.sales_receipt_id')
            ->join('product_variants as pv', 'pv.id', '=', 'sri.product_variant_id')
            ->leftJoin('product_variant_languages as pvl', function ($join) {
                $join->on('pvl.product_variant_id', 'pv.id')
                    ->where('pvl.language_id', '=', 1);
            })
            ->leftJoin('units as u', 'u.id', '=', 'pv.unit_id')
            ->whereBetween('sr.receipt_date', [$startDate, $endDate])
            ->where('sr.status', 'confirmed')
            ->select(
                'pv.id as product_variant_id',
                'pvl.name as product_name',
                'u.name as unit_name',
                DB::raw('SUM(sri.quantity) as total_quantity'),
                DB::raw('AVG(sri.price) as avg_price'),
                DB::raw('SUM(sri.quantity * sri.price) as revenue'),
                DB::raw('SUM(sri.discount_amount) as discount'),
                DB::raw('SUM(sri.vat_amount) as vat')
            )
            ->groupBy('pv.id', 'pvl.name', 'u.name')
            ->orderBy('revenue', 'DESC')
            ->get();

        // Tính giá vốn cho từng sản phẩm
        foreach ($details as $detail) {
            $cogs = DB::table('inventory_transactions')
                ->where('product_variant_id', $detail->product_variant_id)
                ->where('reference_type', 'sales_receipt')
                ->whereBetween('transaction_date', [$startDate, $endDate])
                ->where('transaction_type', 'outbound')
                ->select(
                    DB::raw('COALESCE(SUM(total_cost), 0) as total_cogs')
                )
                ->first();

            $detail->cogs = (float)($cogs->total_cogs ?? 0);
            $detail->profit = $detail->revenue - $detail->discount - $detail->cogs;
            $detail->profit_margin = $detail->revenue > 0 
                ? round(($detail->profit / $detail->revenue) * 100, 2) 
                : 0;
        }

        return $details->toArray();
    }

    /**
     * Lấy dữ liệu kỳ trước để so sánh
     */
    protected function getPreviousPeriodData(array $currentPeriod): array
    {
        $previousStart = $currentPeriod['start_date']->copy()->subMonth();
        $previousEnd = $currentPeriod['end_date']->copy()->subMonth();

        return [
            'period' => [
                'month' => $previousStart->month,
                'year' => $previousStart->year,
                'start_date' => $previousStart->format('d/m/Y'),
                'end_date' => $previousEnd->format('d/m/Y'),
            ],
            'revenue' => $this->getRevenueData($previousStart, $previousEnd)['total'],
            'gross_profit' => $this->getGrossProfit($previousStart, $previousEnd),
            'profit_before_tax' => $this->getProfitBeforeTax($previousStart, $previousEnd),
            'profit_after_tax' => $this->getProfitAfterTax($previousStart, $previousEnd),
        ];
    }

    /**
     * Tính lợi nhuận gộp kỳ trước
     */
    protected function getGrossProfit(Carbon $startDate, Carbon $endDate): float
    {
        $revenue = $this->getRevenueData($startDate, $endDate);
        $cogs = $this->getCOGSData($startDate, $endDate);
        
        return ($revenue['total'] - $revenue['reductions']) - $cogs['total'];
    }

    /**
     * Tính lợi nhuận trước thuế kỳ trước
     */
    protected function getProfitBeforeTax(Carbon $startDate, Carbon $endDate): float
    {
        $revenue = $this->getRevenueData($startDate, $endDate);
        $cogs = $this->getCOGSData($startDate, $endDate);
        $expenses = $this->getExpenseData($startDate, $endDate);
        $otherIncome = $this->getOtherIncomeData($startDate, $endDate);
        $otherExpense = $this->getOtherExpenseData($startDate, $endDate);

        $netRevenue = $revenue['total'] - $revenue['reductions'];
        $grossProfit = $netRevenue - $cogs['total'];
        $operatingProfit = $grossProfit - ($expenses['selling'] + $expenses['admin']);
        
        return $operatingProfit + ($otherIncome['total'] - $otherExpense['total']);
    }

    /**
     * Tính lợi nhuận sau thuế kỳ trước
     */
    protected function getProfitAfterTax(Carbon $startDate, Carbon $endDate): float
    {
        $profitBeforeTax = $this->getProfitBeforeTax($startDate, $endDate);
        return $profitBeforeTax * 0.8; // Sau thuế 20%
    }

    /**
     * Tính tỷ lệ so sánh với kỳ trước
     */
    protected function calculateComparison(array $current, array $previous): array
    {
        $comparison = [];
        
        foreach ($current as $key => $value) {
            $prevValue = $previous[$key] ?? 0;
            $comparison[$key] = [
                'current' => $value,
                'previous' => $prevValue,
                'absolute_change' => $value - $prevValue,
                'percentage_change' => $prevValue > 0 
                    ? round(($value - $prevValue) / $prevValue * 100, 2) 
                    : ($value > 0 ? 100 : 0),
            ];
        }

        return $comparison;
    }

    /**
     * Chuẩn bị dữ liệu kỳ báo cáo
     */
    protected function preparePeriodData(Request $request): array
    {
        $month = (int)($request->input('month') ?? now()->month);
        $year = (int)($request->input('year') ?? now()->year);

        $startDate = Carbon::createFromDate($year, $month, 1)->startOfDay();
        $endDate = $startDate->copy()->endOfMonth();

        return [
            'month' => $month,
            'year' => $year,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'period' => [
                'month' => $month,
                'year' => $year,
                'start_date' => $startDate->format('d/m/Y'),
                'end_date' => $endDate->format('d/m/Y')
            ]
        ];
    }
}