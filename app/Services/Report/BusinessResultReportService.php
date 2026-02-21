<?php

namespace App\Services\Report;

use App\Services\BaseService;
use App\Repositories\Receipt\SalesReceiptRepository;
use App\Repositories\Receipt\SalesReceiptItemRepository;
use App\Repositories\Journal\JournalEntryDetailRepository;
use App\Repositories\Product\ProductVariantRepository;
use App\Repositories\Inventory\InventoryTransactionRepository;
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
    protected $inventoryTransactionRepository;

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
        ProductVariantRepository $productVariantRepository,
        InventoryTransactionRepository $inventoryTransactionRepository
    ) {
        $this->salesReceiptRepository = $salesReceiptRepository;
        $this->salesReceiptItemRepository = $salesReceiptItemRepository;
        $this->journalEntryDetailRepository = $journalEntryDetailRepository;
        $this->productVariantRepository = $productVariantRepository;
        $this->inventoryTransactionRepository = $inventoryTransactionRepository;
    }

    /**
     * Lấy báo cáo kết quả kinh doanh theo năm
     */
    public function getBusinessResultReport(Request $request): array
    {
        $year = $request->input('year', now()->year);
        $previousYear = $year - 1;

        // Kỳ này (năm hiện tại)
        $currentStart = Carbon::createFromDate($year, 1, 1)->startOfDay();
        $currentEnd = Carbon::createFromDate($year, 12, 31)->endOfDay();

        // Kỳ trước (năm trước)
        $previousStart = Carbon::createFromDate($previousYear, 1, 1)->startOfDay();
        $previousEnd = Carbon::createFromDate($previousYear, 12, 31)->endOfDay();

        // Lấy dữ liệu năm hiện tại
        $currentData = $this->getYearlyData($currentStart, $currentEnd);

        // Lấy dữ liệu năm trước
        $previousData = $this->getYearlyData($previousStart, $previousEnd);

        // Tính toán các chỉ tiêu
        $currentNetRevenue = $currentData['revenue']['total'] - $currentData['revenue']['reductions'];
        $currentGrossProfit = $currentNetRevenue - $currentData['cogs']['total'];
        $currentOperatingProfit = $currentGrossProfit - ($currentData['expenses']['selling'] + $currentData['expenses']['admin']);
        $currentProfitBeforeTax = $currentOperatingProfit + ($currentData['other_income']['total'] - $currentData['other_expense']['total']);
        $currentIncomeTax = $currentProfitBeforeTax * 0.2; // Thuế suất 20%
        $currentProfitAfterTax = $currentProfitBeforeTax - $currentIncomeTax;

        $previousNetRevenue = $previousData['revenue']['total'] - $previousData['revenue']['reductions'];
        $previousGrossProfit = $previousNetRevenue - $previousData['cogs']['total'];
        $previousOperatingProfit = $previousGrossProfit - ($previousData['expenses']['selling'] + $previousData['expenses']['admin']);
        $previousProfitBeforeTax = $previousOperatingProfit + ($previousData['other_income']['total'] - $previousData['other_expense']['total']);
        $previousIncomeTax = $previousProfitBeforeTax * 0.2;
        $previousProfitAfterTax = $previousProfitBeforeTax - $previousIncomeTax;

        return [
            'period' => [
                'year' => $year,
                'previous_year' => $previousYear,
                'start_date' => $currentStart->format('d/m/Y'),
                'end_date' => $currentEnd->format('d/m/Y')
            ],

            // Dữ liệu năm nay
            'current' => [
                'revenue' => [
                    'total' => $currentData['revenue']['total'],
                    'reductions' => $currentData['revenue']['reductions'],
                    'net' => $currentNetRevenue,
                ],
                'cogs' => [
                    'total' => $currentData['cogs']['total'],
                ],
                'gross_profit' => $currentGrossProfit,
                'expenses' => [
                    'selling' => $currentData['expenses']['selling'],
                    'admin' => $currentData['expenses']['admin'],
                    'total' => $currentData['expenses']['selling'] + $currentData['expenses']['admin'],
                ],
                'operating_profit' => $currentOperatingProfit,
                'other_income' => $currentData['other_income']['total'],
                'other_expense' => $currentData['other_expense']['total'],
                'profit_before_tax' => $currentProfitBeforeTax,
                'income_tax' => $currentIncomeTax,
                'profit_after_tax' => $currentProfitAfterTax,
            ],

            // Dữ liệu năm trước
            'previous' => [
                'revenue' => [
                    'total' => $previousData['revenue']['total'],
                    'reductions' => $previousData['revenue']['reductions'],
                    'net' => $previousNetRevenue,
                ],
                'cogs' => [
                    'total' => $previousData['cogs']['total'],
                ],
                'gross_profit' => $previousGrossProfit,
                'expenses' => [
                    'selling' => $previousData['expenses']['selling'],
                    'admin' => $previousData['expenses']['admin'],
                    'total' => $previousData['expenses']['selling'] + $previousData['expenses']['admin'],
                ],
                'operating_profit' => $previousOperatingProfit,
                'other_income' => $previousData['other_income']['total'],
                'other_expense' => $previousData['other_expense']['total'],
                'profit_before_tax' => $previousProfitBeforeTax,
                'income_tax' => $previousIncomeTax,
                'profit_after_tax' => $previousProfitAfterTax,
            ],

            // So sánh tăng trưởng
            'comparison' => [
                'revenue' => [
                    'value' => $currentNetRevenue - $previousNetRevenue,
                    'percentage' => $previousNetRevenue > 0
                        ? round(($currentNetRevenue - $previousNetRevenue) / $previousNetRevenue * 100, 2)
                        : ($currentNetRevenue > 0 ? 100 : 0),
                ],
                'gross_profit' => [
                    'value' => $currentGrossProfit - $previousGrossProfit,
                    'percentage' => $previousGrossProfit > 0
                        ? round(($currentGrossProfit - $previousGrossProfit) / $previousGrossProfit * 100, 2)
                        : ($currentGrossProfit > 0 ? 100 : 0),
                ],
                'profit_before_tax' => [
                    'value' => $currentProfitBeforeTax - $previousProfitBeforeTax,
                    'percentage' => $previousProfitBeforeTax > 0
                        ? round(($currentProfitBeforeTax - $previousProfitBeforeTax) / $previousProfitBeforeTax * 100, 2)
                        : ($currentProfitBeforeTax > 0 ? 100 : 0),
                ],
                'profit_after_tax' => [
                    'value' => $currentProfitAfterTax - $previousProfitAfterTax,
                    'percentage' => $previousProfitAfterTax > 0
                        ? round(($currentProfitAfterTax - $previousProfitAfterTax) / $previousProfitAfterTax * 100, 2)
                        : ($currentProfitAfterTax > 0 ? 100 : 0),
                ],
            ],
        ];
    }

    /**
     * Lấy dữ liệu tổng hợp theo năm
     */
    protected function getYearlyData(Carbon $startDate, Carbon $endDate): array
    {
        return [
            'revenue' => [
                'total' => $this->journalEntryDetailRepository->getTotalRevenue($startDate, $endDate),
                'reductions' => $this->journalEntryDetailRepository->getTotalRevenueReduction($startDate, $endDate),
            ],
            'cogs' => [
                'total' => $this->journalEntryDetailRepository->getTotalCOGS($startDate, $endDate),
            ],
            'expenses' => [
                'selling' => $this->journalEntryDetailRepository->getTotalSellingExpense($startDate, $endDate),
                'admin' => $this->journalEntryDetailRepository->getTotalAdminExpense($startDate, $endDate),
            ],
            'other_income' => [
                'total' => $this->journalEntryDetailRepository->getTotalOtherIncome($startDate, $endDate),
            ],
            'other_expense' => [
                'total' => $this->journalEntryDetailRepository->getTotalOtherExpense($startDate, $endDate),
            ],
        ];
    }
}