<?php

namespace App\Services;

use App\Services\BaseService;
use App\Repositories\Receipt\SalesReceiptRepository;
use App\Repositories\Receipt\PurchaseReceiptRepository;
use App\Repositories\Voucher\PaymentVoucherRepository;
use App\Repositories\Voucher\ReceiptVoucherRepository;
use App\Repositories\Product\ProductVariantRepository;
use App\Repositories\Customer\CustomerRepository;
use App\Repositories\SupplierRepository;
use App\Repositories\Journal\JournalEntryDetailRepository;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardService extends BaseService
{
    protected $salesReceiptRepository;
    protected $purchaseReceiptRepository;
    protected $paymentVoucherRepository;
    protected $receiptVoucherRepository;
    protected $productVariantRepository;
    protected $customerRepository;
    protected $supplierRepository;
    protected $journalEntryDetailRepository;

    // Mã tài khoản
    const ACCOUNT_REVENUE = '511';
    const ACCOUNT_COGS = '632';
    const ACCOUNT_RECEIVABLE = '131';
    const ACCOUNT_PAYABLE = '331';
    const ACCOUNT_CASH = '111';
    const ACCOUNT_BANK = '112';

    public function __construct(
        SalesReceiptRepository $salesReceiptRepository,
        PurchaseReceiptRepository $purchaseReceiptRepository,
        PaymentVoucherRepository $paymentVoucherRepository,
        ReceiptVoucherRepository $receiptVoucherRepository,
        ProductVariantRepository $productVariantRepository,
        CustomerRepository $customerRepository,
        SupplierRepository $supplierRepository,
        JournalEntryDetailRepository $journalEntryDetailRepository
    ) {
        $this->salesReceiptRepository = $salesReceiptRepository;
        $this->purchaseReceiptRepository = $purchaseReceiptRepository;
        $this->paymentVoucherRepository = $paymentVoucherRepository;
        $this->receiptVoucherRepository = $receiptVoucherRepository;
        $this->productVariantRepository = $productVariantRepository;
        $this->customerRepository = $customerRepository;
        $this->supplierRepository = $supplierRepository;
        $this->journalEntryDetailRepository = $journalEntryDetailRepository;
    }

    /**
     * Lấy dữ liệu dashboard
     */
    public function getDashboardData(Request $request): array
    {
        $year = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);

        $startOfMonth = Carbon::createFromDate($year, $month, 1)->startOfDay();
        $endOfMonth = $startOfMonth->copy()->endOfMonth();
        $startOfYear = Carbon::createFromDate($year, 1, 1)->startOfDay();
        $today = Carbon::now();

        return [
            // Thống kê tổng quan
            'summary' => $this->getSummaryData($startOfMonth, $endOfMonth, $startOfYear, $today),

            // Biểu đồ doanh thu theo tháng
            'monthly_revenue' => $this->getMonthlyRevenueData($year),

            // Top sản phẩm bán chạy
            'top_products' => $this->getTopProducts($startOfMonth, $endOfMonth),

            // Công nợ
            'debts' => $this->getDebtData(),

            // Tồn kho
            'inventory' => $this->getInventoryData(),

            // Hoạt động gần đây
            'recent_activities' => $this->getRecentActivities(),

            // Dòng tiền
            'cash_flow' => $this->getCashFlowData($startOfMonth, $endOfMonth),

            // Thông tin thời gian
            'period' => [
                'current_month' => $month,
                'current_year' => $year,
                'month_name' => $this->getMonthName($month),
            ],
        ];
    }

    /**
     * Dữ liệu tổng quan
     */
    protected function getSummaryData($startOfMonth, $endOfMonth, $startOfYear, $today): array
    {
        // Doanh thu tháng này
        $monthlyRevenue = $this->salesReceiptRepository->findByCondition(
            [
                ['receipt_date', '>=', $startOfMonth],
                ['receipt_date', '<=', $endOfMonth],
                ['status', '=', 'confirmed']
            ],
            true,
            [],
            [],
            [DB::raw('COALESCE(SUM(grand_total), 0) as total')]
        )->first()->total ?? 0;

        // Doanh thu năm nay
        $yearlyRevenue = $this->salesReceiptRepository->findByCondition(
            [
                ['receipt_date', '>=', $startOfYear],
                ['receipt_date', '<=', $today],
                ['status', '=', 'confirmed']
            ],
            true,
            [],
            [],
            [DB::raw('COALESCE(SUM(grand_total), 0) as total')]
        )->first()->total ?? 0;

        // Chi phí mua hàng tháng này
        $monthlyPurchase = $this->purchaseReceiptRepository->findByCondition(
            [
                ['receipt_date', '>=', $startOfMonth],
                ['receipt_date', '<=', $endOfMonth],
                ['status', '=', 'confirmed']
            ],
            true,
            [],
            [],
            [DB::raw('COALESCE(SUM(grand_total), 0) as total')]
        )->first()->total ?? 0;

        // Lợi nhuận gộp (ước tính)
        $grossProfit = $monthlyRevenue * 0.2; // Tạm tính 20% lợi nhuận

        // Đếm số lượng
        $totalCustomers = $this->customerRepository->findByCondition(
            [['publish', '=', 1]],
            true,
            [],
            [],
            [DB::raw('COUNT(*) as total')]
        )->first()->total ?? 0;

        $totalSuppliers = $this->supplierRepository->findByCondition(
            [['publish', '=', 1]],
            true,
            [],
            [],
            [DB::raw('COUNT(*) as total')]
        )->first()->total ?? 0;

        $totalProducts = $this->productVariantRepository->findByCondition(
            [['publish', '=', 1]],
            true,
            [],
            [],
            [DB::raw('COUNT(*) as total')]
        )->first()->total ?? 0;

        // Tồn kho
        $inventoryValue = DB::table('product_variants')
            ->select(DB::raw('COALESCE(SUM(quantity * base_price), 0) as total'))
            ->first()->total ?? 0;

        // Tỷ lệ tăng trưởng so với tháng trước
        $lastMonthStart = $startOfMonth->copy()->subMonth();
        $lastMonthEnd = $endOfMonth->copy()->subMonth();

        $lastMonthRevenue = $this->salesReceiptRepository->findByCondition(
            [
                ['receipt_date', '>=', $lastMonthStart],
                ['receipt_date', '<=', $lastMonthEnd],
                ['status', '=', 'confirmed']
            ],
            true,
            [],
            [],
            [DB::raw('COALESCE(SUM(grand_total), 0) as total')]
        )->first()->total ?? 0;

        $revenueGrowth = $lastMonthRevenue > 0
            ? round(($monthlyRevenue - $lastMonthRevenue) / $lastMonthRevenue * 100, 2)
            : 100;

        return [
            'monthly_revenue' => (float)$monthlyRevenue,
            'yearly_revenue' => (float)$yearlyRevenue,
            'monthly_purchase' => (float)$monthlyPurchase,
            'gross_profit' => (float)$grossProfit,
            'total_customers' => (int)$totalCustomers,
            'total_suppliers' => (int)$totalSuppliers,
            'total_products' => (int)$totalProducts,
            'inventory_value' => (float)$inventoryValue,
            'revenue_growth' => $revenueGrowth,
            'profit_margin' => $monthlyRevenue > 0 ? round($grossProfit / $monthlyRevenue * 100, 2) : 0,
        ];
    }

    /**
     * Dữ liệu doanh thu theo tháng
     */
    protected function getMonthlyRevenueData($year): array
    {
        $months = [];

        for ($i = 1; $i <= 12; $i++) {
            $start = Carbon::createFromDate($year, $i, 1)->startOfDay();
            $end = $start->copy()->endOfMonth();

            $revenue = $this->salesReceiptRepository->findByCondition(
                [
                    ['receipt_date', '>=', $start],
                    ['receipt_date', '<=', $end],
                    ['status', '=', 'confirmed']
                ],
                true,
                [],
                [],
                [DB::raw('COALESCE(SUM(grand_total), 0) as total')]
            )->first()->total ?? 0;

            $months[] = [
                'month' => $i,
                'month_name' => $this->getMonthName($i),
                'revenue' => (float)$revenue,
            ];
        }

        return $months;
    }

    /**
     * Top sản phẩm bán chạy
     */
    protected function getTopProducts($startDate, $endDate, $limit = 10): array
    {
        $topProducts = DB::table('sales_receipt_items as sri')
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
                'pv.id',
                'pvl.name as product_name',
                'u.name as unit_name',
                DB::raw('SUM(sri.quantity) as total_quantity'),
                DB::raw('SUM(sri.quantity * sri.price) as total_revenue'),
                DB::raw('COUNT(DISTINCT sr.id) as order_count')
            )
            ->groupBy('pv.id', 'pvl.name', 'u.name')
            ->orderBy('total_quantity', 'DESC')
            ->limit($limit)
            ->get();

        return $topProducts->toArray();
    }

    /**
     * Dữ liệu công nợ
     */
    protected function getDebtData(): array
    {
        // Công nợ phải thu (131)
        $receivable = DB::table('journal_entry_details as jed')
            ->join('journal_entries as je', 'je.id', '=', 'jed.journal_entry_id')
            ->join('accounting_accounts as aa', 'aa.id', '=', 'jed.account_id')
            ->where('aa.account_code', self::ACCOUNT_RECEIVABLE)
            ->select(
                DB::raw('COALESCE(SUM(jed.debit), 0) as total_debit'),
                DB::raw('COALESCE(SUM(jed.credit), 0) as total_credit')
            )
            ->first();

        $receivableBalance = ($receivable->total_debit ?? 0) - ($receivable->total_credit ?? 0);

        // Công nợ phải trả (331)
        $payable = DB::table('journal_entry_details as jed')
            ->join('journal_entries as je', 'je.id', '=', 'jed.journal_entry_id')
            ->join('accounting_accounts as aa', 'aa.id', '=', 'jed.account_id')
            ->where('aa.account_code', self::ACCOUNT_PAYABLE)
            ->select(
                DB::raw('COALESCE(SUM(jed.credit), 0) as total_credit'),
                DB::raw('COALESCE(SUM(jed.debit), 0) as total_debit')
            )
            ->first();

        $payableBalance = ($payable->total_credit ?? 0) - ($payable->total_debit ?? 0);

        // Top khách hàng công nợ
        $topDebtors = DB::table('customer_debts')
            ->join('customers', 'customers.id', '=', 'customer_debts.customer_id')
            ->select(
                'customers.id',
                'customers.name',
                DB::raw('COALESCE(SUM(credit - debit), 0) as balance')
            )
            ->groupBy('customers.id', 'customers.name')
            ->having('balance', '>', 0)
            ->orderBy('balance', 'DESC')
            ->limit(5)
            ->get();

        return [
            'receivable' => (float)$receivableBalance,
            'payable' => (float)$payableBalance,
            'net_debt' => (float)($receivableBalance - $payableBalance),
            'top_debtors' => $topDebtors->toArray(),
        ];
    }

    /**
     * Dữ liệu tồn kho
     */
    protected function getInventoryData(): array
    {
        // Tổng giá trị tồn kho
        $totalValue = DB::table('product_variants')
            ->select(DB::raw('COALESCE(SUM(quantity * base_price), 0) as total'))
            ->first()->total ?? 0;

        // Số lượng sản phẩm tồn kho
        $totalItems = DB::table('product_variants')
            ->select(DB::raw('COALESCE(SUM(quantity), 0) as total'))
            ->first()->total ?? 0;

        // Sản phẩm sắp hết hàng (tồn < 10)
        $lowStock = DB::table('product_variants as pv')
            ->leftJoin('product_variant_languages as pvl', function ($join) {
                $join->on('pvl.product_variant_id', 'pv.id')
                    ->where('pvl.language_id', '=', 1);
            })
            ->where('pv.quantity', '<', 10)
            ->where('pv.quantity', '>', 0)
            ->select('pv.id', 'pvl.name as product_name', 'pv.quantity')
            ->orderBy('pv.quantity', 'ASC')
            ->limit(5)
            ->get();

        // Sản phẩm hết hàng
        $outOfStock = DB::table('product_variants')
            ->where('quantity', '<=', 0)
            ->count();

        return [
            'total_value' => (float)$totalValue,
            'total_items' => (float)$totalItems,
            'low_stock' => $lowStock->toArray(),
            'out_of_stock' => (int)$outOfStock,
        ];
    }

    /**
     * Hoạt động gần đây
     */
    protected function getRecentActivities($limit = 10): array
    {
        $activities = [];

        // Phiếu xuất gần đây
        $salesReceipts = $this->salesReceiptRepository->findByCondition(
            [],
            true,
            [
                [
                    'table' => 'customers',
                    'on' => [['customers.id', 'sales_receipts.customer_id']]
                ]
            ],
            ['sales_receipts.created_at' => 'DESC'],
            [
                'sales_receipts.id',
                'sales_receipts.code',
                'sales_receipts.receipt_date',
                'sales_receipts.grand_total',
                'sales_receipts.status',
                'sales_receipts.created_at',
                'customers.name as customer_name'
            ],
            [],
            $limit
        );

        foreach ($salesReceipts as $receipt) {
            $activities[] = [
                'type' => 'sales_receipt',
                'type_name' => 'Phiếu xuất',
                'icon' => 'shopping-cart',
                'code' => $receipt->code,
                'description' => "Xuất hàng cho {$receipt->customer_name}",
                'amount' => $receipt->grand_total,
                'status' => $receipt->status,
                'date' => $receipt->created_at,
                'date_formatted' => Carbon::parse($receipt->created_at)->diffForHumans(),
            ];
        }

        // Phiếu nhập gần đây
        $purchaseReceipts = $this->purchaseReceiptRepository->findByCondition(
            [],
            true,
            [
                [
                    'table' => 'suppliers',
                    'on' => [['suppliers.id', 'purchase_receipts.supplier_id']]
                ]
            ],
            ['purchase_receipts.created_at' => 'DESC'],
            [
                'purchase_receipts.id',
                'purchase_receipts.code',
                'purchase_receipts.receipt_date',
                'purchase_receipts.grand_total',
                'purchase_receipts.status',
                'purchase_receipts.created_at',
                'suppliers.name as supplier_name'
            ],
            [],
            $limit
        );

        foreach ($purchaseReceipts as $receipt) {
            $activities[] = [
                'type' => 'purchase_receipt',
                'type_name' => 'Phiếu nhập',
                'icon' => 'package',
                'code' => $receipt->code,
                'description' => "Nhập hàng từ {$receipt->supplier_name}",
                'amount' => $receipt->grand_total,
                'status' => $receipt->status,
                'date' => $receipt->created_at,
                'date_formatted' => Carbon::parse($receipt->created_at)->diffForHumans(),
            ];
        }

        // Sắp xếp theo thời gian
        usort($activities, function ($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });

        return array_slice($activities, 0, $limit);
    }

    /**
     * Dữ liệu dòng tiền
     */
    protected function getCashFlowData($startDate, $endDate): array
    {
        // Thu tiền (phiếu thu)
        $cashIn = $this->receiptVoucherRepository->findByCondition(
            [
                ['voucher_date', '>=', $startDate],
                ['voucher_date', '<=', $endDate],
                ['status', '=', 'confirmed']
            ],
            true,
            [],
            [],
            [DB::raw('COALESCE(SUM(amount), 0) as total')]
        )->first()->total ?? 0;

        // Chi tiền (phiếu chi)
        $cashOut = $this->paymentVoucherRepository->findByCondition(
            [
                ['voucher_date', '>=', $startDate],
                ['voucher_date', '<=', $endDate],
                ['status', '=', 'confirmed']
            ],
            true,
            [],
            [],
            [DB::raw('COALESCE(SUM(amount), 0) as total')]
        )->first()->total ?? 0;

        // Số dư tiền mặt và ngân hàng
        $cashBalance = DB::table('journal_entry_details as jed')
            ->join('journal_entries as je', 'je.id', '=', 'jed.journal_entry_id')
            ->join('accounting_accounts as aa', 'aa.id', '=', 'jed.account_id')
            ->whereIn('aa.account_code', [self::ACCOUNT_CASH, self::ACCOUNT_BANK])
            ->select(
                DB::raw('COALESCE(SUM(jed.debit), 0) as total_debit'),
                DB::raw('COALESCE(SUM(jed.credit), 0) as total_credit')
            )
            ->first();

        $balance = ($cashBalance->total_debit ?? 0) - ($cashBalance->total_credit ?? 0);

        return [
            'cash_in' => (float)$cashIn,
            'cash_out' => (float)$cashOut,
            'net_cash' => (float)($cashIn - $cashOut),
            'balance' => (float)$balance,
        ];
    }

    /**
     * Lấy tên tháng
     */
    protected function getMonthName($month): string
    {
        $months = [
            1 => 'Tháng 1',
            2 => 'Tháng 2',
            3 => 'Tháng 3',
            4 => 'Tháng 4',
            5 => 'Tháng 5',
            6 => 'Tháng 6',
            7 => 'Tháng 7',
            8 => 'Tháng 8',
            9 => 'Tháng 9',
            10 => 'Tháng 10',
            11 => 'Tháng 11',
            12 => 'Tháng 12',
        ];
        return $months[$month] ?? "Tháng {$month}";
    }
}
