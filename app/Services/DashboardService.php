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
use App\Repositories\Debt\CustomerDebtRepository;
use App\Repositories\Debt\SupplierDebtRepository;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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
    protected $customerDebtRepository;
    protected $supplierDebtRepository;

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
        JournalEntryDetailRepository $journalEntryDetailRepository,
        CustomerDebtRepository $customerDebtRepository,
        SupplierDebtRepository $supplierDebtRepository
    ) {
        $this->salesReceiptRepository = $salesReceiptRepository;
        $this->purchaseReceiptRepository = $purchaseReceiptRepository;
        $this->paymentVoucherRepository = $paymentVoucherRepository;
        $this->receiptVoucherRepository = $receiptVoucherRepository;
        $this->productVariantRepository = $productVariantRepository;
        $this->customerRepository = $customerRepository;
        $this->supplierRepository = $supplierRepository;
        $this->journalEntryDetailRepository = $journalEntryDetailRepository;
        $this->customerDebtRepository = $customerDebtRepository;
        $this->supplierDebtRepository = $supplierDebtRepository;
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
            'inventory' => $this->productVariantRepository->getInventorySummary(),

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
        $monthlyRevenue = $this->salesReceiptRepository->getTotalRevenue($startOfMonth, $endOfMonth);

        // Doanh thu năm nay
        $yearlyRevenue = $this->salesReceiptRepository->getTotalRevenue($startOfYear, $today);

        // Chi phí mua hàng tháng này
        $monthlyPurchase = $this->purchaseReceiptRepository->getTotalPurchase($startOfMonth, $endOfMonth);

        // Lợi nhuận gộp
        $cogs = $this->journalEntryDetailRepository->getTotalCOGS($startOfMonth, $endOfMonth);
        $grossProfit = $monthlyRevenue - $cogs;

        // Đếm số lượng
        $totalCustomers = $this->customerRepository->countActiveCustomers();
        $totalSuppliers = $this->supplierRepository->countActiveSuppliers();
        $totalProducts = $this->productVariantRepository->countActiveProducts();

        // Giá trị tồn kho
        $inventoryValue = $this->productVariantRepository->getTotalInventoryValue();

        // Tỷ lệ tăng trưởng so với tháng trước
        $lastMonthStart = $startOfMonth->copy()->subMonth();
        $lastMonthEnd = $endOfMonth->copy()->subMonth();

        $lastMonthRevenue = $this->salesReceiptRepository->getTotalRevenue($lastMonthStart, $lastMonthEnd);

        $revenueGrowth = $lastMonthRevenue > 0
            ? round(($monthlyRevenue - $lastMonthRevenue) / $lastMonthRevenue * 100, 2)
            : ($monthlyRevenue > 0 ? 100 : 0);

        return [
            'monthly_revenue' => (float)$monthlyRevenue,
            'yearly_revenue' => (float)$yearlyRevenue,
            'monthly_purchase' => (float)$monthlyPurchase,
            'gross_profit' => (float)($grossProfit > 0 ? $grossProfit : $monthlyRevenue * 0.2), // Fallback 20%
            'total_customers' => (int)$totalCustomers,
            'total_suppliers' => (int)$totalSuppliers,
            'total_products' => (int)$totalProducts,
            'inventory_value' => (float)$inventoryValue,
            'revenue_growth' => $revenueGrowth,
            'profit_margin' => $monthlyRevenue > 0 ? round(($grossProfit > 0 ? $grossProfit : $monthlyRevenue * 0.2) / $monthlyRevenue * 100, 2) : 0,
        ];
    }

    /**
     * Dữ liệu doanh thu theo tháng
     */
    protected function getMonthlyRevenueData($year): array
    {
        $months = [];

        for ($i = 1; $i <= 12; $i++) {
            $revenue = $this->salesReceiptRepository->getMonthlyRevenue($year, $i);

            $months[] = [
                'month' => $i,
                'month_name' => $this->getMonthName($i),
                'revenue' => (float)$revenue,
            ];
        }

        return $months;
    }

    /**
     * Dữ liệu công nợ
     */
    protected function getDebtData(): array
    {
        $customerSummary = $this->customerDebtRepository->getCustomerDebtSummary();
        $supplierSummary = $this->supplierDebtRepository->getSupplierDebtSummary();

        return [
            'receivable' => $customerSummary['receivable'],
            'payable' => $supplierSummary['payable'],
            'net_debt' => $customerSummary['receivable'] - $supplierSummary['payable'],
            'top_debtors' => $customerSummary['top_debtors'],
            'top_creditors' => $supplierSummary['top_creditors'],
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

        // Phiếu thu gần đây
        $receiptVouchers = $this->receiptVoucherRepository->findByCondition(
            [],
            true,
            [
                [
                    'table' => 'customers',
                    'on' => [['customers.id', 'receipt_vouchers.customer_id']]
                ]
            ],
            ['receipt_vouchers.created_at' => 'DESC'],
            [
                'receipt_vouchers.id',
                'receipt_vouchers.code',
                'receipt_vouchers.voucher_date',
                'receipt_vouchers.amount',
                'receipt_vouchers.status',
                'receipt_vouchers.created_at',
                'customers.name as customer_name'
            ],
            [],
            $limit
        );

        foreach ($receiptVouchers as $voucher) {
            $activities[] = [
                'type' => 'receipt_voucher',
                'type_name' => 'Phiếu thu',
                'icon' => 'wallet',
                'code' => $voucher->code,
                'description' => "Thu tiền từ {$voucher->customer_name}",
                'amount' => $voucher->amount,
                'status' => $voucher->status,
                'date' => $voucher->created_at,
                'date_formatted' => Carbon::parse($voucher->created_at)->diffForHumans(),
            ];
        }

        // Phiếu chi gần đây
        $paymentVouchers = $this->paymentVoucherRepository->findByCondition(
            [],
            true,
            [
                [
                    'table' => 'suppliers',
                    'on' => [['suppliers.id', 'payment_vouchers.supplier_id']]
                ]
            ],
            ['payment_vouchers.created_at' => 'DESC'],
            [
                'payment_vouchers.id',
                'payment_vouchers.code',
                'payment_vouchers.voucher_date',
                'payment_vouchers.amount',
                'payment_vouchers.status',
                'payment_vouchers.created_at',
                'suppliers.name as supplier_name'
            ],
            [],
            $limit
        );

        foreach ($paymentVouchers as $voucher) {
            $activities[] = [
                'type' => 'payment_voucher',
                'type_name' => 'Phiếu chi',
                'icon' => 'credit-card',
                'code' => $voucher->code,
                'description' => "Chi tiền cho {$voucher->supplier_name}",
                'amount' => $voucher->amount,
                'status' => $voucher->status,
                'date' => $voucher->created_at,
                'date_formatted' => Carbon::parse($voucher->created_at)->diffForHumans(),
            ];
        }

        // Sắp xếp theo thời gian
        usort($activities, function ($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });

        return array_slice($activities, 0, $limit);
    }

    /**
     * Top sản phẩm bán chạy
     */
    protected function getTopProducts($startDate, $endDate, $limit = 10): array
    {
        // Lấy ngôn ngữ hiện tại
        $currentLanguageId = session('currentLanguage', 1);

        // Lấy danh sách top sản phẩm bán chạy
        $topProducts = DB::table('sales_receipt_items as sri')
            ->join('sales_receipts as sr', 'sr.id', '=', 'sri.sales_receipt_id')
            ->join('product_variants as pv', 'pv.id', '=', 'sri.product_variant_id')
            ->leftJoin('units as u', 'u.id', '=', 'pv.unit_id')
            ->whereBetween('sr.receipt_date', [$startDate, $endDate])
            ->where('sr.status', 'confirmed')
            ->select(
                'pv.id',
                'pv.sku',
                'pv.barcode',
                'u.name as unit_name',
                DB::raw('SUM(sri.quantity) as total_quantity'),
                DB::raw('SUM(sri.quantity * sri.price) as total_revenue'),
                DB::raw('COUNT(DISTINCT sr.id) as order_count')
            )
            ->groupBy('pv.id', 'pv.sku', 'pv.barcode', 'u.name')
            ->orderBy('total_quantity', 'DESC')
            ->limit($limit)
            ->get();

        // Format kết quả với tên sản phẩm đầy đủ
        $formattedProducts = [];

        foreach ($topProducts as $product) {
            // Lấy tên sản phẩm đầy đủ (bao gồm cả tên biến thể)
            $productName = $this->getProductFullName($product->id, $currentLanguageId);

            $formattedProducts[] = [
                'id' => $product->id,
                'sku' => $product->sku,
                'barcode' => $product->barcode,
                'product_name' => $productName,
                'unit_name' => $product->unit_name,
                'total_quantity' => (float)$product->total_quantity,
                'total_revenue' => (float)$product->total_revenue,
                'order_count' => (int)$product->order_count,
            ];
        }

        return $formattedProducts;
    }

    /**
     * Lấy tên đầy đủ của sản phẩm (bao gồm tên biến thể)
     */
    protected function getProductFullName($productVariantId, $languageId): string
    {
        try {
            // Lấy thông tin product variant kèm theo product và translations
            $variant = $this->productVariantRepository->findByCondition(
                [
                    ['product_variants.id', '=', $productVariantId]
                ],
                false,
                [
                    [
                        'table' => 'products',
                        'on' => [['products.id', 'product_variants.product_id']],
                        'type' => 'inner'
                    ],
                    [
                        'table' => 'product_languages',
                        'on' => [['product_languages.product_id', 'products.id']],
                        'type' => 'left'
                    ],
                    [
                        'table' => 'product_variant_languages',
                        'on' => [['product_variant_languages.product_variant_id', 'product_variants.id']],
                        'type' => 'left'
                    ]
                ],
                [],
                [
                    'product_variants.id',
                    'product_variants.sku',
                    'product_languages.name as product_name',
                    'product_variant_languages.name as variant_name'
                ]
            );

            if ($variant) {
                $productName = $variant->product_name ?? '';
                $variantName = $variant->variant_name ?? '';

                // Kết hợp tên sản phẩm và tên biến thể
                $fullName = $productName;
                if ($variantName) {
                    $fullName .= ' - ' . $variantName;
                }

                return $fullName;
            }
        } catch (\Exception $e) {
            Log::error('Error in getProductFullName: ' . $e->getMessage());
        }

        // Fallback: trả về SKU nếu không tìm thấy tên
        return 'SP-' . $productVariantId;
    }

    /**
     * Dữ liệu dòng tiền
     */
    protected function getCashFlowData($startDate, $endDate): array
    {
        // Thu tiền (phiếu thu)
        $cashIn = $this->receiptVoucherRepository->getTotalCashIn($startDate, $endDate);

        // Chi tiền (phiếu chi)
        $cashOut = $this->paymentVoucherRepository->getTotalCashOut($startDate, $endDate);

        // Số dư tiền mặt và ngân hàng
        $balance = $this->journalEntryDetailRepository->getCashBalance([self::ACCOUNT_CASH, self::ACCOUNT_BANK]);

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
